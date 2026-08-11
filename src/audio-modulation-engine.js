/**
 * GLOW — Audio Modulation Engine
 * ------------------------------------------------------------
 * Shared Web Audio input + FFT analysis for audio modulators.
 * Supports live getUserMedia inputs and shared audio-file tracks
 * that any number of audio modulators can reference.
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

function historyKey (sourceKey, channel, feature, freqMin, freqMax) {
  return `${sourceKey || 'none'}|${channel}|${feature}|${freqMin}|${freqMax}`
}

function trackSourceKey (trackId) {
  return `track:${trackId}`
}

function createTrackId () {
  return `audio-track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export class AudioModulationEngine {
  constructor () {
    this.audioContext = null
    this.inputs = new Map()
    this.tracks = new Map()
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

  getTracks () {
    return [...this.tracks.values()].map((track) => this._serializeTrack(track))
  }

  getTrack (trackId) {
    const track = this.tracks.get(trackId)
    return track ? this._serializeTrack(track) : null
  }

  getTrackAudioElement (trackId) {
    return this.tracks.get(trackId)?.audioEl || null
  }

  getTrackChannelCount (trackId) {
    const track = this.tracks.get(trackId)
    return track ? track.channelCount : 1
  }

  hasTrack (trackId) {
    return this.tracks.has(trackId)
  }

  _serializeTrack (track) {
    return {
      id: track.id,
      name: track.name,
      dataUrl: track.dataUrl,
      enabled: track.enabled !== false,
      loop: track.audioEl ? !!track.audioEl.loop : track.loop !== false,
      channelCount: track.channelCount
    }
  }

  _readFileAsDataUrl (file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () =>
        reject(reader.error || new Error('Failed to read audio file'))
      reader.readAsDataURL(file)
    })
  }

  _createAnalysisGraph (audioEl) {
    const source = this.audioContext.createMediaElementSource(audioEl)
    const channelCount = 2
    const splitter = this.audioContext.createChannelSplitter(channelCount)
    source.connect(splitter)
    source.connect(this.audioContext.destination)

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

    return { source, splitter, channelCount, channels }
  }

  createTrack (options = {}) {
    const id = options.id || createTrackId()
    if (this.tracks.has(id)) {
      return this._serializeTrack(this.tracks.get(id))
    }

    const audioEl = document.createElement('audio')
    audioEl.preload = 'auto'
    audioEl.loop = options.loop !== undefined ? !!options.loop : true
    audioEl.setAttribute('playsinline', '')
    audioEl.addEventListener('play', () => {
      this.ensureAudioContext().catch(() => {})
    })

    const track = {
      id,
      name: options.name || 'Audio track',
      dataUrl: options.dataUrl || null,
      enabled: options.enabled !== false,
      loop: audioEl.loop,
      audioEl,
      source: null,
      splitter: null,
      channelCount: 2,
      channels: []
    }

    if (options.dataUrl) {
      audioEl.src = options.dataUrl
    }

    this.tracks.set(id, track)
    return this._serializeTrack(track)
  }

  async ensureTrackGraph (trackId) {
    const track = this.tracks.get(trackId)
    if (!track) return null
    if (track.source) return track

    await this.ensureAudioContext()
    const graph = this._createAnalysisGraph(track.audioEl)
    Object.assign(track, graph)
    return track
  }

  async loadTrackFile (trackId, fileOrDataUrl, options = {}) {
    let track = this.tracks.get(trackId)
    if (!track) {
      this.createTrack({
        id: trackId,
        name: options.name,
        loop: options.loop,
        enabled: options.enabled
      })
      track = this.tracks.get(trackId)
    }
    if (!track) {
      throw new Error('Failed to create audio track')
    }

    let dataUrl = null
    let name = options.name || track.name || 'Audio track'

    if (typeof fileOrDataUrl === 'string') {
      dataUrl = fileOrDataUrl
    } else if (fileOrDataUrl instanceof Blob) {
      name = fileOrDataUrl.name || name
      dataUrl = await this._readFileAsDataUrl(fileOrDataUrl)
    } else {
      throw new Error('Invalid audio file')
    }

    await this.ensureAudioContext()

    const wasPlaying = !track.audioEl.paused
    track.audioEl.pause()
    track.audioEl.src = dataUrl
    track.audioEl.loop =
      options.loop !== undefined ? !!options.loop : track.audioEl.loop
    track.dataUrl = dataUrl
    track.name = name
    track.loop = track.audioEl.loop
    if (options.enabled !== undefined) {
      track.enabled = !!options.enabled
    }
    track.audioEl.load()

    await this.ensureTrackGraph(track.id)

    if (wasPlaying && track.enabled) {
      try {
        await track.audioEl.play()
      } catch (error) {
        // Autoplay may be blocked until a user gesture.
      }
    }

    return this._serializeTrack(track)
  }

  setTrackLoop (trackId, loop) {
    const track = this.tracks.get(trackId)
    if (!track) return
    track.loop = !!loop
    track.audioEl.loop = !!loop
  }

  setTrackEnabled (trackId, enabled) {
    const track = this.tracks.get(trackId)
    if (!track) return
    track.enabled = !!enabled
    if (!track.enabled) {
      track.audioEl.pause()
    }
  }

  setTrackName (trackId, name) {
    const track = this.tracks.get(trackId)
    if (!track) return
    track.name = name || 'Audio track'
  }

  releaseTrack (trackId) {
    const track = this.tracks.get(trackId)
    if (!track) return
    try {
      track.audioEl.pause()
      track.audioEl.removeAttribute('src')
      track.audioEl.load()
      if (track.source) track.source.disconnect()
      if (track.splitter) track.splitter.disconnect()
      track.channels.forEach((ch) => {
        try {
          ch.analyser.disconnect()
        } catch (e) {}
      })
    } catch (error) {
      console.warn('Error releasing audio track:', error)
    }
    this.tracks.delete(trackId)
  }

  releaseUnusedTracks (activeTrackIds = []) {
    const active = new Set(activeTrackIds.filter(Boolean))
    for (const trackId of [...this.tracks.keys()]) {
      if (!active.has(trackId)) {
        this.releaseTrack(trackId)
      }
    }
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
        } catch (e) {}
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

  /**
   * Keep live inputs in sync. Shared file tracks are owned independently and
   * are not released just because no modulator currently references them.
   */
  syncActiveInputs (modulators = []) {
    const audioMods = modulators.filter(
      (m) => m && m.type === 'audio' && m.enabled
    )

    const liveMods = audioMods.filter(
      (m) => (m.audioSourceType || 'input') === 'input' && m.audioDeviceId
    )

    this.releaseUnusedInputs(liveMods.map((m) => m.audioDeviceId))

    const tasks = liveMods.map((m) =>
      this.ensureInput(m.audioDeviceId).catch((error) => {
        console.warn('Failed to open audio input:', error)
        return null
      })
    )

    for (const m of audioMods) {
      if ((m.audioSourceType || 'input') !== 'file') continue
      const trackId = m.audioTrackId
      if (!trackId || !this.tracks.has(trackId)) continue
      tasks.push(
        this.ensureTrackGraph(trackId).catch((error) => {
          console.warn('Failed to prepare audio track graph:', error)
          return null
        })
      )
    }

    return Promise.all(tasks)
  }

  async restoreTracks (trackDefs = []) {
    const keepIds = []
    const tasks = []

    for (const def of trackDefs) {
      if (!def?.id) continue
      keepIds.push(def.id)
      if (!this.tracks.has(def.id)) {
        this.createTrack({
          id: def.id,
          name: def.name || 'Audio track',
          dataUrl: def.dataUrl || null,
          enabled: def.enabled !== false,
          loop: def.loop !== false
        })
      } else {
        const track = this.tracks.get(def.id)
        track.name = def.name || track.name
        track.enabled = def.enabled !== false
        this.setTrackLoop(def.id, def.loop !== false)
      }

      const track = this.tracks.get(def.id)
      if (def.dataUrl && track && track.dataUrl !== def.dataUrl) {
        tasks.push(
          this.loadTrackFile(def.id, def.dataUrl, {
            name: def.name || track.name,
            loop: def.loop !== false,
            enabled: def.enabled !== false
          }).catch((error) => {
            console.warn('Failed to restore audio track file:', error)
            return null
          })
        )
      } else if (track?.dataUrl) {
        tasks.push(
          this.ensureTrackGraph(def.id).catch((error) => {
            console.warn('Failed to restore audio track graph:', error)
            return null
          })
        )
      }
    }

    this.releaseUnusedTracks(keepIds)
    await Promise.all(tasks)
    return this.getTracks()
  }

  _getChannelFromSource (sourceEntry, channelIndex = 0) {
    if (!sourceEntry) return null
    const index = Math.max(
      0,
      Math.min(sourceEntry.channels.length - 1, channelIndex | 0)
    )
    return sourceEntry.channels[index]
  }

  _getAnalysisChannel (modulator) {
    const sourceType = modulator.audioSourceType || 'input'
    if (sourceType === 'file') {
      const track = this.tracks.get(modulator.audioTrackId)
      if (!track || track.enabled === false) return null
      return this._getChannelFromSource(track, modulator.audioChannel || 0)
    }
    return this._getChannelFromSource(
      this.inputs.get(modulator.audioDeviceId),
      modulator.audioChannel || 0
    )
  }

  _getSourceKey (modulator) {
    if ((modulator.audioSourceType || 'input') === 'file') {
      return trackSourceKey(modulator.audioTrackId)
    }
    return modulator.audioDeviceId || 'none'
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

  computeRawLevel (ch, feature = 'rms', freqMin = 20, freqMax = 20000) {
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

    const sourceType = modulator.audioSourceType || 'input'
    if (sourceType === 'input' && !modulator.audioDeviceId) return 0
    if (sourceType === 'file') {
      const track = this.tracks.get(modulator.audioTrackId)
      if (!track || track.enabled === false || !track.source) return 0
    }

    const ch = this._getAnalysisChannel(modulator)
    if (!ch) return 0

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

    let level = this.computeRawLevel(ch, feature, freqMin, freqMax)
    level = Math.max(0, Math.min(1, level * multiplier))

    const key = historyKey(
      this._getSourceKey(modulator),
      channel,
      feature,
      freqMin,
      freqMax
    )
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
      this.monitorHistories.set(key, new Array(MONITOR_HISTORY_SIZE).fill(0))
    }
    const history = this.monitorHistories.get(key)
    history.shift()
    history.push(level01)
  }

  getMonitorSamples (modulator, sampleCount = 64) {
    const values = new Array(sampleCount).fill(0)
    if (!modulator || modulator.type !== 'audio') return values

    const sourceType = modulator.audioSourceType || 'input'
    if (sourceType === 'input' && !modulator.audioDeviceId) return values
    if (sourceType === 'file') {
      const track = this.tracks.get(modulator.audioTrackId)
      if (!track || track.enabled === false || !track.source) return values
    }

    this.getNormalizedLevel(modulator)

    const feature = modulator.audioFeature || 'rms'
    const channel = modulator.audioChannel || 0
    const freqMin =
      modulator.audioFreqMin !== undefined ? modulator.audioFreqMin : 20
    const freqMax =
      modulator.audioFreqMax !== undefined ? modulator.audioFreqMax : 20000
    const key = historyKey(
      this._getSourceKey(modulator),
      channel,
      feature,
      freqMin,
      freqMax
    )
    const history = this.monitorHistories.get(key)
    if (!history || history.length === 0) return values

    const depth = modulator.depth !== undefined ? modulator.depth : 0.5
    const offset = modulator.offset || 0
    const start = Math.max(0, history.length - sampleCount)
    for (let i = 0; i < sampleCount; i++) {
      const level = history[start + i] ?? 0
      const amount = level * depth + offset
      values[i] = Math.max(-1, Math.min(1, amount * 2 - 1))
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
    for (const trackId of [...this.tracks.keys()]) {
      this.releaseTrack(trackId)
    }
    this.smoothedLevels.clear()
    this.monitorHistories.clear()
    if (
      this._deviceChangeHandler &&
      navigator.mediaDevices?.removeEventListener
    ) {
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
