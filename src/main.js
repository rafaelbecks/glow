// Main application bootstrap and orchestration
import { SETTINGS, UTILS } from './settings.js'
import { MIDIManager } from './midi.js'
import { TrackManager } from './track-manager.js'
import { SidePanel } from './side-panel.js'
import { TabletManager } from './tablet-manager.js'
import { CanvasDrawer } from './canvas-drawer.js'
import { UIManager } from './ui.js'
import { ProjectManager } from './project-manager.js'
import { SaveDialog } from './components/save-dialog.js'
import { FilePickerDialog } from './components/file-picker-dialog.js'
import { getLuminodeConfig } from './luminode-configs.js'
import { MIDICCMapper } from './midi-cc-mapper.js'
import { LUMINODE_REGISTRY, getLuminodeSettingsKey } from './luminodes/index.js'
import { FluidBackgroundManager } from './fluid-background-manager.js'

export class GLOWVisualizer {
  constructor () {
    this.canvas = document.getElementById('canvas')
    this.fluidBackgroundCanvas = document.getElementById('fluidBackgroundCanvas')
    this.tabletCanvas = document.getElementById('tabletCanvas')
    this.canvasDrawer = new CanvasDrawer(this.canvas)
    this.trackManager = new TrackManager()
    
    this.ccMapper = null
    if (SETTINGS.HARDWARE_MODE.ENABLED) {
      this.ccMapper = new MIDICCMapper(this.trackManager, this)
    }
    
    this.midiManager = new MIDIManager(this.trackManager, this.ccMapper)
    if (this.ccMapper) {
      this.midiManager.setCCMapper(this.ccMapper)
    }
    this.tabletManager = new TabletManager(this.tabletCanvas, { midiManager: this.midiManager })
    this.uiManager = new UIManager()
    this.sidePanel = new SidePanel(this.trackManager, this.tabletManager, this.uiManager, this.midiManager)
    this.sidePanel.setSettings(SETTINGS)
    this.projectManager = new ProjectManager(this)
    this.saveDialog = new SaveDialog()
    this.filePickerDialog = new FilePickerDialog(this.projectManager)
    this.visualizerStarted = false

    // CRT overlay element
    this.crtOverlay = null
    this.crtModeEnabled = false
    this.crtIntensity = 100

    // Noise overlay element
    this.noiseOverlay = null
    this.noiseModeEnabled = false
    this.grainedInstance = null
    this.noiseOptions = {
      animate: true,
      patternWidth: 100,
      patternHeight: 100,
      grainOpacity: 0.05,
      grainDensity: 1,
      grainWidth: 1,
      grainHeight: 1
    }

    // Dither overlay element
    this.ditherOverlay = null
    this.ditherModeEnabled = false

    // Chromatic aberration overlay element
    this.chromaticAberrationOverlay = null
    this.chromaticAberrationModeEnabled = false
    this.chromaticAberrationCanvas = null
    this.chromaticAberrationCtx = null

    // Fluid background manager
    this.fluidBackgroundManager = new FluidBackgroundManager(this.fluidBackgroundCanvas)

    this.luminodeFactory = Object.fromEntries(
      Object.entries(LUMINODE_REGISTRY).map(([key, reg]) => [key, reg.class])
    )

    // Track-based luminode instances
    this.trackLuminodes = new Map() // Maps trackId -> luminode instance

    this.isRunning = false
    this.animationId = null

    this.debugOverlay = document.getElementById('midiDebugOverlay')
    this.debugVisible = false
    this.debugTimeout = null

    this.setupEventHandlers()
    this.setupSaveDialog()
    this.setupFilePickerDialog()
    this.setupLogoButtons()
    this.initialize().catch(error => console.error('Failed to initialize:', error))
  }

  async initialize () {
    // Initial canvas setup
    this.canvasDrawer.resize()
    this.resizeFluidBackgroundCanvas()
    this.resizeTabletCanvas()

    // Create CRT overlay
    this.createCRTOverlay()

    // Create noise overlay
    this.createNoiseOverlay()

    // Create dither overlay
    this.createDitherOverlay()

    // Create chromatic aberration overlay
    this.createChromaticAberrationOverlay()

    // Initialize fluid background
    if (this.fluidBackgroundManager.init()) {
      this.updateFluidBackgroundSettings()
    }

    this.uiManager.showStatus('Connecting to MIDI devices...', 'info')

    await this.midiManager.setupMIDI()
  }

  resizeFluidBackgroundCanvas () {
    if (this.fluidBackgroundCanvas) {
      this.fluidBackgroundCanvas.width = window.innerWidth
      this.fluidBackgroundCanvas.height = window.innerHeight
    }
  }

  resizeTabletCanvas () {
    // Resize tablet canvas to match main canvas
    this.tabletManager.resizeCanvas()
  }

  setupEventHandlers () {
    // UI event handlers
    this.uiManager.on('startVisualizer', () => this.start())
    this.uiManager.on('connectTablet', () => this.connectTablet())
    this.uiManager.on('clearTablet', () => this.clearTablet())
    this.uiManager.on('clearCanvas', () => this.clearCanvas())
    this.uiManager.on('tabletWidthChange', (width) => this.setTabletWidth(width))
    this.uiManager.on('resize', () => this.handleResize())
    this.uiManager.on('togglePanel', () => this.toggleSidePanel())
    this.uiManager.on('openFile', () => this.openFile())
    this.uiManager.on('saveFile', () => this.saveFile())
    this.uiManager.on('toggleMute', (trackId) => this.trackManager.toggleMute(trackId))
    this.uiManager.on('toggleSolo', (trackId) => this.trackManager.toggleSolo(trackId))
    this.uiManager.on('enableHardwareMode', () => this.enableHardwareMode())
    this.uiManager.on('toggleDebugOverlay', () => this.toggleDebugOverlay())

    // Side panel events (now includes both tracks and tablet functionality)
    this.sidePanel.on('luminodeConfigChange', (data) => this.updateLuminodeConfig(data))
    this.sidePanel.on('connectTablet', () => this.connectTablet())
    this.sidePanel.on('clearTablet', () => this.clearTablet())
    this.sidePanel.on('tabletWidthChange', (width) => this.setTabletWidth(width))
    this.sidePanel.on('geometricModeChange', (enabled) => this.setGeometricMode(enabled))
    this.sidePanel.on('shapeDetectionThresholdChange', (threshold) => this.setShapeDetectionThreshold(threshold))
    this.sidePanel.on('geometricPencilChange', (enabled) => this.setGeometricPencilMode(enabled))
    this.sidePanel.on('polygonSidesChange', (sides) => this.setPolygonSides(sides))
    this.sidePanel.on('polygonSizeChange', (size) => this.setPolygonSize(size))
    this.sidePanel.on('fadeDurationChange', (duration) => this.setFadeDuration(duration))
    this.sidePanel.on('midiOutputChange', (enabled) => this.setMidiOutputEnabled(enabled))
    this.sidePanel.on('midiOutputDeviceChange', (deviceId) => this.setMidiOutputDevice(deviceId))
    this.sidePanel.on('octaveRangeChange', (range) => this.setOctaveRange(range))

    // Track manager events
    this.trackManager.on('luminodeChanged', (data) => this.handleLuminodeChange(data))
    this.trackManager.on('trackUpdated', () => this.markProjectChanged())

    // Canvas and color settings
    this.sidePanel.on('canvasSettingChange', (data) => this.updateCanvasSetting(data))
    this.sidePanel.on('colorPaletteChange', (data) => this.updateColorPalette(data))
    this.sidePanel.on('pitchColorFactorChange', (data) => this.updatePitchColorFactor(data))
  }

  setupSaveDialog () {
    // Save dialog event handlers
    this.saveDialog.on('save', (data) => this.handleProjectSave(data))
    this.saveDialog.setupEventListeners()
  }

  setupFilePickerDialog () {
    this.filePickerDialog.on('fileSelected', (data) => this.handleProjectLoad(data))
    this.filePickerDialog.setupEventListeners()
  }

  setupLogoButtons () {
    const openButtonLogo = document.getElementById('openButtonLogo')
    if (openButtonLogo) {
      openButtonLogo.addEventListener('click', () => this.openFile())
    }
  }

  async start () {
    try {
      this.visualizerStarted = true
      this.uiManager.hideStartButton()
      this.uiManager.hideLogoContainer()
      this.uiManager.showPanelToggleButton()
      this.uiManager.showOpenButton()
      this.uiManager.showSaveButton()
      this.uiManager.showInfoButton()
      this.showProjectNameDisplay()
      this.uiManager.showCanvasMessage()

      this.uiManager.showStatus('Starting visualizer...', 'success')
      this.isRunning = true
      this.animate()

      // Initialize side panel after MIDI setup
      this.sidePanel.renderTracks()

      // Populate MIDI output device list
      await this.populateMidiOutputDevices()
    } catch (error) {
      console.error('Failed to start visualizer:', error)
      this.uiManager.showStatus('Failed to start. Check console for details.', 'error')
      this.uiManager.showStartButton()
    }
  }

  async connectTablet () {
    try {
      this.uiManager.showStatus('Connecting to tablet...', 'info')
      const success = await this.tabletManager.connectUgeeQ6()

      if (success) {
        this.uiManager.showStatus('Tablet connected successfully!', 'success')
      } else {
        this.uiManager.showStatus('No tablet found or connection failed.', 'error')
      }
    } catch (error) {
      console.error('Tablet connection error:', error)
      this.uiManager.showStatus('Tablet connection failed.', 'error')
    }
  }

  clearTablet () {
    this.tabletManager.clear()
    this.uiManager.showStatus('Tablet drawing cleared.', 'info')
  }

  clearCanvas () {
    this.tabletManager.clear()
    this.uiManager.showStatus('Canvas cleared.', 'info')
  }

  setTabletWidth (width) {
    this.tabletManager.setLineWidth(width)
  }

  handleResize () {
    this.canvasDrawer.resize()
    this.resizeFluidBackgroundCanvas()
    this.resizeTabletCanvas()
    if (this.fluidBackgroundManager) {
      this.fluidBackgroundManager.resize()
    }
  }

  toggleSidePanel () {
    this.sidePanel.toggle()
    this.uiManager.setPanelToggleActive(this.sidePanel.isPanelVisible())
  }

  async openFile () {
    if (this.projectManager.updateUnsavedChangesFlag()) {
      const shouldProceed = await this.promptUnsavedChanges()
      if (!shouldProceed) {
        return
      }
    }

    this.filePickerDialog.show()
  }

  async saveFile () {
    try {
      if (this.projectManager.hasOpenFile()) {
        const result = await this.projectManager.saveExistingProject()
        if (result.success) {
          this.projectManager.savedState = this.projectManager.getCurrentState()
          this.projectManager.hasUnsavedChanges = false
          this.updateProjectName(this.projectManager.getCurrentProjectName())
          this.updateUnsavedChangesIndicator()
          this.uiManager.showStatus('Project saved successfully!', 'success')
        } else if (result.cancelled) {
        }
      } else {
        const timestamp = Math.floor(Date.now() / 1000)
        const defaultName = `glow-scene-${timestamp}`
        this.saveDialog.setDefaultName(defaultName)
        this.saveDialog.show()
      }
    } catch (error) {
      console.error('Error saving project:', error)
      this.uiManager.showStatus('Error saving project. Check console for details.', 'error')
    }
  }

  async handleProjectSave (data) {
    const { projectName } = data

    try {
      const result = await this.projectManager.saveNewProject(projectName)
      if (result.success) {
        this.projectManager.savedState = this.projectManager.getCurrentState()
        this.projectManager.hasUnsavedChanges = false
        this.updateProjectName(result.projectName)
        this.updateUnsavedChangesIndicator()
        this.uiManager.showStatus(`Project "${result.projectName}" saved successfully!`, 'success')
      } else if (result.cancelled) {
      }
    } catch (error) {
      console.error('Error saving project:', error)
      this.uiManager.showStatus('Error saving project. Check console for details.', 'error')
    }
  }

  async handleProjectLoad (data) {
    if (this.projectManager.updateUnsavedChangesFlag()) {
      const shouldProceed = await this.promptUnsavedChanges()
      if (!shouldProceed) {
        return
      }
    }

    try {
      this.uiManager.showStatus('Loading project...', 'info')

      this.clearCurrentState()

      if (!data.fileHandle || !data.projectData) {
        this.uiManager.showStatus('Error loading project: missing file data.', 'error')
        return
      }

      const result = await this.projectManager.openProjectWithData(data.fileHandle, data.projectData, data.file)

      if (result.success) {
        const projectName = this.projectManager.getCurrentProjectName()
        this.updateProjectName(projectName)
        this.updateUnsavedChangesIndicator()

        this.uiManager.hideLogoContainer()
        this.uiManager.showPanelToggleButton()
        this.uiManager.showOpenButton()
        this.uiManager.showSaveButton()
        this.uiManager.showInfoButton()
        this.showProjectNameDisplay()
        this.uiManager.showCanvasMessage()
        this.visualizerStarted = true
        this.isRunning = true
        this.uiManager.showStatus(`Project "${projectName}" loaded successfully!`, 'success')
      } else {
        this.uiManager.showStatus('Error loading project. Check console for details.', 'error')
      }
    } catch (error) {
      console.error('Error loading project:', error)
      this.uiManager.showStatus('Error loading project. Check console for details.', 'error')
    }
  }

  async promptUnsavedChanges () {
    return new Promise((resolve) => {
      const message = 'You have unsaved changes. Do you want to save them before continuing?'
      const shouldSave = confirm(message + '\n\nClick OK to save, Cancel to discard changes.')

      if (shouldSave) {
        this.saveFile().then(() => {
          resolve(true)
        }).catch(() => {
          const proceed = confirm('Save was cancelled. Do you want to discard changes and continue?')
          resolve(proceed)
        })
      } else {
        resolve(true)
      }
    })
  }

  markProjectChanged () {
    if (this._changeCheckTimeout) {
      clearTimeout(this._changeCheckTimeout)
    }

    this._changeCheckTimeout = setTimeout(() => {
      this.updateUnsavedChangesIndicator()
    }, 300)
  }

  updateUnsavedChangesIndicator () {
    const projectNameText = document.getElementById('projectNameText')
    if (!projectNameText) return

    const hasUnsaved = this.projectManager.updateUnsavedChangesFlag()
    const currentName = this.projectManager.getCurrentProjectName()

    if (hasUnsaved) {
      if (!projectNameText.textContent.endsWith(' *')) {
        projectNameText.textContent = currentName + ' *'
      }
    } else {
      if (projectNameText.textContent.endsWith(' *')) {
        projectNameText.textContent = currentName
      }
    }
  }

  setGeometricMode (enabled) {
    this.tabletManager.setGeometricMode(enabled)
  }

  setShapeDetectionThreshold (threshold) {
    this.tabletManager.setShapeDetectionThreshold(threshold)
  }

  setGeometricPencilMode (enabled) {
    this.tabletManager.setGeometricPencilMode(enabled)
  }

  setPolygonSides (sides) {
    this.tabletManager.setPolygonSides(sides)
  }

  setPolygonSize (size) {
    this.tabletManager.setPolygonSize(size)
  }

  setFadeDuration (duration) {
    this.tabletManager.setFadeDuration(duration * 1000)
  }

  setMidiOutputEnabled (enabled) {
    this.midiManager.setOutputEnabled(enabled)
  }

  setMidiOutputDevice (deviceId) {
    this.midiManager.setOutputDevice(deviceId)
    this.midiManager.initializeOutput()
  }

  setOctaveRange (range) {
    this.midiManager.setOctaveRange(range)
  }

  // Track-based luminode management
  createLuminodeForTrack (trackId, luminodeType) {
    const LuminodeClass = this.luminodeFactory[luminodeType]
    if (!LuminodeClass) {
      console.warn(`Unknown luminode type: ${luminodeType}`)
      return null
    }

    const luminode = new LuminodeClass(this.canvasDrawer)
    this.trackLuminodes.set(trackId, luminode)
    return luminode
  }

  removeLuminodeFromTrack (trackId) {
    this.trackLuminodes.delete(trackId)
  }

  getLuminodeForTrack (trackId) {
    return this.trackLuminodes.get(trackId)
  }

  updateTrackLuminode (trackId, luminodeType) {
    // Remove old luminode if it exists
    this.removeLuminodeFromTrack(trackId)

    // Create new luminode if type is specified
    if (luminodeType) {
      return this.createLuminodeForTrack(trackId, luminodeType)
    }

    return null
  }

  handleLuminodeChange (data) {
    const { trackId, luminode } = data
    this.updateTrackLuminode(trackId, luminode)
  }

  async populateMidiOutputDevices () {
    // Get available MIDI devices from the MIDI manager
    const devices = await this.midiManager.getAvailableOutputDevices()
    this.sidePanel.updateMidiOutputDevices(devices)
  }

  updateCanvasSetting (data) {
    const { setting, value } = data

    if (SETTINGS.CANVAS && SETTINGS.CANVAS.hasOwnProperty(setting)) {
      SETTINGS.CANVAS[setting] = value
      console.log(`Updated canvas setting ${setting} to ${value}`)

      // Mark as changed
      this.markProjectChanged()

      // Apply the setting immediately
      if (setting === 'CLEAR_ALPHA') {
        this.canvasDrawer.setClearAlpha(value)
      } else if (setting === 'BACKGROUND_COLOR') {
        this.canvasDrawer.setBackgroundColor(value)
      } else if (setting === 'CRT_MODE') {
        this.toggleCRTMode(value)
      } else if (setting === 'CRT_INTENSITY') {
        this.setCRTIntensity(value)
      } else if (setting === 'LUMIA_EFFECT') {
        this.updateLumiaEffect(value)
      } else if (setting === 'NOISE_OVERLAY') {
        this.toggleNoiseOverlay(value)
      } else if (setting === 'NOISE_ANIMATE') {
        this.updateNoiseOptions({ animate: value })
      } else if (setting === 'NOISE_PATTERN_WIDTH') {
        this.updateNoiseOptions({ patternWidth: value })
      } else if (setting === 'NOISE_PATTERN_HEIGHT') {
        this.updateNoiseOptions({ patternHeight: value })
      } else if (setting === 'NOISE_OPACITY') {
        this.updateNoiseOptions({ grainOpacity: value })
      } else if (setting === 'NOISE_DENSITY') {
        this.updateNoiseOptions({ grainDensity: value })
      } else if (setting === 'NOISE_WIDTH') {
        this.updateNoiseOptions({ grainWidth: value })
      } else if (setting === 'NOISE_HEIGHT') {
        this.updateNoiseOptions({ grainHeight: value })
      } else if (setting === 'DITHER_OVERLAY') {
        this.toggleDitherOverlay(value)
      } else if (setting === 'DITHER_SATURATE') {
        this.updateDitherSaturate(value)
      } else if (setting === 'DITHER_TABLE_VALUES_R') {
        this.updateDitherTableValues('R', value)
      } else if (setting === 'DITHER_TABLE_VALUES_G') {
        this.updateDitherTableValues('G', value)
      } else if (setting === 'DITHER_TABLE_VALUES_B') {
        this.updateDitherTableValues('B', value)
      } else if (setting === 'CHROMATIC_ABERRATION_ENABLED') {
        this.toggleChromaticAberrationOverlay(value)
      } else if (setting === 'CHROMATIC_ABERRATION_CONTRAST') {
        this.updateChromaticAberrationContrast(value)
      } else if (setting === 'INVERT_FILTER') {
        this.updateInvertFilter(value)
      } else if (setting === 'SHADER_BACKGROUND_ENABLED') {
        this.updateFluidBackgroundEnabled(value)
      } else if (setting === 'SHADER_BACKGROUND_MODE') {
        this.updateFluidBackgroundMode(value)
      } else if (setting === 'SHADER_BACKGROUND_TRAIL_LENGTH') {
        this.updateFluidBackgroundTrailLength(value)
      } else if (setting === 'SHADER_BACKGROUND_COLOR_FLUID_BACKGROUND') {
        this.updateFluidBackgroundColorFluidBackground(value)
      } else if (setting === 'SHADER_BACKGROUND_COLOR_FLUID_TRAIL') {
        this.updateFluidBackgroundColorFluidTrail(value)
      } else if (setting === 'SHADER_BACKGROUND_COLOR_PRESSURE') {
        this.updateFluidBackgroundColorPressure(value)
      } else if (setting === 'SHADER_BACKGROUND_COLOR_VELOCITY') {
        this.updateFluidBackgroundColorVelocity(value)
      } else if (setting === 'SHADER_BACKGROUND_CURSOR_MODE') {
        this.updateFluidBackgroundCursorMode(value)
      }
    }
  }

  updateColorPalette (data) {
    const { palette, index, color } = data

    if (SETTINGS.COLORS && SETTINGS.COLORS[palette.toUpperCase() + '_PALETTE']) {
      const paletteKey = palette.toUpperCase() + '_PALETTE'
      SETTINGS.COLORS[paletteKey][index] = color
      console.log(`Updated ${palette} palette color at index ${index} to ${color}`)

      // Mark as changed
      this.markProjectChanged()
    }
  }

  updatePitchColorFactor (data) {
    const { value } = data

    // Update the pitchToColor function in UTILS
    if (UTILS.pitchToColor) {
      // Store the factor for the pitchToColor function
      UTILS.pitchColorFactor = value
      console.log(`Updated pitch color factor to ${value}`)

      // Mark as changed
      this.markProjectChanged()
    }
  }

  updateLumiaEffect (blurStrength) {
    if (this.canvas) {
      this.applyCanvasFilters()
      console.log(`Updated Lumia Effect blur to ${blurStrength}px`)
    }
  }

  // Apply all canvas filters (blur and invert) together
  applyCanvasFilters () {
    if (!this.canvas) return

    const filters = []
    const lumiaBlur = SETTINGS.CANVAS.LUMIA_EFFECT || 0
    const invertValue = SETTINGS.CANVAS.INVERT_FILTER || 0

    if (lumiaBlur > 0) {
      filters.push(`blur(${lumiaBlur}px)`)
    }

    if (invertValue > 0) {
      filters.push(`invert(${invertValue / 100})`)
    }

    if (filters.length > 0) {
      this.canvas.style.filter = filters.join(' ')
    } else {
      this.canvas.style.filter = 'none'
    }
  }

  updateLuminodeConfig (data) {
    const { luminode, param, value } = data

    const settingsKey = getLuminodeSettingsKey(luminode)
    if (settingsKey && SETTINGS.MODULES[settingsKey]) {
      const moduleConfig = SETTINGS.MODULES[settingsKey]
      if (moduleConfig.hasOwnProperty(param)) {
        // Ensure boolean values are properly converted for checkboxes
        let convertedValue = value
        if (typeof moduleConfig[param] === 'boolean') {
          convertedValue = Boolean(value)
        }
        moduleConfig[param] = convertedValue
        console.log(`Updated ${luminode} ${param} to ${convertedValue} (type: ${typeof convertedValue})`)

        // Mark as changed
        this.markProjectChanged()
      }
    }
  }


  loadCCMapping (mappingConfig) {
    if (this.ccMapper) {
      this.ccMapper.loadMapping(mappingConfig)
    } else {
      console.warn('Hardware mode is not enabled. Set SETTINGS.HARDWARE_MODE.ENABLED = true')
    }
  }

  showDebugMessage (message) {
    if (!this.debugOverlay || !this.debugVisible) return

    if (this.debugTimeout) {
      clearTimeout(this.debugTimeout)
    }

    this.debugOverlay.textContent = message
    this.debugOverlay.style.display = 'block'

    this.debugTimeout = setTimeout(() => {
      if (this.debugOverlay) {
        this.debugOverlay.style.display = 'none'
      }
    }, 3000)
  }

  toggleDebugOverlay () {
    this.debugVisible = !this.debugVisible
    if (this.debugOverlay) {
      if (this.debugVisible) {
        this.debugOverlay.style.display = 'block'
      } else {
        this.debugOverlay.style.display = 'none'
        if (this.debugTimeout) {
          clearTimeout(this.debugTimeout)
          this.debugTimeout = null
        }
      }
    }
  }

  /**
   * Enable hardware mode and load Arturia KeyLab mapping (for testing)
   */
  async enableHardwareMode () {
    // Enable hardware mode in settings
    SETTINGS.HARDWARE_MODE.ENABLED = true

    // Create CC mapper if it doesn't exist
    if (!this.ccMapper) {
      this.ccMapper = new MIDICCMapper(this.trackManager, this)
      this.midiManager.setCCMapper(this.ccMapper)
    }

    // Load Arturia KeyLab Essential 49 mk3 mapping
    try {
      const response = await fetch('midi-mappings/arturia-keylab-essential-49-mk3.json')
      if (!response.ok) {
        throw new Error(`Failed to load mapping: ${response.statusText}`)
      }
      const mapping = await response.json()
      this.loadCCMapping(mapping)
      console.log('Hardware mode enabled with Arturia KeyLab Essential 49 mk3 mapping')
      this.uiManager.showStatus('Hardware mode enabled (Arturia KeyLab)', 'success')
    } catch (error) {
      console.error('Failed to load Arturia mapping:', error)
      this.uiManager.showStatus('Failed to load hardware mapping', 'error')
    }
  }

  animate () {
    if (!this.isRunning) return

    const time = performance.now()
    const t = time / 1000

    // Clean up old notes
    this.midiManager.cleanupOldNotes()

    if (SETTINGS.CANVAS.SHADER_BACKGROUND_ENABLED && this.fluidBackgroundManager) {
      this.fluidBackgroundManager.update()
    }
    
    this.canvasDrawer.clear()
    
    if (this.fluidBackgroundCanvas) {
      this.fluidBackgroundCanvas.style.display = SETTINGS.CANVAS.SHADER_BACKGROUND_ENABLED ? 'block' : 'none'
    }

    // Draw grid background (if enabled)
    this.canvasDrawer.drawGrid()

    // Get all active notes based on track assignments
    const activeNotes = this.midiManager.getActiveNotesForTracks()

    // Draw all luminodes
    this.drawLuminodes(t, activeNotes)

    // Update dither overlay if enabled
    if (this.ditherModeEnabled && this.ditherCanvas && this.ditherCtx) {
      this.updateDitherOverlay()
    }

    // Update chromatic aberration overlay if enabled
    if (this.chromaticAberrationModeEnabled && this.chromaticAberrationCanvas && this.chromaticAberrationCtx) {
      this.updateChromaticAberrationOverlay()
    }

    // Update side panel activity indicators
    this.sidePanel.updateActivityIndicators(activeNotes)

    // Check for periodic tablet clearing
    this.tabletManager.checkAndClearStrokes(time)

    // Update geometric shapes fade-out
    this.tabletManager.updateGeometricShapes()

    this.animationId = requestAnimationFrame(() => this.animate())
  }

  getTrackLayouts () {
    const layouts = {}
    const tracks = this.trackManager.getTracks()
    const time = performance.now() / 1000

    tracks.forEach(track => {
      if (track.luminode) {
        const baseLayout = track.layout || { x: 0, y: 0, rotation: 0 }

        // Apply trajectory motion to the layout
        const trajectoryPosition = this.trackManager.getTrajectoryPosition(track.id, time, {
          x: baseLayout.x,
          y: baseLayout.y,
          z: 0
        })

        // Use track ID as key to support multiple instances of same luminode type
        layouts[track.id] = {
          x: trajectoryPosition.x,
          y: trajectoryPosition.y,
          rotation: baseLayout.rotation
        }
      }
    })

    return layouts
  }

  drawLuminodes (t, activeNotes) {
    // Check if any drawing is active
    const hasActiveNotes = Object.values(activeNotes).some(notes => notes.length > 0)
    const hasTabletStrokes = this.tabletManager.strokes.length > 0
    const isDrawingActive = hasActiveNotes || hasTabletStrokes

    // Hide canvas message when first drawing appears
    if (isDrawingActive) {
      this.uiManager.hideCanvasMessage()
    }

    // Update settings button and logo visibility based on drawing activity
    if (isDrawingActive) {
      this.uiManager.hideLogoContainer()
    } else if (!this.visualizerStarted) {
      this.uiManager.showLogoContainer()
    } else {
      this.uiManager.hideLogoContainer()
    }

    // Get active tracks and their layouts
    const activeTracks = this.trackManager.getActiveTracks()
    const trackLayouts = this.getTrackLayouts()

    // Draw luminodes only for active tracks that have luminodes assigned
    activeTracks.forEach(track => {
      if (!track.luminode || !track.midiDevice) return

      // Get or create luminode instance for this track
      let luminode = this.getLuminodeForTrack(track.id)
      if (!luminode) {
        luminode = this.createLuminodeForTrack(track.id, track.luminode)
      }

      if (!luminode) return

      const notes = activeNotes[track.luminode] || []
      const layout = trackLayouts[track.id] || { x: 0, y: 0, rotation: 0 }

      const restoreValues = this.applyModulationToTrack(track.id, track.luminode, notes)

      this.drawTrackLuminode(luminode, track.luminode, t, notes, layout)

      // Track last luminode position for fluid background
      if (SETTINGS.CANVAS.SHADER_BACKGROUND_ENABLED && this.fluidBackgroundManager && this.fluidBackgroundManager.lastPointMode) {
        const centerX = this.canvas.width / 2 + layout.x
        const centerY = this.canvas.height / 2 + layout.y
        this.fluidBackgroundManager.updateLastLuminodePosition(centerX, centerY)
      }

      if (restoreValues) {
        restoreValues()
      }
    })
  }

  applyModulationToTrack (trackId, luminodeType, notes = []) {
    const modulationSystem = this.trackManager.getModulationSystem()
    const modulators = modulationSystem.getModulators().filter(m =>
      m.enabled &&
      m.targetTrack === trackId &&
      m.targetLuminode === luminodeType &&
      m.targetConfigKey !== null
    )

    if (modulators.length === 0) {
      return null
    }

    // Get luminode config definition for min/max ranges
    const configParams = getLuminodeConfig(luminodeType)
    const configParamMap = new Map(configParams.map(p => [p.key, p]))

    const settingsKey = getLuminodeSettingsKey(luminodeType)
    if (!settingsKey || !SETTINGS.MODULES[settingsKey]) {
      return null
    }

    const moduleConfig = SETTINGS.MODULES[settingsKey]
    const originalValues = new Map()

    const noteData = {
      notes: notes || [],
      velocity: notes && notes.length > 0
        ? notes.reduce((sum, note) => sum + (note.velocity || 0), 0) / notes.length
        : 0
    }

    const modulatorsByKey = new Map()
    modulators.forEach(modulator => {
      const configKey = modulator.targetConfigKey
      if (!modulatorsByKey.has(configKey)) {
        modulatorsByKey.set(configKey, [])
      }
      modulatorsByKey.get(configKey).push(modulator)
    })

    modulatorsByKey.forEach((mods, configKey) => {
      const configParam = configParamMap.get(configKey)

      if (!configParam || !moduleConfig.hasOwnProperty(configKey)) {
        return
      }

      if (!originalValues.has(configKey)) {
        originalValues.set(configKey, moduleConfig[configKey])
      }

      const baseValue = originalValues.get(configKey)
      let modulatedValue = baseValue

      const lfoModulators = mods.filter(m => (m.type || 'lfo') === 'lfo')
      const noteModulators = mods.filter(m => (m.type || 'lfo') !== 'lfo')

      if (lfoModulators.length > 0) {
        let totalModulation = 0
        let totalOffset = 0
        const time = modulationSystem.getCurrentTime()

        lfoModulators.forEach(modulator => {
          if (!modulator.enabled) return

          const phase = time * modulator.rate * Math.PI * 2
          const waveform = modulationSystem.generateWaveform(modulator.shape, phase, modulator.cubicBezier)

          totalModulation += waveform * modulator.depth
          totalOffset += modulator.offset || 0
        })

        const min = configParam.min
        const max = configParam.max
        const range = max - min

        modulatedValue = baseValue + (totalModulation * range) + (totalOffset * range)
        modulatedValue = Math.max(min, Math.min(max, modulatedValue))
      }

      noteModulators.forEach(modulator => {
        if (!modulator.enabled) return
        modulatedValue = modulationSystem.getModulatedValue(modulatedValue, modulator, configParam, noteData)
      })

      const finalValue = configParam.type === 'number' ? Math.round(modulatedValue) : modulatedValue

      moduleConfig[configKey] = finalValue
    })

    return () => {
      originalValues.forEach((value, key) => {
        moduleConfig[key] = value
      })
    }
  }

  drawTrackLuminode (luminode, luminodeType, t, notes, layout) {
    switch (luminodeType) {
      case 'sotoGrid':
        luminode.draw(t, notes, false, layout)
        break
      case 'sotoGridRotated':
        luminode.draw(t, notes, true, layout)
        break
      case 'lissajous':
        luminode.draw(t, notes.map(n => n.midi), layout)
        break
      case 'phyllotaxis':
        luminode.draw(t, notes, SETTINGS.MODULES.PHYLLOTAXIS.DOTS_PER_NOTE, layout)
        break
      case 'triangle':
        luminode.draw(t, notes, 'triangle', 1, 300, layout)
        break
      default: {
        const settingsKey = getLuminodeSettingsKey(luminodeType)
        const moduleSettings = settingsKey ? SETTINGS.MODULES[settingsKey] : null
        
        if (moduleSettings?.hasOwnProperty('USE_COLOR')) {
          luminode.draw(t, notes, moduleSettings.USE_COLOR || false, layout)
        } else {
          luminode.draw(t, notes, layout)
        }
        break
      }
    }
  }

  stop () {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }

  // Create CRT overlay element
  createCRTOverlay () {
    this.crtOverlay = document.createElement('div')
    this.crtOverlay.className = 'crt-overlay'
    this.crtOverlay.style.display = 'none'
    document.body.appendChild(this.crtOverlay)
  }

  // Toggle CRT mode
  toggleCRTMode (enabled) {
    this.crtModeEnabled = enabled

    if (this.crtOverlay) {
      if (enabled) {
        this.crtOverlay.style.display = 'block'
        this.crtOverlay.classList.add('active')
        this.updateCRTIntensity()
      } else {
        this.crtOverlay.style.display = 'none'
        this.crtOverlay.classList.remove('active')
      }
    }

    console.log(`CRT mode ${enabled ? 'enabled' : 'disabled'}`)
  }

  // Set CRT intensity
  setCRTIntensity (intensity) {
    this.crtIntensity = intensity

    if (this.crtOverlay && this.crtModeEnabled) {
      this.updateCRTIntensity()
    }

    console.log(`CRT intensity set to ${intensity}%`)
  }

  // Update CRT overlay with current intensity
  updateCRTIntensity () {
    if (!this.crtOverlay) return

    // Convert 80-200 range to 0-1 range, with 100 as baseline
    const normalizedIntensity = (this.crtIntensity - 80) / 120 // 0-1 range
    const intensity = Math.max(0.1, normalizedIntensity) // Minimum 0.1 for visibility

    // Update CSS custom properties for dynamic intensity
    this.crtOverlay.style.setProperty('--crt-opacity', intensity * 1.2) // Base opacity (increased)
    this.crtOverlay.style.setProperty('--scanline-opacity', intensity * 0.9) // Scanline opacity (increased)
    this.crtOverlay.style.setProperty('--color-separation-opacity', intensity * 0.7) // Color separation opacity (increased)
    this.crtOverlay.style.setProperty('--flicker-intensity', intensity) // Flicker intensity
  }

  // Create noise overlay element
  createNoiseOverlay () {
    this.noiseOverlay = document.getElementById('noiseOverlay')
    if (!this.noiseOverlay) {
      console.error('Noise overlay element not found')
      return
    }

    // Initialize grained.js on the noise overlay
    this.initializeGrained()
  }

  // Initialize grained.js with current options
  initializeGrained () {
    if (!this.noiseOverlay || typeof grained === 'undefined') {
      console.error('Noise overlay element or grained.js not available')
      return
    }

    // Destroy existing grained instance if it exists
    if (this.grainedInstance) {
      this.grainedInstance = null
    }

    // Only initialize if noise overlay is enabled
    if (this.noiseModeEnabled) {
      this.grainedInstance = grained('#noiseOverlay', this.noiseOptions)
    }
  }

  // Toggle noise overlay mode
  toggleNoiseOverlay (enabled) {
    this.noiseModeEnabled = enabled

    if (this.noiseOverlay) {
      if (enabled) {
        this.noiseOverlay.style.display = 'block'
        this.initializeGrained()
      } else {
        this.noiseOverlay.style.display = 'none'
        if (this.grainedInstance) {
          this.grainedInstance = null
        }
      }
    }

    console.log(`Noise overlay ${enabled ? 'enabled' : 'disabled'}`)
  }

  // Update noise overlay options
  updateNoiseOptions (options) {
    this.noiseOptions = { ...this.noiseOptions, ...options }

    // If noise overlay is enabled, always reinitialize to apply changes
    if (this.noiseModeEnabled) {
      this.initializeGrained()
    }

    console.log('Noise overlay options updated:', this.noiseOptions)
  }

  // Create dither overlay element
  createDitherOverlay () {
    this.ditherOverlay = document.getElementById('ditherOverlay')
    if (!this.ditherOverlay) {
      console.error('Dither overlay element not found')
      return
    }

    // Create a canvas inside the overlay to copy the main canvas content
    this.ditherCanvas = document.createElement('canvas')
    this.ditherCanvas.width = window.innerWidth
    this.ditherCanvas.height = window.innerHeight
    this.ditherCanvas.style.width = '100%'
    this.ditherCanvas.style.height = '100%'
    this.ditherCanvas.style.display = 'block'
    this.ditherOverlay.appendChild(this.ditherCanvas)
    this.ditherCtx = this.ditherCanvas.getContext('2d')

    // Set up dither image size based on device pixel ratio
    this.updateDitherImageSize()
    window.addEventListener('resize', () => {
      this.updateDitherImageSize()
      if (this.ditherCanvas) {
        this.ditherCanvas.width = window.innerWidth
        this.ditherCanvas.height = window.innerHeight
      }
    })
  }

  // Update dither image size based on device pixel ratio
  updateDitherImageSize () {
    const ditherImages = document.querySelectorAll('.ditherImage')
    if (!ditherImages.length) return

    const size = 8 / window.devicePixelRatio
    Array.from(ditherImages).forEach(img => {
      img.setAttribute('width', size)
      img.setAttribute('height', size)
    })
  }

  // Toggle dither overlay mode
  toggleDitherOverlay (enabled) {
    this.ditherModeEnabled = enabled

    if (this.ditherOverlay) {
      if (enabled) {
        this.ditherOverlay.style.display = 'block'
      } else {
        this.ditherOverlay.style.display = 'none'
      }
    }

    console.log(`Dither overlay ${enabled ? 'enabled' : 'disabled'}`)
  }

  // Update dither overlay by copying canvas content
  updateDitherOverlay () {
    if (!this.ditherCanvas || !this.ditherCtx || !this.canvas) return

    // Clear the dither canvas
    this.ditherCtx.clearRect(0, 0, this.ditherCanvas.width, this.ditherCanvas.height)

    // Check if lumia effect (blur) is enabled
    const lumiaBlur = SETTINGS.CANVAS.LUMIA_EFFECT || 0

    if (lumiaBlur > 0) {
      // Apply blur to the dither canvas context before drawing
      // This will blur the content, then the SVG dither filter will be applied on top
      this.ditherCtx.filter = `blur(${lumiaBlur}px)`
    } else {
      this.ditherCtx.filter = 'none'
    }

    // Copy the main canvas to the dither canvas
    // If blur is enabled, the content will be blurred before dithering
    this.ditherCtx.drawImage(this.canvas, 0, 0, this.ditherCanvas.width, this.ditherCanvas.height)

    // Reset filter for next frame
    this.ditherCtx.filter = 'none'
  }

  // Update dither saturation value
  updateDitherSaturate (value) {
    const filter = document.getElementById('ditherFilter')
    if (!filter) return

    const colorMatrix = filter.querySelector('feColorMatrix[type="saturate"]')
    if (colorMatrix) {
      colorMatrix.setAttribute('values', value)
      console.log(`Dither saturation updated to ${value}`)
    }
  }

  // Update dither table values for a specific RGB channel
  updateDitherTableValues (channel, tableValues) {
    const filter = document.getElementById('ditherFilter')
    if (!filter) return

    // Parse table values (e.g., "0 1" or "1 0")
    const values = tableValues.split(' ').map(v => v.trim()).filter(v => v)
    if (values.length === 0) return

    const tableValueString = values.join(' ')
    const componentTransfer = filter.querySelector('feComponentTransfer')
    if (!componentTransfer) return

    // Update the specific channel
    let funcElement = null
    if (channel === 'R') {
      funcElement = componentTransfer.querySelector('feFuncR')
    } else if (channel === 'G') {
      funcElement = componentTransfer.querySelector('feFuncG')
    } else if (channel === 'B') {
      funcElement = componentTransfer.querySelector('feFuncB')
    }

    if (funcElement) {
      funcElement.setAttribute('tableValues', tableValueString)
      console.log(`Dither ${channel} channel table values updated to ${tableValueString}`)
    }
  }

  // Create chromatic aberration overlay element
  createChromaticAberrationOverlay () {
    this.chromaticAberrationOverlay = document.getElementById('chromaticAberrationOverlay')
    if (!this.chromaticAberrationOverlay) {
      console.error('Chromatic aberration overlay element not found')
      return
    }

    // Create a canvas inside the overlay to copy the main canvas content
    this.chromaticAberrationCanvas = document.createElement('canvas')
    this.chromaticAberrationCanvas.width = window.innerWidth
    this.chromaticAberrationCanvas.height = window.innerHeight
    this.chromaticAberrationCanvas.style.width = '100%'
    this.chromaticAberrationCanvas.style.height = '100%'
    this.chromaticAberrationCanvas.style.display = 'block'
    this.chromaticAberrationOverlay.appendChild(this.chromaticAberrationCanvas)
    this.chromaticAberrationCtx = this.chromaticAberrationCanvas.getContext('2d')

    // Set initial contrast value
    const initialContrast = SETTINGS.CANVAS.CHROMATIC_ABERRATION_CONTRAST || 1
    this.updateChromaticAberrationContrast(initialContrast)

    window.addEventListener('resize', () => {
      if (this.chromaticAberrationCanvas) {
        this.chromaticAberrationCanvas.width = window.innerWidth
        this.chromaticAberrationCanvas.height = window.innerHeight
      }
    })
  }

  // Toggle chromatic aberration overlay mode
  toggleChromaticAberrationOverlay (enabled) {
    this.chromaticAberrationModeEnabled = enabled

    if (this.chromaticAberrationOverlay) {
      if (enabled) {
        this.chromaticAberrationOverlay.style.display = 'block'
      } else {
        this.chromaticAberrationOverlay.style.display = 'none'
      }
    }

    console.log(`Chromatic aberration overlay ${enabled ? 'enabled' : 'disabled'}`)
  }

  // Update chromatic aberration overlay by copying canvas content
  updateChromaticAberrationOverlay () {
    if (!this.chromaticAberrationCanvas || !this.chromaticAberrationCtx || !this.canvas) return

    // Clear the chromatic aberration canvas
    this.chromaticAberrationCtx.clearRect(0, 0, this.chromaticAberrationCanvas.width, this.chromaticAberrationCanvas.height)

    // Copy the main canvas to the chromatic aberration canvas
    this.chromaticAberrationCtx.drawImage(this.canvas, 0, 0, this.chromaticAberrationCanvas.width, this.chromaticAberrationCanvas.height)
  }

  // Update chromatic aberration contrast value
  updateChromaticAberrationContrast (value) {
    const contrast = Math.max(1, Math.min(10, value))
    SETTINGS.CANVAS.CHROMATIC_ABERRATION_CONTRAST = contrast
    if (this.chromaticAberrationOverlay) {
      this.chromaticAberrationOverlay.style.filter = `url(#chromaticAberrationFilter) contrast(${contrast})`
      console.log(`Chromatic aberration contrast updated to ${contrast}`)
    }
  }

  // Update invert filter value
  updateInvertFilter (value) {
    const invertPercent = Math.max(0, Math.min(100, value))
    SETTINGS.CANVAS.INVERT_FILTER = invertPercent
    this.applyCanvasFilters()
    console.log(`Invert filter updated to ${invertPercent}%`)
  }

  updateFluidBackgroundSettings () {
    if (!this.fluidBackgroundManager) return

    const settings = SETTINGS.CANVAS
    this.fluidBackgroundManager.setEnabled(settings.SHADER_BACKGROUND_ENABLED || false)
    this.fluidBackgroundManager.setRenderMode(settings.SHADER_BACKGROUND_MODE || 'Fluid')
    this.fluidBackgroundManager.setTrailLength(settings.SHADER_BACKGROUND_TRAIL_LENGTH || 15)
    
    const colorFluid = settings.SHADER_BACKGROUND_COLOR_FLUID || { r: 0.02, g: 0.078, b: 0.157 }
    this.fluidBackgroundManager.setColorFluidBackground(colorFluid.r, colorFluid.g, colorFluid.b)
    
    const colorPressure = settings.SHADER_BACKGROUND_COLOR_PRESSURE || { r: 0.02, g: 0.078, b: 0.157 }
    this.fluidBackgroundManager.setColorPressure(colorPressure.r, colorPressure.g, colorPressure.b)
    
    const colorVelocity = settings.SHADER_BACKGROUND_COLOR_VELOCITY || { r: 0.259, g: 0.227, b: 0.184 }
    this.fluidBackgroundManager.setColorVelocity(colorVelocity.r, colorVelocity.g, colorVelocity.b)
    
    const cursorMode = settings.SHADER_BACKGROUND_CURSOR_MODE !== false
    if (cursorMode) {
      this.fluidBackgroundManager.setCursorMode(true)
    }
  }

  updateFluidBackgroundEnabled (enabled) {
    SETTINGS.CANVAS.SHADER_BACKGROUND_ENABLED = enabled
    if (this.fluidBackgroundManager) {
      this.fluidBackgroundManager.setEnabled(enabled)
    }
    console.log(`Shader background ${enabled ? 'enabled' : 'disabled'}`)
  }

  updateFluidBackgroundMode (mode) {
    SETTINGS.CANVAS.SHADER_BACKGROUND_MODE = mode
    if (this.fluidBackgroundManager) {
      this.fluidBackgroundManager.setRenderMode(mode)
    }
    console.log(`Shader background mode set to ${mode}`)
  }

  updateFluidBackgroundTrailLength (length) {
    SETTINGS.CANVAS.SHADER_BACKGROUND_TRAIL_LENGTH = length
    if (this.fluidBackgroundManager) {
      this.fluidBackgroundManager.setTrailLength(length)
    }
    console.log(`Shader background trail length set to ${length}`)
  }

  updateFluidBackgroundColorFluidBackground (color) {
    SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_FLUID_BACKGROUND = color
    if (this.fluidBackgroundManager && color) {
      this.fluidBackgroundManager.setColorFluidBackground(color.r, color.g, color.b)
    }
  }

  updateFluidBackgroundColorFluidTrail (color) {
    SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_FLUID_TRAIL = color
    if (this.fluidBackgroundManager && color) {
      this.fluidBackgroundManager.setColorFluidTrail(color.r, color.g, color.b)
    }
  }

  updateFluidBackgroundColorPressure (color) {
    SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_PRESSURE = color
    if (this.fluidBackgroundManager && color) {
      this.fluidBackgroundManager.setColorPressure(color.r, color.g, color.b)
    }
  }

  updateFluidBackgroundColorVelocity (color) {
    SETTINGS.CANVAS.SHADER_BACKGROUND_COLOR_VELOCITY = color
    if (this.fluidBackgroundManager && color) {
      this.fluidBackgroundManager.setColorVelocity(color.r, color.g, color.b)
    }
  }

  updateFluidBackgroundCursorMode (enabled) {
    SETTINGS.CANVAS.SHADER_BACKGROUND_CURSOR_MODE = enabled
    if (this.fluidBackgroundManager) {
      this.fluidBackgroundManager.setCursorMode(enabled)
    }
  }

  // Debug method to check MIDI devices
  debugMidiDevices () {
    console.log('=== MIDI Debug Info ===')
    console.log('Legacy system devices:', this.midiManager.getDeviceInfo())
    console.log('Track system devices:', this.midiManager.getAllMidiDevices())
    console.log('TrackManager devices:', this.trackManager.getAvailableMidiDevices())
    console.log('Current tracks:', this.trackManager.getTracks())
  }

  showProjectNameDisplay () {
    const projectNameDisplay = document.getElementById('projectNameDisplay')
    if (projectNameDisplay) {
      projectNameDisplay.style.display = 'block'
    }
  }

  hideProjectNameDisplay () {
    const projectNameDisplay = document.getElementById('projectNameDisplay')
    if (projectNameDisplay) {
      projectNameDisplay.style.display = 'none'
    }
  }

  updateProjectName (name) {
    const projectNameText = document.getElementById('projectNameText')
    if (projectNameText) {
      projectNameText.textContent = name || 'Untitled Project'
    }
  }

  clearCurrentState () {
    this.trackLuminodes.clear()
    this.canvasDrawer.clear()
    this.tabletManager.clear()

    const tracks = this.trackManager.getTracks()
    tracks.forEach(track => {
      track.midiDevice = null
      track.luminode = null
      track.muted = false
      track.solo = false
      track.layout = { x: 0, y: 0, rotation: 0 }
      this.trackManager.triggerCallback('trackUpdated', { trackId: track.id, track })
    })

    this.midiManager.setOutputDevice(null)
    this.projectManager.clearProject()

    console.log('Current state cleared before loading new project')
  }

  destroy () {
    this.stop()
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.glowVisualizer = new GLOWVisualizer()

  // Expose debug method globally
  window.debugMidi = () => window.glowVisualizer.debugMidiDevices()
})
