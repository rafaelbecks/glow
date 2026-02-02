/**
 * GLOW — Modulation System
 * ------------------------------------------------------------
 * Allows specific luminode configuration values to change over time
 * according to configurable LFO-style modulators.
 */

export class ModulationSystem {
  constructor () {
    this.maxModulators = 4
    this.modulators = []
    this.originalConfigValues = new Map()
    this.startTime = performance.now() / 1000
  }

  addModulator (type = 'lfo') {
    if (this.modulators.length >= this.maxModulators) {
      return null
    }

    const modulator = {
      id: `modulator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type,
      enabled: true,
      targetTrack: 1,
      targetConfigKey: null,
      targetLuminode: null,
      shape: 'sine',
      rate: 0.1,
      depth: 0.5,
      offset: 0,
      cubicBezier: [0.5, 0, 0.5, 1],
      multiplier: 1.0,
      easing: 'linear',
      threshold: 0.5
    }

    this.modulators.push(modulator)
    return modulator.id
  }

  removeModulator (modulatorId) {
    const index = this.modulators.findIndex(m => m.id === modulatorId)
    if (index !== -1) {
      this.modulators.splice(index, 1)
      return true
    }
    return false
  }

  updateModulator (modulatorId, updates) {
    const modulator = this.modulators.find(m => m.id === modulatorId)
    if (modulator) {
      Object.assign(modulator, updates)
      return true
    }
    return false
  }

  getModulators () {
    return this.modulators
  }

  getModulator (modulatorId) {
    return this.modulators.find(m => m.id === modulatorId)
  }

  generateWaveform (shape, phase, cubicBezier = [0.5, 0, 0.5, 1]) {
    // Normalize phase to 0-2π
    const normalizedPhase = ((phase % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2)

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
    return (performance.now() / 1000) - this.startTime
  }

  getModulatedValue (baseValue, modulator, configParam, noteData = null) {
    if (!modulator.enabled || !modulator.targetConfigKey) {
      return baseValue
    }

    const modulatorType = modulator.type || 'lfo'

    if (configParam.type === 'checkbox') {
      let normalizedValue = 0

      if (modulatorType === 'lfo') {
        const time = (performance.now() / 1000) - this.startTime
        const phase = time * modulator.rate * Math.PI * 2
        const waveform = this.generateWaveform(modulator.shape, phase, modulator.cubicBezier)
        normalizedValue = (waveform + 1) / 2
      } else if (modulatorType === 'numberOfNotes') {
        if (!noteData || !noteData.notes || noteData.notes.length === 0) {
          normalizedValue = 0
        } else {
          const noteCount = noteData.notes.length
          normalizedValue = Math.min(1, (noteCount * (modulator.multiplier || 1.0)) / 10)
          normalizedValue = this.applyEasing(normalizedValue, modulator.easing || 'linear')
        }
      } else if (modulatorType === 'velocity') {
        if (!noteData) {
          normalizedValue = 0
        } else {
          let velocity = 0
          if (noteData.velocity !== undefined) {
            velocity = noteData.velocity
          } else if (noteData.notes && noteData.notes.length > 0) {
            const velocities = noteData.notes.map(n => n.velocity || 0)
            velocity = velocities.reduce((a, b) => a + b, 0) / velocities.length
          }
          normalizedValue = Math.max(0, Math.min(1, velocity * (modulator.multiplier || 1.0)))
          normalizedValue = this.applyEasing(normalizedValue, modulator.easing || 'linear')
        }
      }

      const threshold = modulator.threshold !== undefined ? modulator.threshold : 0.5
      return normalizedValue >= threshold
    }

    let normalizedValue = 0

    if (modulatorType === 'lfo') {
      const time = (performance.now() / 1000) - this.startTime
      const phase = time * modulator.rate * Math.PI * 2
      const waveform = this.generateWaveform(modulator.shape, phase, modulator.cubicBezier)
      const modulationAmount = waveform * modulator.depth
      const offset = modulator.offset || 0

      const min = configParam.min
      const max = configParam.max
      const range = max - min

      const modulatedValue = baseValue + (modulationAmount * range) + (offset * range)

      return Math.max(min, Math.min(max, modulatedValue))
    } else if (modulatorType === 'numberOfNotes') {
      if (!noteData || !noteData.notes || noteData.notes.length === 0) {
        return baseValue
      }
      const noteCount = noteData.notes.length
      normalizedValue = Math.min(1, (noteCount * (modulator.multiplier || 1.0)) / 10)
      normalizedValue = this.applyEasing(normalizedValue, modulator.easing || 'linear')
    } else if (modulatorType === 'velocity') {
      if (!noteData) {
        return baseValue
      }
      let velocity = 0
      if (noteData.velocity !== undefined) {
        velocity = noteData.velocity
      } else if (noteData.notes && noteData.notes.length > 0) {
        const velocities = noteData.notes.map(n => n.velocity || 0)
        velocity = velocities.reduce((a, b) => a + b, 0) / velocities.length
      } else {
        return baseValue
      }
      normalizedValue = Math.max(0, Math.min(1, velocity * (modulator.multiplier || 1.0)))
      normalizedValue = this.applyEasing(normalizedValue, modulator.easing || 'linear')
    } else {
      return baseValue
    }

    const min = configParam.min
    const max = configParam.max
    const range = max - min
    const mappedValue = min + (normalizedValue * range)

    if (configParam.type === 'number') {
      return Math.round(mappedValue)
    }

    return Math.max(min, Math.min(max, mappedValue))
  }

  applyModulation (trackId, luminodeType, luminodeConfigKey, baseConfigValue, configParam) {
    const relevantModulators = this.modulators.filter(m =>
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
      modulatedValue = this.getModulatedValue(modulatedValue, modulator, configParam)
    }

    return modulatedValue
  }

  getModulatedConfig (trackId, luminodeType, baseConfig) {
    const modulatedConfig = { ...baseConfig }

    const relevantModulators = this.modulators.filter(m =>
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
    return ['lfo', 'numberOfNotes', 'velocity']
  }

  getModulatorTypeNames () {
    return {
      lfo: 'LFO',
      numberOfNotes: 'Number of Notes',
      velocity: 'Velocity'
    }
  }

  getEasingFunctions () {
    return ['linear', 'easeIn', 'easeOut', 'easeInOut', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 'smoothstep']
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
