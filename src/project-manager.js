import { SETTINGS, UTILS } from './settings.js'

export class ProjectManager {
  constructor (glowVisualizer) {
    this.glowVisualizer = glowVisualizer
    this.currentFileHandle = null
    this.currentProjectName = 'Untitled Project'
    this.savedState = null
    this.hasUnsavedChanges = false
  }

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
        noiseHeight: SETTINGS.CANVAS.NOISE_HEIGHT,
        ditherOverlay: SETTINGS.CANVAS.DITHER_OVERLAY,
        ditherSaturate: SETTINGS.CANVAS.DITHER_SATURATE,
        ditherTableValuesR: SETTINGS.CANVAS.DITHER_TABLE_VALUES_R,
        ditherTableValuesG: SETTINGS.CANVAS.DITHER_TABLE_VALUES_G,
        ditherTableValuesB: SETTINGS.CANVAS.DITHER_TABLE_VALUES_B
      },
      colors: {
        sotoPalette: [...SETTINGS.COLORS.SOTO_PALETTE],
        polygonColors: [...SETTINGS.COLORS.POLYGON_COLORS],
        pitchColorFactor: UTILS.pitchColorFactor
      },
      modules: this.collectModuleSettings(),
      tracks: this.collectTrackSettings(),
      trajectories: this.collectTrajectorySettings(),
      modulation: this.collectModulationSettings(),
      tablet: this.collectTabletSettings(),
      midi: this.collectMidiSettings()
    }

    return state
  }

  collectModuleSettings () {
    const modules = {}
    const tracks = this.glowVisualizer.trackManager.getTracks()

    tracks.forEach(track => {
      if (track.luminode && SETTINGS.MODULES[track.luminode.toUpperCase()]) {
        const moduleKey = track.luminode.toUpperCase()
        modules[moduleKey] = { ...SETTINGS.MODULES[moduleKey] }
      }
    })

    return modules
  }

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

  collectModulationSettings () {
    const modulationSystem = this.glowVisualizer.trackManager.getModulationSystem()
    const modulators = modulationSystem.getModulators()

    return {
      modulators: modulators.map(modulator => ({
        id: modulator.id,
        shape: modulator.shape,
        rate: modulator.rate,
        depth: modulator.depth,
        offset: modulator.offset,
        enabled: modulator.enabled,
        targetTrack: modulator.targetTrack,
        targetConfigKey: modulator.targetConfigKey,
        targetLuminode: modulator.targetLuminode
      }))
    }
  }

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

  collectMidiSettings () {
    const midiManager = this.glowVisualizer.midiManager

    return {
      outputEnabled: midiManager.outputEnabled || false,
      outputDevice: midiManager.outputDevice || null,
      octaveRange: midiManager.octaveRange || 3
    }
  }

  generateProjectFile (projectName) {
    const state = this.collectProjectState()
    state.name = projectName
    return JSON.stringify(state, null, 2)
  }

  getCurrentState () {
    return this.collectProjectState()
  }

  checkForUnsavedChanges () {
    if (!this.savedState) {
      return this.currentFileHandle !== null
    }

    const currentState = this.getCurrentState()
    const savedStateCopy = { ...this.savedState }
    const currentStateCopy = { ...currentState }
    
    delete savedStateCopy.timestamp
    delete currentStateCopy.timestamp
    
    const currentStateStr = JSON.stringify(currentStateCopy)
    const savedStateStr = JSON.stringify(savedStateCopy)
    
    return currentStateStr !== savedStateStr
  }

  updateUnsavedChangesFlag () {
    this.hasUnsavedChanges = this.checkForUnsavedChanges()
    return this.hasUnsavedChanges
  }

  async saveNewProject (projectName) {
    try {
      if (!('showSaveFilePicker' in window)) {
        throw new Error('File System Access API is not supported in this browser')
      }

    const content = this.generateProjectFile(projectName)
    const blob = new Blob([content], { type: 'application/json' })

      const fileHandle = await window.showSaveFilePicker({
        suggestedName: `${projectName}.glow`,
        types: [{
          description: 'Glow Project Files',
          accept: {
            'application/json': ['.glow']
          }
        }]
      })

      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()

      this.currentFileHandle = fileHandle
      this.currentProjectName = projectName
      this.savedState = this.getCurrentState()
      this.hasUnsavedChanges = false

      this.addToRecentProjects(fileHandle, projectName)

      return { success: true, fileHandle, projectName }
    } catch (error) {
      if (error.name === 'AbortError') {
        return { success: false, cancelled: true }
      }
      throw error
    }
  }

  async saveExistingProject () {
    if (!this.currentFileHandle) {
      return this.saveNewProject(this.currentProjectName)
    }

    try {
      const content = this.generateProjectFile(this.currentProjectName)
      const blob = new Blob([content], { type: 'application/json' })

      const writable = await this.currentFileHandle.createWritable()
      await writable.write(blob)
      await writable.close()

      this.savedState = this.getCurrentState()
      this.hasUnsavedChanges = false

      this.addToRecentProjects(this.currentFileHandle, this.currentProjectName)

      return { success: true }
    } catch (error) {
      if (error.name === 'PermissionDeniedError') {
        return this.saveNewProject(this.currentProjectName)
      }
      throw error
    }
  }

  async saveProject (projectName = null) {
    if (projectName && !this.currentFileHandle) {
      return this.saveNewProject(projectName)
    } else if (this.currentFileHandle) {
      return this.saveExistingProject()
    } else {
      throw new Error('No file handle and no project name provided')
    }
  }

  async openProject (fileHandle = null) {
    try {
      if (!('showOpenFilePicker' in window)) {
        throw new Error('File System Access API is not supported in this browser')
      }

      let handle = fileHandle

      if (!handle) {
        const [selectedHandle] = await window.showOpenFilePicker({
          types: [{
            description: 'Glow Project Files',
            accept: {
              'application/json': ['.glow']
            }
          }],
          multiple: false
        })
        handle = selectedHandle
      }

      const file = await handle.getFile()
      const content = await file.text()
      const projectData = JSON.parse(content)

      return await this.openProjectWithData(handle, projectData, file)
    } catch (error) {
      if (error.name === 'AbortError') {
        return { cancelled: true }
      }
      throw error
    }
  }

  async openProjectWithData (fileHandle, projectData, file) {
    try {
      this.validateProjectFile(projectData)
      
      this.currentFileHandle = fileHandle
      this.currentProjectName = projectData.name || file.name.replace('.glow', '')

      const loadSuccess = await this.loadProjectState(projectData)
      
      if (!loadSuccess) {
        this.currentFileHandle = null
        this.currentProjectName = 'Untitled Project'
        throw new Error('Failed to load project state')
      }

      this.savedState = this.getCurrentState()
      this.hasUnsavedChanges = false

      this.addToRecentProjects(fileHandle, this.currentProjectName)

      return { success: true, file, projectData, fileHandle }
    } catch (error) {
      this.currentFileHandle = null
      this.currentProjectName = 'Untitled Project'
      throw error
    }
  }

  getRecentProjects () {
    try {
      const recent = localStorage.getItem('glow_recent_projects')
      if (!recent) return []
      return JSON.parse(recent)
    } catch (error) {
      console.error('Error reading recent projects:', error)
      return []
    }
  }

  async addToRecentProjects (fileHandle, projectName) {
    try {
      const file = await fileHandle.getFile()
      const fileName = file.name
      
      const recentProjects = this.getRecentProjects()
      
      const existingIndex = recentProjects.findIndex(p => p.fileName === fileName)
      if (existingIndex !== -1) {
        recentProjects.splice(existingIndex, 1)
      }

      const projectInfo = {
        fileName,
        projectName,
        lastOpened: Date.now()
      }

      recentProjects.unshift(projectInfo)

      const maxRecent = 5
      if (recentProjects.length > maxRecent) {
        recentProjects.splice(maxRecent)
      }

      localStorage.setItem('glow_recent_projects', JSON.stringify(recentProjects))
    } catch (error) {
      console.error('Error saving recent projects:', error)
    }
  }

  clearProject () {
    this.currentFileHandle = null
    this.currentProjectName = 'Untitled Project'
    this.savedState = null
    this.hasUnsavedChanges = false
  }

  getCurrentProjectName () {
    return this.currentProjectName
  }

  setCurrentProjectName (name) {
    this.currentProjectName = name
    if (this.currentFileHandle) {
      this.updateUnsavedChangesFlag()
    }
  }

  hasOpenFile () {
    return this.currentFileHandle !== null
  }

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

      // Load modulation settings
      this.loadModulationSettings(projectData.modulation || {})

      // Load MIDI settings
      await this.loadMidiSettings(projectData.midi)

      this.glowVisualizer.sidePanel.renderTracks()
      this.glowVisualizer.sidePanel.modulationUIManager.renderModulationControls()

      console.log('Project loaded successfully')
      return true
    } catch (error) {
      console.error('Error loading project:', error)
      return false
    }
  }

  loadCanvasSettings (canvasData) {
    if (!canvasData) return

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

    if (canvasData.ditherOverlay !== undefined) {
      SETTINGS.CANVAS.DITHER_OVERLAY = canvasData.ditherOverlay
      this.glowVisualizer.toggleDitherOverlay(canvasData.ditherOverlay)
    }

    if (canvasData.ditherSaturate !== undefined) {
      SETTINGS.CANVAS.DITHER_SATURATE = canvasData.ditherSaturate
      this.glowVisualizer.updateDitherSaturate(canvasData.ditherSaturate)
    }

    if (canvasData.ditherTableValuesR !== undefined) {
      SETTINGS.CANVAS.DITHER_TABLE_VALUES_R = canvasData.ditherTableValuesR
      this.glowVisualizer.updateDitherTableValues('R', canvasData.ditherTableValuesR)
    }

    if (canvasData.ditherTableValuesG !== undefined) {
      SETTINGS.CANVAS.DITHER_TABLE_VALUES_G = canvasData.ditherTableValuesG
      this.glowVisualizer.updateDitherTableValues('G', canvasData.ditherTableValuesG)
    }

    if (canvasData.ditherTableValuesB !== undefined) {
      SETTINGS.CANVAS.DITHER_TABLE_VALUES_B = canvasData.ditherTableValuesB
      this.glowVisualizer.updateDitherTableValues('B', canvasData.ditherTableValuesB)
    }
  }

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

  loadModuleSettings (moduleData) {
    if (!moduleData) return

    Object.keys(moduleData).forEach(moduleKey => {
      if (SETTINGS.MODULES[moduleKey]) {
        Object.assign(SETTINGS.MODULES[moduleKey], moduleData[moduleKey])
      }
    })
  }

  async loadTrackSettings (trackData) {
    if (!trackData || !trackData.tracks) return

    const tracks = this.glowVisualizer.trackManager.getTracks()
    const availableDevices = this.glowVisualizer.trackManager.getAvailableMidiDevices()

    this.glowVisualizer.trackLuminodes.clear()

    trackData.tracks.forEach((trackConfig, index) => {
      if (index < tracks.length) {
        const track = tracks[index]

        track.name = trackConfig.name || track.name
        track.muted = trackConfig.muted || false
        track.solo = trackConfig.solo || false
        track.layout = { ...track.layout, ...(trackConfig.layout || {}) }

        if (trackConfig.luminode) {
          track.luminode = trackConfig.luminode
          this.glowVisualizer.createLuminodeForTrack(track.id, trackConfig.luminode)
        }

        if (trackConfig.midiDevice && trackConfig.midiDeviceInfo) {
          const deviceExists = availableDevices.find(d => d.id === trackConfig.midiDevice)
          if (deviceExists) {
            track.midiDevice = trackConfig.midiDevice
          } else {
            track.midiDevice = null
            console.warn(`MIDI device "${trackConfig.midiDeviceInfo.name}" not available`)
          }
        } else {
          track.midiDevice = null
        }

        this.glowVisualizer.trackManager.triggerCallback('trackUpdated', { trackId: track.id, track })
      }
    })
  }

  loadTrajectorySettings (trajectoryData) {
    if (!trajectoryData) return

    Object.keys(trajectoryData).forEach(trackId => {
      const config = trajectoryData[trackId]
      if (config) {
        this.glowVisualizer.trackManager.updateTrajectoryConfig(parseInt(trackId), config)
      }
    })
  }

  loadModulationSettings (modulationData) {
    if (!modulationData || !modulationData.modulators) return

    const modulationSystem = this.glowVisualizer.trackManager.getModulationSystem()
    
    modulationSystem.reset()

    modulationData.modulators.forEach(modulatorData => {
      const modulatorId = modulationSystem.addModulator()
      if (modulatorId) {
        modulationSystem.updateModulator(modulatorId, {
          id: modulatorData.id || modulatorId,
          shape: modulatorData.shape || 'sine',
          rate: modulatorData.rate !== undefined ? modulatorData.rate : 0.5,
          depth: modulatorData.depth !== undefined ? modulatorData.depth : 0.5,
          offset: modulatorData.offset !== undefined ? modulatorData.offset : 0,
          enabled: modulatorData.enabled !== undefined ? modulatorData.enabled : true,
          targetTrack: modulatorData.targetTrack !== undefined ? modulatorData.targetTrack : 1,
          targetConfigKey: modulatorData.targetConfigKey || null,
          targetLuminode: modulatorData.targetLuminode || null
        })
      }
    })
  }

  async loadMidiSettings (midiData) {
    if (!midiData) return

    const midiManager = this.glowVisualizer.midiManager

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
