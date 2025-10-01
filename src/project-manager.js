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
        crtIntensity: SETTINGS.CANVAS.CRT_INTENSITY
      },
      colors: {
        sotoPalette: [...SETTINGS.COLORS.SOTO_PALETTE],
        polygonColors: [...SETTINGS.COLORS.POLYGON_COLORS],
        pitchColorFactor: UTILS.pitchColorFactor
      },
      modules: this.collectModuleSettings(),
      tracks: this.collectTrackSettings(),
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

  // Load project state (for future implementation)
  loadProjectState (projectData) {
    try {
      this.validateProjectFile(projectData)
      
      // This will be implemented in the next phase
      console.log('Project loading will be implemented in the next phase')
      
      return true
    } catch (error) {
      console.error('Error loading project:', error)
      return false
    }
  }
}
