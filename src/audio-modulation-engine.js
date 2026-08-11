/**
 * GLOW — Audio Modulation Engine
 * ------------------------------------------------------------
 * Shared Web Audio input + FFT analysis for audio modulators.
 * Uses getUserMedia + AnalyserNode
 */

const DEFAULT_FFT_SIZE = 2048
const MAX_CHANNELS = 8
const MONITOR_HISTORY_SIZE = 128

const FEATURE_BANDS = {
  bass: [20, 150],
  mid: [150, 2000],
  treble: [2000, 8000],
  presence: [8000, 16000]
}

function historyKey (deviceId, channel, feature, freqMin, freqMax) {
  return `${deviceId || 'none'}|${channel}|${feature}|${freqMin}|${freqMax}`
}

export class AudioModulationEngine {
  constructor () {
    this.audioContext = null
    this.inputs = new Map()
    this.devices = []
    this.smoothedLevels = new Map()
    this.monitorHistories = new Map()
    this.permissionGranted = false
    this._deviceChangeHandler = null
  }

  async ensureAudioContext () {
    if (!this.audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) {
        throw new Error('Web Audio API is not available in this browser')
      }
      this.audioContext = new Ctx()
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
    return this.audioContext
  }

  async requestPermission () {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Audio input is not available in this browser')
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    this.permissionGranted = true
    return true
  }

  async refreshDevices () {
    if (!navigator.mediaDevices?.enumerateDevices) {
      this.devices = []
      return this.devices
    }

    if (!this.permissionGranted) {
      try {
        await this.requestPermission()
      } catch (error) {
        console.warn('Audio permission denied or unavailable:', error)
        this.devices = []
        return this.devices
      }
    }

    const devices = await navigator.mediaDevices.enumerateDevices()
    this.devices = devices
      .filter((device) => device.kind === 'audioinput')
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Audio Input ${index + 1}`,
        groupId: device.groupId || null
      }))

    if (!this._deviceChangeHandler && navigator.mediaDevices.addEventListener) {
      this._deviceChangeHandler = () => {
        this.refreshDevices().catch((error) => {
          console.warn('Failed to refresh audio devices:', error)
        })
      }
      navigator.mediaDevices.addEventListener(
        'devicechange',
        this._deviceChangeHandler
      )
    }

    return this.devices
  }

  getDevices () {
    return this.devices
  }

  findDevice (deviceId, deviceLabel = null) {
    if (deviceId) {
      const byId = this.devices.find((d) => d.deviceId === deviceId)
      if (byId) return byId
    }
    if (deviceLabel) {
      return this.devices.find((d) => d.label === deviceLabel) || null
    }
    return null
  }

  async ensureInput (deviceId) {
    if (!deviceId) return null
    if (this.inputs.has(deviceId)) {
      return this.inputs.get(deviceId)
    }

    await this.ensureAudioContext()

    const constraints = {
      audio: {
        deviceId: deviceId === 'default' ? undefined : { exact: deviceId },
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: { ideal: MAX_CHANNELS }
      }
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints)
    } catch (error) {
      // Fallback without exact device or channelCount constraints
      stream = await navigator.mediaDevices.getUserMedia({
        audio:
          deviceId && deviceId !== 'default'
            ? { deviceId: { ideal: deviceId } }
            : true
      })
    }

    const track = stream.getAudioTracks()[0]
    const settings = track?.getSettings?.() || {}
    const channelCount = Math.max(
      1,
      Math.min(MAX_CHANNELS, settings.channelCount || 1)
    )

    const source = this.audioContext.createMediaStreamSource(stream)
    const splitter = this.audioContext.createChannelSplitter(channelCount)
    source.connect(splitter)

    const channels = []
    for (let i = 0; i < channelCount; i++) {
      const analyser = this.audioContext.createAnalyser()
      analyser.fftSize = DEFAULT_FFT_SIZE
      analyser.smoothingTimeConstant = 0.5
      splitter.connect(analyser, i)
      channels.push({
        analyser,
        freqData: new Uint8Array(analyser.frequencyBinCount),
        timeData: new Uint8Array(analyser.fftSize)
      })
    }

    const input = {
      deviceId,
      stream,
      source,
      splitter,
      channelCount,
      channels,
      label: track?.label || deviceId
    }
    this.inputs.set(deviceId, input)
    return input
  }

  getChannelCount (deviceId) {
    const input = this.inputs.get(deviceId)
    return input ? input.channelCount : 1
  }

  async connectModulatorInput (modulator) {
    if (!modulator || modulator.type !== 'audio') return null

    let deviceId = modulator.audioDeviceId || null
    if (!deviceId && modulator.audioDeviceLabel) {
      if (this.devices.length === 0) {
        await this.refreshDevices()
      }
      const match = this.findDevice(null, modulator.audioDeviceLabel)
      if (match) deviceId = match.deviceId
    }

    if (!deviceId) {
      if (this.devices.length === 0) {
        await this.refreshDevices()
      }
      deviceId = this.devices[0]?.deviceId || null
    }

    if (!deviceId) return null

    const input = await this.ensureInput(deviceId)
    return {
      deviceId,
      channelCount: input.channelCount,
      label: input.label
    }
  }

  releaseInput (deviceId) {
    const input = this.inputs.get(deviceId)
    if (!input) return
    try {
      input.source.disconnect()
      input.splitter.disconnect()
      input.channels.forEach((ch) => {
        try {
          ch.analyser.disconnect()
        } catch (_) {}
      })
      input.stream.getTracks().forEach((track) => track.stop())
    } catch (error) {
      console.warn('Error releasing audio input:', error)
    }
    this.inputs.delete(deviceId)
  }

  releaseUnusedInputs (activeDeviceIds = []) {
    const active = new Set(activeDeviceIds.filter(Boolean))
    for (const deviceId of [...this.inputs.keys()]) {
      if (!active.has(deviceId)) {
        this.releaseInput(deviceId)
      }
    }
  }

  syncActiveInputs (modulators = []) {
    const audioMods = modulators.filter(
      (m) => m && m.type === 'audio' && m.enabled && m.audioDeviceId
    )
    const activeIds = audioMods.map((m) => m.audioDeviceId)
    this.releaseUnusedInputs(activeIds)
    return Promise.all(
      audioMods.map((m) =>
        this.ensureInput(m.audioDeviceId).catch((error) => {
          console.warn('Failed to open audio input:', error)
          return null
        })
      )
    )
  }

  _getChannel (deviceId, channelIndex = 0) {
    const input = this.inputs.get(deviceId)
    if (!input) return null
    const index = Math.max(
      0,
      Math.min(input.channels.length - 1, channelIndex | 0)
    )
    return input.channels[index]
  }

  _computeRms (timeData) {
    let sum = 0
    for (let i = 0; i < timeData.length; i++) {
      const v = (timeData[i] - 128) / 128
      sum += v * v
    }
    return Math.sqrt(sum / timeData.length)
  }

  _computePeak (timeData) {
    let peak = 0
    for (let i = 0; i < timeData.length; i++) {
      const v = Math.abs((timeData[i] - 128) / 128)
      if (v > peak) peak = v
    }
    return peak
  }

  _computeBandLevel (analyser, freqData, freqMin, freqMax) {
    analyser.getByteFrequencyData(freqData)
    const sampleRate = this.audioContext?.sampleRate || 44100
    const binCount = freqData.length
    const nyquist = sampleRate / 2
    const minBin = Math.max(0, Math.floor((freqMin / nyquist) * binCount))
    const maxBin = Math.min(
      binCount - 1,
      Math.ceil((freqMax / nyquist) * binCount)
    )

    if (maxBin < minBin) return 0

    let sum = 0
    let count = 0
    for (let i = minBin; i <= maxBin; i++) {
      sum += freqData[i]
      count++
    }
    return count > 0 ? sum / count / 255 : 0
  }

  computeRawLevel ({
    deviceId,
    channel = 0,
    feature = 'rms',
    freqMin = 20,
    freqMax = 20000
  }) {
    const ch = this._getChannel(deviceId, channel)
    if (!ch || !this.audioContext) return 0

    const { analyser, freqData, timeData } = ch

    if (feature === 'rms') {
      analyser.getByteTimeDomainData(timeData)
      return Math.min(1, this._computeRms(timeData) * 2)
    }

    if (feature === 'peak') {
      analyser.getByteTimeDomainData(timeData)
      return Math.min(1, this._computePeak(timeData))
    }

    let bandMin = freqMin
    let bandMax = freqMax
    if (FEATURE_BANDS[feature]) {
      ;[bandMin, bandMax] = FEATURE_BANDS[feature]
    }

    return this._computeBandLevel(analyser, freqData, bandMin, bandMax)
  }

  getNormalizedLevel (modulator) {
    if (!modulator || modulator.type !== 'audio' || !modulator.enabled) {
      return 0
    }

    const deviceId = modulator.audioDeviceId
    if (!deviceId || !this.inputs.has(deviceId)) {
      return 0
    }

    const feature = modulator.audioFeature || 'rms'
    const channel = modulator.audioChannel || 0
    const freqMin =
      modulator.audioFreqMin !== undefined ? modulator.audioFreqMin : 20
    const freqMax =
      modulator.audioFreqMax !== undefined ? modulator.audioFreqMax : 20000
    const multiplier =
      modulator.multiplier !== undefined ? modulator.multiplier : 1
    const smoothing =
      modulator.audioSmoothing !== undefined ? modulator.audioSmoothing : 0.7

    let level = this.computeRawLevel({
      deviceId,
      channel,
      feature,
      freqMin,
      freqMax
    })
    level = Math.max(0, Math.min(1, level * multiplier))

    const key = historyKey(deviceId, channel, feature, freqMin, freqMax)
    const prev = this.smoothedLevels.has(key)
      ? this.smoothedLevels.get(key)
      : level
    const s = Math.max(0, Math.min(0.99, smoothing))
    const smoothed = prev * s + level * (1 - s)
    this.smoothedLevels.set(key, smoothed)

    this.pushMonitorSample(key, smoothed)
    return smoothed
  }

  pushMonitorSample (key, level01) {
    if (!this.monitorHistories.has(key)) {
      this.monitorHistories.set(
        key,
        new Array(MONITOR_HISTORY_SIZE).fill(0)
      )
    }
    const history = this.monitorHistories.get(key)
    history.shift()
    history.push(level01)
  }

  getMonitorSamples (modulator, sampleCount = 64) {
    const values = new Array(sampleCount).fill(0)
    if (!modulator || modulator.type !== 'audio') return values

    const deviceId = modulator.audioDeviceId
    if (!deviceId) return values

    // Keep analysis warm even when monitor is the only consumer
    this.getNormalizedLevel(modulator)

    const feature = modulator.audioFeature || 'rms'
    const channel = modulator.audioChannel || 0
    const freqMin =
      modulator.audioFreqMin !== undefined ? modulator.audioFreqMin : 20
    const freqMax =
      modulator.audioFreqMax !== undefined ? modulator.audioFreqMax : 20000
    const key = historyKey(deviceId, channel, feature, freqMin, freqMax)
    const history = this.monitorHistories.get(key)
    if (!history || history.length === 0) return values

    const depth = modulator.depth !== undefined ? modulator.depth : 0.5
    const offset = modulator.offset || 0
    const start = Math.max(0, history.length - sampleCount)
    for (let i = 0; i < sampleCount; i++) {
      const level = history[start + i] ?? 0
      // Visualize applied unipolar modulation in the shared [-1, 1] monitor
      const amount = level * depth + offset
      values[i] = Math.max(-1, Math.min(1, amount * 2 - 1))
    }
    return values
  }

  getTimeDomainWaveform (modulator, sampleCount = 64) {
    const values = new Array(sampleCount).fill(0)
    if (!modulator?.audioDeviceId) return values
    const ch = this._getChannel(
      modulator.audioDeviceId,
      modulator.audioChannel || 0
    )
    if (!ch) return values

    ch.analyser.getByteTimeDomainData(ch.timeData)
    const step = ch.timeData.length / sampleCount
    for (let i = 0; i < sampleCount; i++) {
      const idx = Math.floor(i * step)
      values[i] = (ch.timeData[idx] - 128) / 128
    }
    return values
  }

  getAudioFeatures () {
    return ['rms', 'peak', 'bass', 'mid', 'treble', 'presence', 'band']
  }

  getAudioFeatureNames () {
    return {
      rms: 'RMS Level',
      peak: 'Peak',
      bass: 'Bass',
      mid: 'Mid',
      treble: 'Treble',
      presence: 'Presence',
      band: 'Custom Band'
    }
  }

  dispose () {
    for (const deviceId of [...this.inputs.keys()]) {
      this.releaseInput(deviceId)
    }
    this.smoothedLevels.clear()
    this.monitorHistories.clear()
    if (this._deviceChangeHandler && navigator.mediaDevices?.removeEventListener) {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        this._deviceChangeHandler
      )
      this._deviceChangeHandler = null
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
  }
}

let sharedEngine = null

export function getAudioModulationEngine () {
  if (!sharedEngine) {
    sharedEngine = new AudioModulationEngine()
  }
  return sharedEngine
}
