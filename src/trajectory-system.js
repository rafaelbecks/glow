/**
 * GLOW — Trajectory Motion System
 * ------------------------------------------------------------
 * Each luminode can have a trajectory type applied per track.
 * Motion is time-dependent and parameter-driven.
 */

export class TrajectorySystem {
  constructor () {
    // Global trajectory settings
    this.globalSettings = {
      enabled: true,
      speed: 0.2, // overall time scaling
      amplitude: 0.4, // base spatial range
      phaseOffset: 0.0 // global phase offset
    }

    // Per-track trajectory configurations
    this.trackConfigs = new Map()

    // Available trajectory types
    this.trajectoryTypes = ['whitney', 'lissajous', 'orbit', 'xAxis', 'yAxis', 'triangle', 'circle']

    // Initialize default configurations for existing tracks
    this.initializeDefaultConfigs()
  }

  // Initialize default trajectory configurations for tracks
  initializeDefaultConfigs () {
    // Default configuration for each track
    const defaultConfig = {
      enabled: false, // Disabled by default
      trajectoryType: 'whitney',
      motionRate: 0.5, // like an LFO rate, mapped to tempo or free
      ratioA: 1,
      ratioB: 2,
      ratioC: 3,
      offset: [0, 0, 0], // relative to layout base position
      phase: [0, Math.PI / 2, Math.PI / 4],
      amplitude: 100, // Increased amplitude for more visible motion
      inversion: false // Invert trajectory (multiply by -1)
    }

    // Initialize configs for tracks 1-4
    for (let i = 1; i <= 4; i++) {
      this.trackConfigs.set(i, { ...defaultConfig })
    }
  }

  // Get trajectory configuration for a specific track
  getTrackConfig (trackId) {
    return this.trackConfigs.get(trackId) || this.getDefaultConfig()
  }

  // Get default configuration
  getDefaultConfig () {
    return {
      enabled: false, // Disabled by default
      trajectoryType: 'whitney',
      motionRate: 0.5,
      ratioA: 1,
      ratioB: 2,
      ratioC: 3,
      offset: [0, 0, 0],
      phase: [0, Math.PI / 2, Math.PI / 4],
      amplitude: 100, // Increased amplitude for more visible motion
      inversion: false // Invert trajectory (multiply by -1)
    }
  }

  // Update trajectory configuration for a track
  updateTrackConfig (trackId, updates) {
    const currentConfig = this.getTrackConfig(trackId)
    const newConfig = { ...currentConfig, ...updates }
    this.trackConfigs.set(trackId, newConfig)
    return newConfig
  }

  // Get trajectory position for a track at a given time
  getPosition (trackId, time, basePosition = { x: 0, y: 0, z: 0 }) {
    const config = this.getTrackConfig(trackId)

    if (!config.enabled) {
      return { x: basePosition.x, y: basePosition.y, z: basePosition.z }
    }

    const trajectoryFn = this.trajectories[config.trajectoryType]
    if (!trajectoryFn) {
      return { x: basePosition.x, y: basePosition.y, z: basePosition.z }
    }

    // Calculate trajectory offset
    const trajectoryOffset = trajectoryFn(time * config.motionRate, config)

    // Apply inversion if enabled
    const multiplier = config.inversion ? -1 : 1

    return {
      x: basePosition.x + (trajectoryOffset[0] * multiplier),
      y: basePosition.y + (trajectoryOffset[1] * multiplier),
      z: basePosition.z + (trajectoryOffset[2] * multiplier)
    }
  }

  // Trajectory calculation functions
  trajectories = {
    /**
     * Type 1 — Whitney-style coupled oscillations
     * Elegant, non-central harmonic motion.
     */
    whitney: (t, config) => {
      const { ratioA, ratioB, ratioC, amplitude, phase, offset } = config
      return [
        offset[0] + amplitude * Math.cos(ratioA * t + phase[0]),
        offset[1] + amplitude * Math.sin(ratioB * t + phase[1]),
        offset[2] + amplitude * Math.sin(ratioC * t + phase[2])
      ]
    },

    /**
     * Type 2 — Lissajous / Harmonograph trajectory
     * Balanced harmonic motion, good for musical coupling.
     */
    lissajous: (t, config) => {
      const { ratioA, ratioB, ratioC, amplitude, phase, offset } = config
      return [
        offset[0] + amplitude * Math.sin(ratioA * t + phase[0]),
        offset[1] + amplitude * Math.sin(ratioB * t + phase[1]),
        offset[2] + amplitude * Math.sin(ratioC * t + phase[2])
      ]
    },

    /**
     * Type 3 — Precessing orbit (non-central motion)
     * Moving centers, like a nested circular orbit.
     */
    orbit: (t, config) => {
      const { ratioA, ratioB, amplitude, phase, offset } = config
      const R = amplitude * 0.6
      const r = amplitude * 0.4
      const center = [
        offset[0] + R * Math.cos(ratioA * t + phase[0]),
        offset[1] + R * Math.sin(ratioA * t + phase[1]),
        offset[2]
      ]
      return [
        center[0] + r * Math.cos(ratioB * t + phase[2]),
        center[1] + r * Math.sin(ratioB * t + phase[0]),
        center[2]
      ]
    },

    /**
     * Type 4 — X-axis movement
     * Simple horizontal oscillation.
     */
    xAxis: (t, config) => {
      const { ratioA, amplitude, phase, offset } = config
      return [
        offset[0] + amplitude * Math.sin(ratioA * t + phase[0]),
        offset[1],
        offset[2]
      ]
    },

    /**
     * Type 5 — Y-axis movement
     * Simple vertical oscillation.
     */
    yAxis: (t, config) => {
      const { ratioA, amplitude, phase, offset } = config
      return [
        offset[0],
        offset[1] + amplitude * Math.sin(ratioA * t + phase[0]),
        offset[2]
      ]
    },

    /**
     * Type 6 — Triangle wave movement
     * Linear sawtooth motion in X and Y.
     */
    triangle: (t, config) => {
      const { ratioA, ratioB, amplitude, phase, offset } = config
      // Triangle wave function
      const triangleWave = (x) => {
        return 2 * Math.abs(2 * (x - Math.floor(x + 0.5))) - 1
      }
      return [
        offset[0] + amplitude * triangleWave(ratioA * t + phase[0]),
        offset[1] + amplitude * triangleWave(ratioB * t + phase[1]),
        offset[2]
      ]
    },

    /**
     * Type 7 — Circle movement
     * Perfect circular motion in XY plane.
     */
    circle: (t, config) => {
      const { ratioA, amplitude, phase, offset } = config
      return [
        offset[0] + amplitude * Math.cos(ratioA * t + phase[0]),
        offset[1] + amplitude * Math.sin(ratioA * t + phase[0]),
        offset[2]
      ]
    }
  }

  // Get available trajectory types
  getTrajectoryTypes () {
    return this.trajectoryTypes
  }

  // Get trajectory type display names
  getTrajectoryTypeNames () {
    return {
      whitney: 'Whitney Oscillations',
      lissajous: 'Lissajous Curves',
      orbit: 'Precessing Orbit',
      xAxis: 'X-Axis Movement',
      yAxis: 'Y-Axis Movement',
      triangle: 'Triangle Wave',
      circle: 'Circular Motion'
    }
  }

  // Reset all track configurations to defaults
  resetAllConfigs () {
    this.trackConfigs.clear()
    this.initializeDefaultConfigs()
  }

  // Reset a specific track configuration
  resetTrackConfig (trackId) {
    const defaultConfig = this.getDefaultConfig()
    this.trackConfigs.set(trackId, { ...defaultConfig })
  }

  // Get all track configurations
  getAllConfigs () {
    const configs = {}
    for (const [trackId, config] of this.trackConfigs) {
      configs[trackId] = config
    }
    return configs
  }

  // Set global settings
  setGlobalSettings (settings) {
    this.globalSettings = { ...this.globalSettings, ...settings }
  }

  // Get global settings
  getGlobalSettings () {
    return { ...this.globalSettings }
  }
}
