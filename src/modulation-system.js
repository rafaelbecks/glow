/**
 * GLOW — Modulation System
 * ------------------------------------------------------------
 * Allows specific luminode configuration values to change over time
 * according to configurable LFO-style modulators.
 */

export class ModulationSystem {
  constructor () {
    // Maximum of 4 modulators
    this.maxModulators = 4
    this.modulators = []
    
    // Store original config values for restoration
    this.originalConfigValues = new Map()
    
    // Global time reference (shared with animation loop)
    this.startTime = performance.now() / 1000
  }

  /**
   * Create a new modulator
   * @returns {string|null} Modulator ID if successful, null if max reached
   */
  addModulator () {
    if (this.modulators.length >= this.maxModulators) {
      return null
    }

    const modulator = {
      id: `modulator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      shape: 'sine',
      rate: 0.5, // oscillations per second
      depth: 0.5, // modulation amplitude (0-1, mapped to param range)
      offset: 0, // base value shift (-1 to 1, mapped to param range)
      enabled: true,
      targetTrack: 1, // 1-4
      targetConfigKey: null, // will be set via UI
      targetLuminode: null // luminode type for config key lookup
    }

    this.modulators.push(modulator)
    return modulator.id
  }

  /**
   * Remove a modulator
   */
  removeModulator (modulatorId) {
    const index = this.modulators.findIndex(m => m.id === modulatorId)
    if (index !== -1) {
      this.modulators.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Update modulator properties
   */
  updateModulator (modulatorId, updates) {
    const modulator = this.modulators.find(m => m.id === modulatorId)
    if (modulator) {
      Object.assign(modulator, updates)
      return true
    }
    return false
  }

  /**
   * Get all modulators
   */
  getModulators () {
    return this.modulators
  }

  /**
   * Get a specific modulator
   */
  getModulator (modulatorId) {
    return this.modulators.find(m => m.id === modulatorId)
  }

  /**
   * Generate LFO waveform value based on shape
   */
  generateWaveform (shape, phase) {
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
      default:
        return Math.sin(normalizedPhase)
    }
  }

  /**
   * Get current time in seconds (relative to start)
   */
  getCurrentTime () {
    return (performance.now() / 1000) - this.startTime
  }

  /**
   * Calculate modulated value for a config parameter
   */
  getModulatedValue (baseValue, modulator, configParam) {
    if (!modulator.enabled || !modulator.targetConfigKey) {
      return baseValue
    }

    const time = (performance.now() / 1000) - this.startTime
    const phase = time * modulator.rate * Math.PI * 2
    const waveform = this.generateWaveform(modulator.shape, phase)
    
    // Map waveform (-1 to 1) to modulation range
    const modulationAmount = waveform * modulator.depth
    
    // Calculate value range for this parameter
    const min = configParam.min
    const max = configParam.max
    const range = max - min
    
    // Apply modulation
    const modulatedValue = baseValue + (modulationAmount * range) + (modulator.offset * range)
    
    // Clamp to valid range
    return Math.max(min, Math.min(max, modulatedValue))
  }

  /**
   * Apply modulation to a track's luminode config
   * This temporarily modifies SETTINGS.MODULES values during rendering
   */
  applyModulation (trackId, luminodeType, luminodeConfigKey, baseConfigValue, configParam) {
    // Find modulators targeting this track and config key
    const relevantModulators = this.modulators.filter(m => 
      m.enabled && 
      m.targetTrack === trackId && 
      m.targetConfigKey === luminodeConfigKey &&
      m.targetLuminode === luminodeType
    )

    if (relevantModulators.length === 0) {
      return baseConfigValue
    }

    // Combine multiple modulators (simple addition for now)
    let modulatedValue = baseConfigValue
    
    for (const modulator of relevantModulators) {
      modulatedValue = this.getModulatedValue(modulatedValue, modulator, configParam)
    }

    return modulatedValue
  }

  /**
   * Get all modulated config values for a track's luminode
   * Returns a map of configKey -> modulatedValue
   */
  getModulatedConfig (trackId, luminodeType, baseConfig) {
    const modulatedConfig = { ...baseConfig }
    
    // Find all modulators for this track and luminode
    const relevantModulators = this.modulators.filter(m => 
      m.enabled && 
      m.targetTrack === trackId && 
      m.targetLuminode === luminodeType &&
      m.targetConfigKey !== null
    )

    if (relevantModulators.length === 0) {
      return modulatedConfig
    }

    // Need config param info for range clamping
    // This will be handled by the caller who has access to luminode-configs
    return modulatedConfig
  }

  /**
   * Reset all modulators
   */
  reset () {
    this.modulators = []
    this.originalConfigValues.clear()
  }

  /**
   * Get available waveform shapes
   */
  getWaveformShapes () {
    return ['sine', 'square', 'triangle', 'saw']
  }

  /**
   * Get waveform shape display names
   */
  getWaveformShapeNames () {
    return {
      sine: 'Sine',
      square: 'Square',
      triangle: 'Triangle',
      saw: 'Sawtooth'
    }
  }
}
