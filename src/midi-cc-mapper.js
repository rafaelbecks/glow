// MIDI CC (Control Change) mapping system for hardware control
// Provides declarative mapping of MIDI CC messages to GLOW parameters
import { getLuminodeConfig } from './luminode-configs.js'

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
  }

  handleTrackSelection (cc, value) {
    const trackMapping = this.mapping.trackSelection
    if (!trackMapping) return
    
    // Check if this CC is mapped to a track
    for (const [trackIdStr, trackCC] of Object.entries(trackMapping)) {
      const trackId = parseInt(trackIdStr)
      if (trackCC === cc) {
        // Value > 64 activates the track (unmute), value <= 64 deactivates (mute)
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
        let updates = {}
        
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

