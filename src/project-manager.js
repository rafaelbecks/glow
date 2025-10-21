// Project management system for saving and loading Glow projects
import { SETTINGS, UTILS } from './settings.js'

export class ProjectManager {
  constructor (glowVisualizer) {
    this.glowVisualizer = glowVisualizer
  }

  // Collect all current application state into a project object
  collectProjectState () {
    const state = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      canvas: {
        clearAlpha: SETTINGS.CANVAS.CLEAR_ALPHA,
        backgroundColor: SETTINGS.CANVAS.BACKGROUND_COLOR,
        crtMode: SETTINGS.CANVAS.CRT_MODE,
        crtIntensity: SETTINGS.CANVAS.CRT_INTENSITY,
        lumiaEffect: SETTINGS.CANVAS.LUMIA_EFFECT,
        gridEnabled: SETTINGS.CANVAS.GRID_ENABLED,
        gridXLines: SETTINGS.CANVAS.GRID_X_LINES,
        gridYLines: SETTINGS.CANVAS.GRID_Y_LINES,
        gridColor: SETTINGS.CANVAS.GRID_COLOR,
        noiseOverlay: SETTINGS.CANVAS.NOISE_OVERLAY,
        noiseAnimate: SETTINGS.CANVAS.NOISE_ANIMATE,
        noisePatternWidth: SETTINGS.CANVAS.NOISE_PATTERN_WIDTH,
        noisePatternHeight: SETTINGS.CANVAS.NOISE_PATTERN_HEIGHT,
        noiseOpacity: SETTINGS.CANVAS.NOISE_OPACITY,
        noiseDensity: SETTINGS.CANVAS.NOISE_DENSITY,
        noiseWidth: SETTINGS.CANVAS.NOISE_WIDTH,
        noiseHeight: SETTINGS.CANVAS.NOISE_HEIGHT
      },
      colors: {
        sotoPalette: [...SETTINGS.COLORS.SOTO_PALETTE],
        polygonColors: [...SETTINGS.COLORS.POLYGON_COLORS],
        pitchColorFactor: UTILS.pitchColorFactor
      },
      modules: this.collectModuleSettings(),
      tracks: this.collectTrackSettings(),
      trajectories: this.collectTrajectorySettings(),
      tablet: this.collectTabletSettings(),
      midi: this.collectMidiSettings()
    }

    return state
  }

  // Collect only luminode module settings for active tracks
  collectModuleSettings () {
    const modules = {}
    const tracks = this.glowVisualizer.trackManager.getTracks()

    // Only collect settings for luminodes that are actually assigned to tracks
    tracks.forEach(track => {
      if (track.luminode && SETTINGS.MODULES[track.luminode.toUpperCase()]) {
        const moduleKey = track.luminode.toUpperCase()
        modules[moduleKey] = { ...SETTINGS.MODULES[moduleKey] }
      }
    })

    return modules
  }

  // Collect track configuration
  collectTrackSettings () {
    const tracks = this.glowVisualizer.trackManager.getTracks()
    const availableDevices = this.glowVisualizer.trackManager.getAvailableMidiDevices()

    return {
      tracks: tracks.map(track => {
        const trackData = {
          id: track.id,
          name: track.name,
          muted: track.muted,
          solo: track.solo,
          midiDevice: track.midiDevice,
          luminode: track.luminode,
          layout: { ...track.layout }
        }

        // Add MIDI device info if assigned
        if (track.midiDevice) {
          const device = availableDevices.find(d => d.id === track.midiDevice)
          if (device) {
            trackData.midiDeviceInfo = {
              id: device.id,
              name: device.name,
              manufacturer: device.manufacturer
            }
          }
        }

        return trackData
      })
    }
  }

  // Collect trajectory settings for all tracks
  collectTrajectorySettings () {
    const tracks = this.glowVisualizer.trackManager.getTracks()
    const trajectories = {}

    tracks.forEach(track => {
      const config = this.glowVisualizer.trackManager.getTrajectoryConfig(track.id)
      if (config) {
        trajectories[track.id] = { ...config }
      }
    })

    return trajectories
  }

  // Collect tablet settings
  collectTabletSettings () {
    const tabletManager = this.glowVisualizer.tabletManager

    return {
      lineWidth: tabletManager.baseLineWidth || 4,
      geometricMode: tabletManager.geometricMode || false,
      shapeDetectionThreshold: tabletManager.shapeDetectionThreshold || 0.8,
      geometricPencilMode: tabletManager.geometricPencilMode || false,
      polygonSides: tabletManager.polygonSides || 3,
      polygonSize: tabletManager.polygonSize || 50,
      fadeDuration: tabletManager.fadeDuration || 3000,
      connectionMode: tabletManager.websocketMode ? 'websocket' : 'webhid',
      websocketHost: tabletManager.websocketHost || 'localhost',
      websocketPort: tabletManager.websocketPort || 5678
    }
  }

  // Collect MIDI settings
  collectMidiSettings () {
    const midiManager = this.glowVisualizer.midiManager

    return {
      outputEnabled: midiManager.outputEnabled || false,
      outputDevice: midiManager.outputDevice || null,
      octaveRange: midiManager.octaveRange || 3
    }
  }

  // Generate project file content as JSON string
  generateProjectFile (projectName) {
    const state = this.collectProjectState()
    state.name = projectName
    return JSON.stringify(state, null, 2)
  }

  // Download project file
  downloadProject (projectName) {
    const content = this.generateProjectFile(projectName)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `${projectName}.glow`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Validate project file structure
  validateProjectFile (projectData) {
    const requiredFields = ['version', 'canvas', 'colors', 'modules', 'tracks', 'tablet', 'midi']

    for (const field of requiredFields) {
      if (!projectData.hasOwnProperty(field)) {
        throw new Error(`Invalid project file: missing required field '${field}'`)
      }
    }

    return true
  }

  // Load project state from project data
  async loadProjectState (projectData) {
    try {
      this.validateProjectFile(projectData)

      console.log('Loading project:', projectData.name || 'Unnamed Project')

      // Load canvas settings
      this.loadCanvasSettings(projectData.canvas)

      // Load color settings
      this.loadColorSettings(projectData.colors)

      // Load module settings
      this.loadModuleSettings(projectData.modules)

      // Load track settings
      await this.loadTrackSettings(projectData.tracks)

      // Load trajectory settings
      this.loadTrajectorySettings(projectData.trajectories || {})

      // Load MIDI settings
      await this.loadMidiSettings(projectData.midi)

      // Trigger UI updates
      this.glowVisualizer.sidePanel.renderTracks()

      console.log('Project loaded successfully')
      return true
    } catch (error) {
      console.error('Error loading project:', error)
      return false
    }
  }

  // Load canvas settings
  loadCanvasSettings (canvasData) {
    if (!canvasData) return

    // Update SETTINGS object
    if (canvasData.clearAlpha !== undefined) {
      SETTINGS.CANVAS.CLEAR_ALPHA = canvasData.clearAlpha
      this.glowVisualizer.canvasDrawer.setClearAlpha(canvasData.clearAlpha)
    }

    if (canvasData.backgroundColor !== undefined) {
      SETTINGS.CANVAS.BACKGROUND_COLOR = canvasData.backgroundColor
      this.glowVisualizer.canvasDrawer.setBackgroundColor(canvasData.backgroundColor)
    }

    if (canvasData.crtMode !== undefined) {
      SETTINGS.CANVAS.CRT_MODE = canvasData.crtMode
      this.glowVisualizer.toggleCRTMode(canvasData.crtMode)
    }

    if (canvasData.crtIntensity !== undefined) {
      SETTINGS.CANVAS.CRT_INTENSITY = canvasData.crtIntensity
      this.glowVisualizer.setCRTIntensity(canvasData.crtIntensity)
    }

    if (canvasData.lumiaEffect !== undefined) {
      SETTINGS.CANVAS.LUMIA_EFFECT = canvasData.lumiaEffect
      this.glowVisualizer.updateLumiaEffect(canvasData.lumiaEffect)
    }

    if (canvasData.gridEnabled !== undefined) {
      SETTINGS.CANVAS.GRID_ENABLED = canvasData.gridEnabled
    }

    if (canvasData.gridXLines !== undefined) {
      SETTINGS.CANVAS.GRID_X_LINES = canvasData.gridXLines
    }

    if (canvasData.gridYLines !== undefined) {
      SETTINGS.CANVAS.GRID_Y_LINES = canvasData.gridYLines
    }

    if (canvasData.gridColor !== undefined) {
      SETTINGS.CANVAS.GRID_COLOR = canvasData.gridColor
    }

    // Noise overlay settings
    if (canvasData.noiseOverlay !== undefined) {
      SETTINGS.CANVAS.NOISE_OVERLAY = canvasData.noiseOverlay
      this.glowVisualizer.toggleNoiseOverlay(canvasData.noiseOverlay)
    }

    if (canvasData.noiseAnimate !== undefined) {
      SETTINGS.CANVAS.NOISE_ANIMATE = canvasData.noiseAnimate
      this.glowVisualizer.updateNoiseOptions({ animate: canvasData.noiseAnimate })
    }

    if (canvasData.noisePatternWidth !== undefined) {
      SETTINGS.CANVAS.NOISE_PATTERN_WIDTH = canvasData.noisePatternWidth
      this.glowVisualizer.updateNoiseOptions({ patternWidth: canvasData.noisePatternWidth })
    }

    if (canvasData.noisePatternHeight !== undefined) {
      SETTINGS.CANVAS.NOISE_PATTERN_HEIGHT = canvasData.noisePatternHeight
      this.glowVisualizer.updateNoiseOptions({ patternHeight: canvasData.noisePatternHeight })
    }

    if (canvasData.noiseOpacity !== undefined) {
      SETTINGS.CANVAS.NOISE_OPACITY = canvasData.noiseOpacity
      this.glowVisualizer.updateNoiseOptions({ grainOpacity: canvasData.noiseOpacity })
    }

    if (canvasData.noiseDensity !== undefined) {
      SETTINGS.CANVAS.NOISE_DENSITY = canvasData.noiseDensity
      this.glowVisualizer.updateNoiseOptions({ grainDensity: canvasData.noiseDensity })
    }

    if (canvasData.noiseWidth !== undefined) {
      SETTINGS.CANVAS.NOISE_WIDTH = canvasData.noiseWidth
      this.glowVisualizer.updateNoiseOptions({ grainWidth: canvasData.noiseWidth })
    }

    if (canvasData.noiseHeight !== undefined) {
      SETTINGS.CANVAS.NOISE_HEIGHT = canvasData.noiseHeight
      this.glowVisualizer.updateNoiseOptions({ grainHeight: canvasData.noiseHeight })
    }
  }

  // Load color settings
  loadColorSettings (colorData) {
    if (!colorData) return

    if (colorData.sotoPalette) {
      SETTINGS.COLORS.SOTO_PALETTE = [...colorData.sotoPalette]
    }

    if (colorData.polygonColors) {
      SETTINGS.COLORS.POLYGON_COLORS = [...colorData.polygonColors]
    }

    if (colorData.pitchColorFactor !== undefined) {
      UTILS.pitchColorFactor = colorData.pitchColorFactor
    }
  }

  // Load module settings
  loadModuleSettings (moduleData) {
    if (!moduleData) return

    Object.keys(moduleData).forEach(moduleKey => {
      if (SETTINGS.MODULES[moduleKey]) {
        Object.assign(SETTINGS.MODULES[moduleKey], moduleData[moduleKey])
      }
    })
  }

  // Load track settings
  async loadTrackSettings (trackData) {
    if (!trackData || !trackData.tracks) return

    const tracks = this.glowVisualizer.trackManager.getTracks()
    const availableDevices = this.glowVisualizer.trackManager.getAvailableMidiDevices()

    // Clear existing track luminodes
    this.glowVisualizer.trackLuminodes.clear()

    trackData.tracks.forEach((trackConfig, index) => {
      if (index < tracks.length) {
        const track = tracks[index]

        // Update track properties
        track.name = trackConfig.name || track.name
        track.muted = trackConfig.muted || false
        track.solo = trackConfig.solo || false
        track.layout = { ...track.layout, ...(trackConfig.layout || {}) }

        // Handle luminode assignment
        if (trackConfig.luminode) {
          track.luminode = trackConfig.luminode
          // Create luminode instance for this track
          this.glowVisualizer.createLuminodeForTrack(track.id, trackConfig.luminode)
        }

        // Handle MIDI device assignment
        if (trackConfig.midiDevice && trackConfig.midiDeviceInfo) {
          // Check if device is still available
          const deviceExists = availableDevices.find(d => d.id === trackConfig.midiDevice)
          if (deviceExists) {
            track.midiDevice = trackConfig.midiDevice
          } else {
            // Device not available, set to null and show "Select Device"
            track.midiDevice = null
            console.warn(`MIDI device "${trackConfig.midiDeviceInfo.name}" not available`)
          }
        } else {
          track.midiDevice = null
        }

        // Trigger track update callback to notify UI
        this.glowVisualizer.trackManager.triggerCallback('trackUpdated', { trackId: track.id, track })
      }
    })
  }

  // Load trajectory settings
  loadTrajectorySettings (trajectoryData) {
    if (!trajectoryData) return

    Object.keys(trajectoryData).forEach(trackId => {
      const config = trajectoryData[trackId]
      if (config) {
        this.glowVisualizer.trackManager.updateTrajectoryConfig(parseInt(trackId), config)
      }
    })
  }

  // Load MIDI settings
  async loadMidiSettings (midiData) {
    if (!midiData) return

    const midiManager = this.glowVisualizer.midiManager

    // Handle MIDI output device
    if (midiData.outputDevice) {
      const availableDevices = await midiManager.getAvailableOutputDevices()
      const deviceExists = availableDevices.find(d => d.id === midiData.outputDevice)

      if (deviceExists) {
        midiManager.setOutputDevice(midiData.outputDevice)
        midiManager.initializeOutput()
      } else {
        console.warn(`MIDI output device not available: ${midiData.outputDevice}`)
        midiManager.setOutputDevice(null)
      }
    }
  }
}
