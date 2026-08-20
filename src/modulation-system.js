/**
 * GLOW — Modulation System
 * ------------------------------------------------------------
 * Allows specific luminode configuration values to change over time
 * according to configurable LFO-style modulators.
 */

import { getAudioModulationEngine } from './audio-modulation-engine.js'
import { LINE_MODULATION_PARAMS } from './line-modulation-system.js'

export const TRACK_MOTION_MODULATION_PARAMS = [
  {
    key: 'mixer.opacity',
    label: 'Mixer · Opacity',
    type: 'slider',
    min: 0,
    max: 1,
    step: 0.01
  },
  {
    key: 'layout.x',
    label: 'Layout · X',
    type: 'slider',
    min: -500,
    max: 500,
    step: 1
  },
  {
    key: 'layout.y',
    label: 'Layout · Y',
    type: 'slider',
    min: -500,
    max: 500,
    step: 1
  },
  {
    key: 'trajectory.enabled',
    label: 'Trajectory · Enabled',
    type: 'checkbox'
  },
  {
    key: 'trajectory.motionRate',
    label: 'Trajectory · Rate',
    type: 'slider',
    min: 0.01,
    max: 2,
    step: 0.01
  },
  {
    key: 'trajectory.amplitude',
    label: 'Trajectory · Amplitude',
    type: 'slider',
    min: 0,
    max: 600,
    step: 1
  },
  {
    key: 'trajectory.ratioA',
    label: 'Trajectory · Ratio A',
    type: 'slider',
    min: 0.1,
    max: 5,
    step: 0.1
  },
  {
    key: 'trajectory.ratioB',
    label: 'Trajectory · Ratio B',
    type: 'slider',
    min: 0.1,
    max: 5,
    step: 0.1
  },
  {
    key: 'trajectory.ratioC',
    label: 'Trajectory · Ratio C',
    type: 'slider',
    min: 0.1,
    max: 5,
    step: 0.1
  },
  {
    key: 'trajectory.inversion',
    label: 'Trajectory · Invert',
    type: 'checkbox'
  },
  ...LINE_MODULATION_PARAMS
]

export function getTrackMotionModulationParam (key) {
  return TRACK_MOTION_MODULATION_PARAMS.find((param) => param.key === key)
}

export class ModulationSystem {
  constructor () {
    this.modulators = []
    this.originalConfigValues = new Map()
    this.startTime = performance.now() / 1000
    this.audioEngine = getAudioModulationEngine()
  }

  addModulator (type = 'lfo', id = null) {
    const modulator = {
      id:
        id ||
        `modulator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      enabled: true,
      targetDestination: 'track',
      targetTrack: 1,
      targetConfigKey: null,
      targetLuminode: null,
      targetCanvasFilter: null,
      targetShaderOverlay: null,
      shape: 'sine',
      rate: 0.1,
      depth: 0.5,
      offset: 0,
      cubicBezier: [0.5, 0, 0.5, 1],
      multiplier: 1.0,
      easing: 'linear',
      threshold: 0.5,
      // Audio modulator defaults
      audioSourceType: 'input',
      audioDeviceId: null,
      audioDeviceLabel: null,
      audioChannel: 0,
      audioChannelMode: 'mono',
      audioFeature: 'rms',
      audioFreqMin: 20,
      audioFreqMax: 20000,
      audioSmoothing: 0.7,
      // Shared audio-file track reference (cross-modulator)
      audioTrackId: null
    }

    this.modulators.push(modulator)
    return modulator.id
  }

  getAudioEngine () {
    return this.audioEngine
  }

  getAudioTracks () {
    return this.audioEngine.getTracks()
  }

  hasPlayableAudio () {
    return this.audioEngine.hasPlayableAudio()
  }

  isAnyAudioPlaying () {
    return this.audioEngine.isAnyTrackPlaying()
  }

  async toggleAudioPlayback () {
    return this.audioEngine.togglePlayback()
  }

  createAudioTrack (options = {}) {
    return this.audioEngine.createTrack(options)
  }

  async loadAudioTrackFile (trackId, fileOrDataUrl, options = {}) {
    return this.audioEngine.loadTrackFile(trackId, fileOrDataUrl, options)
  }

  updateAudioTrack (trackId, updates = {}) {
    if (!trackId || !this.audioEngine.hasTrack(trackId)) return false
    if (updates.name !== undefined) {
      this.audioEngine.setTrackName(trackId, updates.name)
    }
    if (updates.loop !== undefined) {
      this.audioEngine.setTrackLoop(trackId, updates.loop)
    }
    if (updates.enabled !== undefined) {
      this.audioEngine.setTrackEnabled(trackId, updates.enabled)
    }
    return true
  }

  removeAudioTrack (trackId) {
    if (!trackId) return false
    this.audioEngine.releaseTrack(trackId)
    for (const modulator of this.modulators) {
      if (modulator.audioTrackId === trackId) {
        modulator.audioTrackId = null
      }
    }
    this.syncAudioInputs()
    return true
  }

  syncAudioInputs () {
    return this.audioEngine.syncActiveInputs(this.modulators)
  }

  removeModulator (modulatorId) {
    const index = this.modulators.findIndex((m) => m.id === modulatorId)
    if (index !== -1) {
      this.modulators.splice(index, 1)
      this.syncAudioInputs()
      return true
    }
    return false
  }

  updateModulator (modulatorId, updates) {
    const modulator = this.modulators.find((m) => m.id === modulatorId)
    if (modulator) {
      Object.assign(modulator, updates)
      if (
        updates.type !== undefined ||
        updates.enabled !== undefined ||
        updates.audioDeviceId !== undefined ||
        updates.audioChannel !== undefined ||
        updates.audioChannelMode !== undefined ||
        updates.audioSourceType !== undefined ||
        updates.audioTrackId !== undefined
      ) {
        this.syncAudioInputs()
      }
      return true
    }
    return false
  }

  getModulators () {
    return this.modulators
  }

  getModulator (modulatorId) {
    return this.modulators.find((m) => m.id === modulatorId)
  }

  generateWaveform (shape, phase, cubicBezier = [0.5, 0, 0.5, 1]) {
    // Normalize phase to 0-2π
    const normalizedPhase =
      ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

    switch (shape) {
      case 'sine':
        return Math.sin(normalizedPhase)
      case 'square':
        return normalizedPhase < Math.PI ? 1 : -1
      case 'triangle':
        if (normalizedPhase < Math.PI) {
          return (normalizedPhase / Math.PI) * 2 - 1
        } else {
          return 1 - ((normalizedPhase - Math.PI) / Math.PI) * 2
        }
      case 'saw':
        return (normalizedPhase / (Math.PI * 2)) * 2 - 1
      case 'cubicBezier': {
        const t = normalizedPhase / (Math.PI * 2)
        const [x1, y1, x2, y2] = cubicBezier
        const bezierValue = this.cubicBezierEval(t, y1, y2)
        return bezierValue * 2 - 1
      }
      default:
        return Math.sin(normalizedPhase)
    }
  }

  cubicBezierEval (t, y1, y2) {
    const t2 = t * t
    const t3 = t2 * t
    const mt = 1 - t
    const mt2 = mt * mt
    const mt3 = mt2 * mt
    return mt3 * 0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t3 * 1
  }

  applyEasing (t, easingType = 'linear') {
    const clamped = Math.max(0, Math.min(1, t))

    switch (easingType) {
      case 'linear':
        return clamped
      case 'easeIn':
        return clamped * clamped
      case 'easeOut':
        return clamped * (2 - clamped)
      case 'easeInOut':
        return clamped < 0.5
          ? 2 * clamped * clamped
          : -1 + (4 - 2 * clamped) * clamped
      case 'easeInCubic':
        return clamped * clamped * clamped
      case 'easeOutCubic':
        return 1 - Math.pow(1 - clamped, 3)
      case 'easeInOutCubic':
        return clamped < 0.5
          ? 4 * clamped * clamped * clamped
          : 1 - Math.pow(-2 * clamped + 2, 3) / 2
      case 'smoothstep':
        return clamped * clamped * (3 - 2 * clamped)
      default:
        return clamped
    }
  }

  getCurrentTime () {
    return performance.now() / 1000 - this.startTime
  }

  getAudioSignal (modulator) {
    const level = this.audioEngine.getNormalizedLevel(modulator)
    return this.applyEasing(level, modulator.easing || 'linear')
  }

  /**
   * Deterministic 1D noise in [-1, 1] from an integer index.
   * Same index always yields the same value (good for monitors + reload).
   */
  noise1D (n) {
    const x = Math.sin(n * 127.1) * 43758.5453123
    return (x - Math.floor(x)) * 2 - 1
  }

  seedFromId (id) {
    let h = 0
    const s = String(id || '')
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i)
      h |= 0
    }
    return h
  }

  isRandomModulator (type) {
    return type === 'randomStepped' || type === 'randomSmooth'
  }

  /**
   * Random modulator signal in [-1, 1].
   * rate = how many new values per second (same units as LFO Hz).
   * stepped: sample-and-hold; smooth: ease between successive samples.
   */
  getRandomSignal (modulator, time = this.getCurrentTime()) {
    const rate = Math.max(0.001, modulator.rate || 0.1)
    const phase = time * rate
    const step = Math.floor(phase)
    const frac = phase - step
    const seed = this.seedFromId(modulator.id)

    const sampleAt = (i) => this.noise1D(i * 374761393 + seed * 668265263)

    if (modulator.type === 'randomStepped') {
      return sampleAt(step)
    }

    const a = sampleAt(step)
    const b = sampleAt(step + 1)
    const t = this.applyEasing(frac, modulator.easing || 'smoothstep')
    return a + (b - a) * t
  }

  getModulatedValue (baseValue, modulator, configParam, noteData = null) {
    if (!modulator.enabled || !modulator.targetConfigKey) {
      return baseValue
    }

    const modulatorType = modulator.type || 'lfo'

    if (configParam.type === 'checkbox') {
      let normalizedValue = 0

      if (modulatorType === 'lfo') {
        const time = performance.now() / 1000 - this.startTime
        const phase = time * modulator.rate * Math.PI * 2
        const waveform = this.generateWaveform(
          modulator.shape,
          phase,
          modulator.cubicBezier
        )
        normalizedValue = (waveform + 1) / 2
      } else if (this.isRandomModulator(modulatorType)) {
        normalizedValue = (this.getRandomSignal(modulator) + 1) / 2
      } else if (modulatorType === 'numberOfNotes') {
        if (!noteData || !noteData.notes || noteData.notes.length === 0) {
          normalizedValue = 0
        } else {
          const noteCount = noteData.notes.length
          normalizedValue = Math.min(
            1,
            (noteCount * (modulator.multiplier || 1.0)) / 10
          )
          normalizedValue = this.applyEasing(
            normalizedValue,
            modulator.easing || 'linear'
          )
        }
      } else if (modulatorType === 'velocity') {
        if (!noteData) {
          normalizedValue = 0
        } else {
          let velocity = 0
          if (noteData.velocity !== undefined) {
            velocity = noteData.velocity
          } else if (noteData.notes && noteData.notes.length > 0) {
            const velocities = noteData.notes.map((n) => n.velocity || 0)
            velocity =
              velocities.reduce((a, b) => a + b, 0) / velocities.length
          }
          normalizedValue = Math.max(
            0,
            Math.min(1, velocity * (modulator.multiplier || 1.0))
          )
          normalizedValue = this.applyEasing(
            normalizedValue,
            modulator.easing || 'linear'
          )
        }
      } else if (modulatorType === 'audio') {
        normalizedValue = this.getAudioSignal(modulator)
      }

      const threshold =
        modulator.threshold !== undefined ? modulator.threshold : 0.5
      return normalizedValue >= threshold
    }

    let normalizedValue = 0

    if (modulatorType === 'lfo' || this.isRandomModulator(modulatorType)) {
      const waveform =
        modulatorType === 'lfo'
          ? this.generateWaveform(
              modulator.shape,
              (performance.now() / 1000 - this.startTime) *
                modulator.rate *
                Math.PI *
                2,
              modulator.cubicBezier
            )
          : this.getRandomSignal(modulator)
      const modulationAmount = waveform * modulator.depth
      const offset = modulator.offset || 0

      const min = configParam.min
      const max = configParam.max
      const range = max - min

      const modulatedValue =
        baseValue + modulationAmount * range + offset * range

      return Math.max(min, Math.min(max, modulatedValue))
    } else if (modulatorType === 'audio') {
      // Unipolar: silence stays near base; louder signal pushes by depth*range
      const level = this.getAudioSignal(modulator)
      const depth = modulator.depth !== undefined ? modulator.depth : 0.5
      const offset = modulator.offset || 0
      const min = configParam.min
      const max = configParam.max
      const range = max - min
      const modulatedValue = baseValue + level * depth * range + offset * range
      return Math.max(min, Math.min(max, modulatedValue))
    } else if (modulatorType === 'numberOfNotes') {
      if (!noteData || !noteData.notes || noteData.notes.length === 0) {
        return baseValue
      }
      const noteCount = noteData.notes.length
      normalizedValue = Math.min(
        1,
        (noteCount * (modulator.multiplier || 1.0)) / 10
      )
      normalizedValue = this.applyEasing(
        normalizedValue,
        modulator.easing || 'linear'
      )
    } else if (modulatorType === 'velocity') {
      if (!noteData) {
        return baseValue
      }
      let velocity = 0
      if (noteData.velocity !== undefined) {
        velocity = noteData.velocity
      } else if (noteData.notes && noteData.notes.length > 0) {
        const velocities = noteData.notes.map((n) => n.velocity || 0)
        velocity = velocities.reduce((a, b) => a + b, 0) / velocities.length
      } else {
        return baseValue
      }
      normalizedValue = Math.max(
        0,
        Math.min(1, velocity * (modulator.multiplier || 1.0))
      )
      normalizedValue = this.applyEasing(
        normalizedValue,
        modulator.easing || 'linear'
      )
    } else {
      return baseValue
    }

    const min = configParam.min
    const max = configParam.max
    const range = max - min
    const mappedValue = min + normalizedValue * range

    if (configParam.type === 'number') {
      return Math.round(mappedValue)
    }
    return Math.max(min, Math.min(max, mappedValue))
  }

  getStackedModulatedValue (
    baseValue,
    modulators,
    configParam,
    noteData = null
  ) {
    if (configParam.type === 'checkbox') {
      return modulators.reduce(
        (value, modulator) =>
          this.getModulatedValue(value, modulator, configParam, noteData),
        baseValue
      )
    }

    let modulatedValue = baseValue
    const lfoModulators = modulators.filter(
      (modulator) => (modulator.type || 'lfo') === 'lfo'
    )

    if (lfoModulators.length > 0) {
      let totalModulation = 0
      let totalOffset = 0
      const time = this.getCurrentTime()

      lfoModulators.forEach((modulator) => {
        if (!modulator.enabled) return
        const phase = time * modulator.rate * Math.PI * 2
        const waveform = this.generateWaveform(
          modulator.shape,
          phase,
          modulator.cubicBezier
        )
        totalModulation += waveform * modulator.depth
        totalOffset += modulator.offset || 0
      })

      const range = configParam.max - configParam.min
      modulatedValue =
        baseValue + totalModulation * range + totalOffset * range
      modulatedValue = Math.max(
        configParam.min,
        Math.min(configParam.max, modulatedValue)
      )
    }

    modulators
      .filter((modulator) => (modulator.type || 'lfo') !== 'lfo')
      .forEach((modulator) => {
        if (!modulator.enabled) return
        modulatedValue = this.getModulatedValue(
          modulatedValue,
          modulator,
          configParam,
          noteData
        )
      })

    return configParam.type === 'number'
      ? Math.round(modulatedValue)
      : modulatedValue
  }

  applyModulation (
    trackId,
    luminodeType,
    luminodeConfigKey,
    baseConfigValue,
    configParam
  ) {
    const relevantModulators = this.modulators.filter(
      (m) =>
        m.enabled &&
        m.targetTrack === trackId &&
        m.targetConfigKey === luminodeConfigKey &&
        m.targetLuminode === luminodeType
    )

    if (relevantModulators.length === 0) {
      return baseConfigValue
    }

    let modulatedValue = baseConfigValue

    for (const modulator of relevantModulators) {
      modulatedValue = this.getModulatedValue(
        modulatedValue,
        modulator,
        configParam
      )
    }
    console.log('modulator', modulatedValue)
    return modulatedValue
  }

  getModulatedConfig (trackId, luminodeType, baseConfig) {
    const modulatedConfig = { ...baseConfig }

    const relevantModulators = this.modulators.filter(
      (m) =>
        m.enabled &&
        m.targetTrack === trackId &&
        m.targetLuminode === luminodeType &&
        m.targetConfigKey !== null
    )

    if (relevantModulators.length === 0) {
      return modulatedConfig
    }

    return modulatedConfig
  }

  reset () {
    this.modulators = []
    this.originalConfigValues.clear()
    this.audioEngine.releaseUnusedInputs([])
    this.audioEngine.releaseUnusedTracks([])
  }

  getWaveformShapes () {
    return ['sine', 'square', 'triangle', 'saw', 'cubicBezier']
  }

  getWaveformShapeNames () {
    return {
      sine: 'Sine',
      square: 'Square',
      triangle: 'Triangle',
      saw: 'Sawtooth',
      cubicBezier: 'Cubic Bezier'
    }
  }

  getModulatorTypes () {
    return [
      'lfo',
      'randomStepped',
      'randomSmooth',
      'numberOfNotes',
      'velocity',
      'audio'
    ]
  }

  getModulatorTypeNames () {
    return {
      lfo: 'LFO',
      randomStepped: 'Random (Stepped)',
      randomSmooth: 'Random (Smooth)',
      numberOfNotes: 'Number of Notes',
      velocity: 'Velocity',
      audio: 'Audio'
    }
  }

  getEasingFunctions () {
    return [
      'linear',
      'easeIn',
      'easeOut',
      'easeInOut',
      'easeInCubic',
      'easeOutCubic',
      'easeInOutCubic',
      'smoothstep'
    ]
  }

  getEasingFunctionNames () {
    return {
      linear: 'Linear',
      easeIn: 'Ease In',
      easeOut: 'Ease Out',
      easeInOut: 'Ease In-Out',
      easeInCubic: 'Ease In Cubic',
      easeOutCubic: 'Ease Out Cubic',
      easeInOutCubic: 'Ease In-Out Cubic',
      smoothstep: 'Smoothstep'
    }
  }
}
