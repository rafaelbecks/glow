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
import { getLuminodeSettingsKey } from './components/luminode-config-manager.js'
import {
  LissajousLuminode,
  HarmonographLuminode,
  SphereLuminode,
  GegoNetLuminode,
  GegoShapeLuminode,
  SotoGridLuminode,
  WhitneyLinesLuminode,
  PhyllotaxisLuminode,
  MoireCirclesLuminode,
  WovenNetLuminode,
  SinewaveLuminode,
  TriangleLuminode,
  PolygonsLuminode,
  NoiseValleyLuminode,
  CatenoidLuminode,
  LineCylinderLuminode,
  ClaviluxLuminode,
  DiamondLuminode,
  CubeLuminode,
  TrefoilKnotLuminode,
  SphericalLensLuminode
} from './luminodes/index.js'

export class GLOWVisualizer {
  constructor () {
    this.canvas = document.getElementById('canvas')
    this.tabletCanvas = document.getElementById('tabletCanvas')
    this.canvasDrawer = new CanvasDrawer(this.canvas)
    this.trackManager = new TrackManager()
    this.midiManager = new MIDIManager(this.trackManager)
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

    // Initialize luminode factory
    this.luminodeFactory = {
      lissajous: LissajousLuminode,
      harmonograph: HarmonographLuminode,
      sphere: SphereLuminode,
      gegoNet: GegoNetLuminode,
      gegoShape: GegoShapeLuminode,
      sotoGrid: SotoGridLuminode,
      sotoGridRotated: SotoGridLuminode,
      whitneyLines: WhitneyLinesLuminode,
      phyllotaxis: PhyllotaxisLuminode,
      moireCircles: MoireCirclesLuminode,
      wovenNet: WovenNetLuminode,
      sinewave: SinewaveLuminode,
      triangle: TriangleLuminode,
      polygons: PolygonsLuminode,
      noiseValley: NoiseValleyLuminode,
      catenoid: CatenoidLuminode,
      lineCylinder: LineCylinderLuminode,
      clavilux: ClaviluxLuminode,
      diamond: DiamondLuminode,
      cube: CubeLuminode,
      trefoil: TrefoilKnotLuminode,
      sphericalLens: SphericalLensLuminode
    }

    // Track-based luminode instances
    this.trackLuminodes = new Map() // Maps trackId -> luminode instance

    this.isRunning = false
    this.animationId = null

    this.setupEventHandlers()
    this.setupSaveDialog()
    this.setupFilePickerDialog()
    this.setupLogoButtons()
    this.initialize().catch(error => console.error('Failed to initialize:', error))
  }

  async initialize () {
    // Initial canvas setup
    this.canvasDrawer.resize()
    this.resizeTabletCanvas()

    // Create CRT overlay
    this.createCRTOverlay()

    // Create noise overlay
    this.createNoiseOverlay()

    // Create dither overlay
    this.createDitherOverlay()

    this.uiManager.showStatus('Connecting to MIDI devices...', 'info')

    await this.midiManager.setupMIDI()
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
    this.resizeTabletCanvas()
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
      if (blurStrength > 0) {
        this.canvas.style.filter = `blur(${blurStrength}px)`
      } else {
        this.canvas.style.filter = 'none'
      }
      console.log(`Updated Lumia Effect blur to ${blurStrength}px`)
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

  animate () {
    if (!this.isRunning) return

    const time = performance.now()
    const t = time / 1000

    // Clean up old notes
    this.midiManager.cleanupOldNotes()

    // Clear canvas with fade effect
    this.canvasDrawer.clear()

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

      // Get notes for this track's luminode
      const notes = activeNotes[track.luminode] || []
      const layout = trackLayouts[track.id] || { x: 0, y: 0, rotation: 0 }

      // Apply modulation before drawing
      const restoreValues = this.applyModulationToTrack(track.id, track.luminode)

      // Draw the luminode with track-specific parameters
      this.drawTrackLuminode(luminode, track.luminode, t, notes, layout)

      // Restore original config values after drawing
      if (restoreValues) {
        restoreValues()
      }
    })
  }

  /**
   * Apply modulation to a track's luminode config values
   * Returns a restore function to call after drawing
   */
  applyModulationToTrack (trackId, luminodeType) {
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
    const restoreFunctions = []

    // Group modulators by config key to handle multiple modulators on same param
    const modulatorsByKey = new Map()
    modulators.forEach(modulator => {
      const configKey = modulator.targetConfigKey
      if (!modulatorsByKey.has(configKey)) {
        modulatorsByKey.set(configKey, [])
      }
      modulatorsByKey.get(configKey).push(modulator)
    })

    // Apply modulators to each config key
    modulatorsByKey.forEach((mods, configKey) => {
      const configParam = configParamMap.get(configKey)

      if (!configParam || !moduleConfig.hasOwnProperty(configKey)) {
        return
      }

      // Store original value
      if (!originalValues.has(configKey)) {
        originalValues.set(configKey, moduleConfig[configKey])
      }

      // Calculate modulation contributions independently and sum them
      const baseValue = originalValues.get(configKey)
      let totalModulation = 0
      let totalOffset = 0

      const time = modulationSystem.getCurrentTime()

      mods.forEach(modulator => {
        if (!modulator.enabled) return

        const phase = time * modulator.rate * Math.PI * 2
        const waveform = modulationSystem.generateWaveform(modulator.shape, phase)

        // Accumulate modulation and offset
        totalModulation += waveform * modulator.depth
        totalOffset += modulator.offset
      })

      // Calculate value range for this parameter
      const min = configParam.min
      const max = configParam.max
      const range = max - min

      // Apply combined modulation
      let modulatedValue = baseValue + (totalModulation * range) + (totalOffset * range)

      // Clamp to valid range
      modulatedValue = Math.max(min, Math.min(max, modulatedValue))

      // Round to integer if this is a number-type parameter (for parameters like SEGMENTS, RINGS, etc.)
      const finalValue = configParam.type === 'number' ? Math.round(modulatedValue) : modulatedValue

      // Apply final modulated value
      moduleConfig[configKey] = finalValue
    })

    // Return restore function
    return () => {
      originalValues.forEach((value, key) => {
        moduleConfig[key] = value
      })
    }
  }

  drawTrackLuminode (luminode, luminodeType, t, notes, layout) {
    // Handle special cases for different luminode types
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
      case 'whitneyLines':
        const whitneyColorMode = SETTINGS.MODULES.WHITNEY_LINES.USE_COLOR || false
        luminode.draw(t, notes, whitneyColorMode, layout)
        break
      case 'triangle':
        luminode.draw(t, notes, 'triangle', 1, 300, layout)
        break
      case 'noiseValley':
        const noiseValleyColorMode = SETTINGS.MODULES.NOISE_VALLEY.USE_COLOR || false
        luminode.draw(t, notes, noiseValleyColorMode, layout)
        break
      case 'catenoid':
        const catenoidColorMode = SETTINGS.MODULES.CATENOID.USE_COLOR || false
        luminode.draw(t, notes, catenoidColorMode, layout)
        break
      case 'lineCylinder':
        const lineCylinderColorMode = SETTINGS.MODULES.LINE_CYLINDER.USE_COLOR || false
        luminode.draw(t, notes, lineCylinderColorMode, layout)
        break
      case 'diamond':
        const diamondColorMode = SETTINGS.MODULES.DIAMOND.USE_COLOR || false
        luminode.draw(t, notes, diamondColorMode, layout)
        break
      case 'cube':
        const cubeColorMode = SETTINGS.MODULES.CUBE.USE_COLOR || false
        luminode.draw(t, notes, cubeColorMode, layout)
        break
      case 'sphere':
        const sphereColorMode = SETTINGS.MODULES.SPHERE.USE_COLOR || false
        luminode.draw(t, notes, sphereColorMode, layout)
        break
      case 'trefoil':
        const trefoilColorMode = SETTINGS.MODULES.TREFOIL.USE_COLOR || false
        luminode.draw(t, notes, trefoilColorMode, layout)
        break
      case 'sphericalLens':
        const sphericalLensColorMode = SETTINGS.MODULES.SPHERICAL_LENS.USE_COLOR || false
        luminode.draw(t, notes, sphericalLensColorMode, layout)
        break
      default:
        // Standard luminode drawing
        luminode.draw(t, notes, layout)
        break
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
