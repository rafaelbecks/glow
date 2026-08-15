// MIDI CC (Control Change) mapping system for hardware control
// Provides declarative mapping of MIDI CC messages to GLOW parameters
import { getLuminodeConfig } from './luminode-configs.js'
import {
  getCanvasFilterParamByKey,
  valueToTableValues
} from './canvas-filter-configs.js'

/** Ranges / types for SETTINGS.CANVAS keys controllable via MIDI CC */
const CANVAS_CC_META = {
  CLEAR_ALPHA: { min: 0, max: 1, type: 'number' },
  LUMIA_EFFECT: { min: 0, max: 100, type: 'number' },
  INVERT_FILTER: { min: 0, max: 100, type: 'number' },
  GRAYSCALE_FILTER: { min: 0, max: 100, type: 'number' },
  HUE_ROTATE_FILTER: { min: 0, max: 360, type: 'number' },
  BRIGHTNESS_FILTER: { min: 0, max: 200, type: 'number' },
  CONTRAST_FILTER: { min: 0, max: 200, type: 'number' },
  SATURATION_FILTER: { min: 0, max: 200, type: 'number' },
  CRT_MODE: { type: 'boolean' },
  CRT_INTENSITY: { min: 0, max: 100, type: 'number' },
  GRID_ENABLED: { type: 'boolean' },
  GRID_X_LINES: { min: 1, max: 50, type: 'number' },
  GRID_Y_LINES: { min: 1, max: 50, type: 'number' },
  NOISE_OVERLAY: { type: 'boolean' },
  NOISE_ANIMATE: { type: 'boolean' },
  NOISE_OPACITY: { min: 0, max: 1, type: 'number' },
  NOISE_DENSITY: { min: 0, max: 1, type: 'number' },
  NOISE_PATTERN_WIDTH: { min: 1, max: 500, type: 'number' },
  NOISE_PATTERN_HEIGHT: { min: 1, max: 500, type: 'number' },
  NOISE_WIDTH: { min: 1, max: 20, type: 'number' },
  NOISE_HEIGHT: { min: 1, max: 20, type: 'number' },
  DITHER_OVERLAY: { type: 'boolean' },
  DITHER_SATURATE: { min: 0, max: 1, type: 'number' },
  DITHER_TABLE_VALUES_R: { min: 0, max: 1, type: 'tableValues' },
  DITHER_TABLE_VALUES_G: { min: 0, max: 1, type: 'tableValues' },
  DITHER_TABLE_VALUES_B: { min: 0, max: 1, type: 'tableValues' },
  CHROMATIC_ABERRATION_ENABLED: { type: 'boolean' },
  CHROMATIC_ABERRATION_CONTRAST: { min: 0, max: 5, type: 'number' },
  SHADER_BACKGROUND_ENABLED: { type: 'boolean' },
  SHADER_BACKGROUND_TRAIL_LENGTH: { min: 1, max: 60, type: 'number' },
  SHADER_BACKGROUND_CURSOR_MODE: { type: 'boolean' }
}

function resolveCanvasMeta (setting) {
  if (CANVAS_CC_META[setting]) return CANVAS_CC_META[setting]
  const filterParam = getCanvasFilterParamByKey(setting)
  if (filterParam) {
    return {
      min: filterParam.min,
      max: filterParam.max,
      type: filterParam.tableValues ? 'tableValues' : 'number'
    }
  }
  return null
}

export class MIDICCMapper {
  constructor (trackManager, mainApp) {
    this.trackManager = trackManager
    this.mainApp = mainApp
    this.mapping = null
    this.deviceId = null
    this.deviceName = null
    this.enabled = false
    this.currentTrackId = null
    this.currentLuminode = null
  }

  loadMapping (mappingConfig) {
    this.mapping = mappingConfig
    this.deviceId = mappingConfig.device?.id || null
    this.deviceName = mappingConfig.device?.name || null
    this.enabled = mappingConfig.enabled !== false
    console.log('MIDI CC Mapping loaded:', {
      enabled: this.enabled,
      deviceId: this.deviceId,
      deviceName: this.deviceName
    })
  }

  setEnabled (enabled) {
    this.enabled = enabled
  }

  matchesDevice (deviceId, deviceName) {
    if (!this.enabled || !this.mapping) return false

    // Match by ID if specified
    if (this.deviceId && deviceId === this.deviceId) return true

    // Match by name if specified (case-insensitive partial match)
    if (this.deviceName && deviceName) {
      const nameLower = deviceName.toLowerCase()
      const matchNameLower = this.deviceName.toLowerCase()
      if (nameLower.includes(matchNameLower) || matchNameLower.includes(nameLower)) {
        return true
      }
    }

    return false
  }

  /**
   * Handle a MIDI CC message
   * @param {number} cc - CC number (0-127)
   * @param {number} value - CC value (0-127)
   * @param {string} deviceId - MIDI device ID
   * @param {string} deviceName - MIDI device name
   */
  handleCC (cc, value, deviceId, deviceName) {
    if (!this.enabled || !this.mapping) return
    if (!this.matchesDevice(deviceId, deviceName)) return

    const normalizedValue = value / 127 // Normalize to 0-1

    if (this.mapping.trackSelection) {
      this.handleTrackSelection(cc, value)
    }

    if (this.mapping.luminodeSelection && this.mapping.luminodeSelection.cc === cc) {
      this.handleLuminodeSelection(value)
    }

    if (this.currentTrackId && this.currentLuminode && this.mapping.luminodeParameters) {
      this.handleLuminodeParameters(cc, normalizedValue)
    }

    if (this.currentTrackId && this.mapping.layout) {
      this.handleLayout(cc, normalizedValue)
    }

    if (this.currentTrackId && this.mapping.motion) {
      this.handleMotion(cc, normalizedValue)
    }

    if (this.mapping.mixer) {
      this.handleMixer(cc, value, normalizedValue)
    }

    if (this.mapping.canvas) {
      this.handleCanvas(cc, normalizedValue)
    }
  }

  handleTrackSelection (cc, value) {
    const trackMapping = this.mapping.trackSelection
    if (!trackMapping) return

    // Check if this CC is mapped to a track
    for (const [trackIdStr, trackCC] of Object.entries(trackMapping)) {
      const trackId = parseInt(trackIdStr)
      if (trackCC === cc) {
        // Value > 64 activates the track for parameter control
        const track = this.trackManager.getTrack(trackId)
        if (track) {
          if (value > 64) {
            // Set as current track for parameter control
            this.currentTrackId = trackId
            this.currentLuminode = track.luminode

            // Show debug message
            if (this.mainApp && this.mainApp.showDebugMessage) {
              this.mainApp.showDebugMessage(`track ${trackId} active`)
            }
          }
        }
        break
      }
    }
  }

  handleLuminodeSelection (value) {
    if (!this.currentTrackId) return

    const availableLuminodes = this.trackManager.getAvailableLuminodes()
    const index = Math.floor((value / 127) * availableLuminodes.length)
    const selectedLuminode = availableLuminodes[Math.min(index, availableLuminodes.length - 1)]

    if (selectedLuminode) {
      this.trackManager.setLuminode(this.currentTrackId, selectedLuminode)
      this.currentLuminode = selectedLuminode

      if (this.mainApp && this.mainApp.showDebugMessage) {
        this.mainApp.showDebugMessage(`luminode: ${selectedLuminode}`)
      }
    }
  }

  handleLuminodeParameters (cc, normalizedValue) {
    if (!this.mapping.luminodeParameters || !this.currentLuminode) {
      return
    }

    const paramConfig = this.mapping.luminodeParameters
    const startCC = paramConfig.start || 0
    const maxCC = paramConfig.max || 127

    if (cc < startCC || cc > maxCC) {
      return
    }

    const luminodeConfig = getLuminodeConfig(this.currentLuminode)
    if (!luminodeConfig || luminodeConfig.length === 0) {
      console.log('[MIDI CC] Luminode parameters: no config found', { luminode: this.currentLuminode })
      return
    }

    // Map CC to parameter index (relative to startCC)
    const paramIndex = cc - startCC

    if (paramIndex >= luminodeConfig.length) {
      return
    }

    const param = luminodeConfig[paramIndex]
    if (!param) {
      return
    }

    // Map normalized value to parameter range
    let paramValue
    if (param.type === 'number') {
      // For number types, round to nearest step
      const steps = (param.max - param.min) / param.step
      const stepIndex = Math.round(normalizedValue * steps)
      paramValue = param.min + (stepIndex * param.step)
    } else if (param.type === 'checkbox') {
      // For checkboxes, use threshold (value > 64 = true)
      paramValue = normalizedValue > 0.5
    } else {
      // For slider types, use continuous mapping
      paramValue = param.min + (normalizedValue * (param.max - param.min))
    }

    if (this.mainApp && this.mainApp.updateLuminodeConfig) {
      this.mainApp.updateLuminodeConfig({
        luminode: this.currentLuminode,
        param: param.key,
        value: paramValue
      })

      if (this.mainApp.showDebugMessage) {
        this.mainApp.showDebugMessage(`param: ${param.label} = ${paramValue}`)
      }
    } else {
      console.warn('[MIDI CC] Luminode parameters: mainApp or updateLuminodeConfig not available')
    }
  }

  handleLayout (cc, normalizedValue) {
    if (!this.mapping.layout) return

    const layoutMapping = this.mapping.layout
    // Convert CC to string for JSON key lookup
    const layoutParam = layoutMapping[String(cc)]

    if (layoutParam && this.currentTrackId) {
      const track = this.trackManager.getTrack(this.currentTrackId)
      if (track) {
        const currentLayout = track.layout || { x: 0, y: 0, rotation: 0 }

        let newValue
        if (layoutParam === 'x') {
          newValue = (normalizedValue - 0.5) * 1000 // -500 to 500
        } else if (layoutParam === 'y') {
          newValue = (normalizedValue - 0.5) * 1000 // -500 to 500
        } else if (layoutParam === 'rotation') {
          newValue = normalizedValue * 360 // 0 to 360
        } else {
          return
        }

        this.trackManager.setLayout(this.currentTrackId, {
          ...currentLayout,
          [layoutParam]: newValue
        })

        if (this.mainApp && this.mainApp.showDebugMessage) {
          const displayValue = layoutParam === 'rotation' ? `${newValue.toFixed(1)}°` : newValue.toFixed(1)
          this.mainApp.showDebugMessage(`layout ${layoutParam}: ${displayValue}`)
        }
      }
    }
  }

  handleMotion (cc, normalizedValue) {
    if (!this.mapping.motion) return

    const motionMapping = this.mapping.motion
    // Convert CC to string for JSON key lookup
    const motionParam = motionMapping[String(cc)]

    if (motionParam && this.currentTrackId) {
      const config = this.trackManager.getTrajectoryConfig(this.currentTrackId)
      if (config) {
        const updates = {}

        // Map CC to trajectory parameters
        if (motionParam === 'enabled') {
          updates.enabled = normalizedValue > 0.5
        } else if (motionParam === 'motionRate') {
          updates.motionRate = normalizedValue * 2 // 0 to 2
        } else if (motionParam === 'amplitude') {
          updates.amplitude = normalizedValue * 200 // 0 to 200
        } else if (motionParam === 'trajectoryType') {
          const types = this.trackManager.getTrajectoryTypes()
          const index = Math.floor(normalizedValue * types.length)
          updates.trajectoryType = types[Math.min(index, types.length - 1)]
        }

        if (Object.keys(updates).length > 0) {
          this.trackManager.updateTrajectoryConfig(this.currentTrackId, updates)
        }
      }
    }
  }

  /**
   * Mixer strip controls — absolute mute/solo (CC > 64 = on) and opacity faders.
   * Config shape:
   *   "mixer": {
   *     "opacity": { "1": 14, "2": 15 },
   *     "mute":    { "1": 23, "2": 24 },
   *     "solo":    { "1": 27, "2": 28 }
   *   }
   */
  handleMixer (cc, value, normalizedValue) {
    const mixer = this.mapping.mixer
    if (!mixer) return

    const matchTrack = (section) => {
      if (!section) return null
      for (const [trackIdStr, mappedCC] of Object.entries(section)) {
        if (Number(mappedCC) === cc) return parseInt(trackIdStr, 10)
      }
      return null
    }

    const opacityTrack = matchTrack(mixer.opacity)
    if (opacityTrack != null) {
      this.trackManager.setTrackOpacity(opacityTrack, normalizedValue)
      if (this.mainApp?.showDebugMessage) {
        this.mainApp.showDebugMessage(
          `mixer T${opacityTrack} opacity: ${normalizedValue.toFixed(2)}`
        )
      }
      return
    }

    const muteTrack = matchTrack(mixer.mute)
    if (muteTrack != null) {
      const muted = value > 64
      this.trackManager.setTrackMuted(muteTrack, muted)
      if (this.mainApp?.showDebugMessage) {
        this.mainApp.showDebugMessage(
          `mixer T${muteTrack} ${muted ? 'mute' : 'unmute'}`
        )
      }
      return
    }

    const soloTrack = matchTrack(mixer.solo)
    if (soloTrack != null) {
      const solo = value > 64
      this.trackManager.setTrackSolo(soloTrack, solo)
      if (this.mainApp?.showDebugMessage) {
        this.mainApp.showDebugMessage(
          `mixer T${soloTrack} solo ${solo ? 'on' : 'off'}`
        )
      }
    }
  }

  /**
   * Canvas / color-filter settings.
   * Config shape: "canvas": { "60": "CLEAR_ALPHA", "62": "INVERT_FILTER", ... }
   * Values are SETTINGS.CANVAS keys. Booleans use CC > 64; numbers map 0–127 → min–max.
   */
  handleCanvas (cc, normalizedValue) {
    const canvasMapping = this.mapping.canvas
    if (!canvasMapping) return

    const setting = canvasMapping[String(cc)]
    if (!setting) return

    const meta = resolveCanvasMeta(setting)
    if (!meta) {
      console.warn(`[MIDI CC] Unknown canvas setting: ${setting}`)
      return
    }

    let value
    if (meta.type === 'boolean') {
      value = normalizedValue > 0.5
    } else if (meta.type === 'tableValues') {
      value = valueToTableValues(normalizedValue)
    } else {
      const min = meta.min ?? 0
      const max = meta.max ?? 1
      value = min + normalizedValue * (max - min)
    }

    if (this.mainApp?.updateCanvasSetting) {
      this.mainApp.updateCanvasSetting({ setting, value })
      if (this.mainApp.showDebugMessage) {
        const display =
          typeof value === 'number' ? Number(value.toFixed(3)) : value
        this.mainApp.showDebugMessage(`canvas ${setting}: ${display}`)
      }
    }
  }

  /**
   * Get current state for debugging
   * @returns {Object}
   */
  getState () {
    return {
      enabled: this.enabled,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      currentTrackId: this.currentTrackId,
      currentLuminode: this.currentLuminode,
      hasMapping: !!this.mapping
    }
  }
}
