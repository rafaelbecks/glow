// Main application bootstrap and orchestration
import { SETTINGS, UTILS } from './settings.js'
import { MIDIManager } from './midi.js'
import { TrackManager } from './track-manager.js'
import { SidePanel } from './side-panel.js'
import { TabletManager } from './tablet-manager.js'
import { CanvasDrawer } from './canvas-drawer.js'
import { UIManager } from './ui.js'
import { ProjectManager } from './project-manager.js'
import { SaveDialog } from './save-dialog.js'
import { FilePickerDialog } from './file-picker-dialog.js'
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
  DiamondLuminode
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
    this.filePickerDialog = new FilePickerDialog()
    this.visualizerStarted = false

    // CRT overlay element
    this.crtOverlay = null
    this.crtModeEnabled = false
    this.crtIntensity = 100

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
      diamond: DiamondLuminode
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

    // Canvas and color settings
    this.sidePanel.on('canvasSettingChange', (data) => this.updateCanvasSetting(data))
    this.sidePanel.on('colorPaletteChange', (data) => this.updateColorPalette(data))
    this.sidePanel.on('pitchColorFactorChange', (data) => this.updatePitchColorFactor(data))

    this.setupProjectNameEditing()
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

  setupProjectNameEditing () {
    const projectNameText = document.getElementById('projectNameText')
    if (projectNameText) {
      // Handle Enter key press
      projectNameText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          projectNameText.blur()
        }
      })

      // Handle blur event (when focus is lost)
      projectNameText.addEventListener('blur', () => {
        const newName = projectNameText.value.trim() || 'Untitled Project'
        projectNameText.value = newName
        this.handleProjectNameChange(newName)
      })
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

  openFile () {
    this.filePickerDialog.show()
  }

  saveFile () {
    // Generate default scene name with unix timestamp
    const timestamp = Math.floor(Date.now() / 1000)
    const defaultName = `glow-scene-${timestamp}`

    this.saveDialog.setDefaultName(defaultName)
    this.saveDialog.show()
  }

  handleProjectSave (data) {
    const { projectName } = data

    try {
      this.projectManager.downloadProject(projectName)
      this.uiManager.showStatus(`Scene "${projectName}" saved successfully!`, 'success')
    } catch (error) {
      console.error('Error saving scene:', error)
      this.uiManager.showStatus('Error saving scene. Check console for details.', 'error')
    }
  }

  async handleProjectLoad (data) {
    const { file, projectData } = data

    try {
      this.uiManager.showStatus('Loading project...', 'info')

      this.clearCurrentState()

      const success = await this.projectManager.loadProjectState(projectData)

      if (success) {
        const projectName = projectData.name || file.name.replace('.glow', '')
        this.updateProjectName(projectName)

        // Hide logo and show renderer screen after successful load
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

  setGeometricMode (enabled) {
    // Update the geometric mode in the tablet manager
    this.tabletManager.setGeometricMode(enabled)
  }

  setShapeDetectionThreshold (threshold) {
    // Update the shape detection threshold in the tablet manager
    this.tabletManager.setShapeDetectionThreshold(threshold)
  }

  setGeometricPencilMode (enabled) {
    // Update the geometric pencil mode in the tablet manager
    this.tabletManager.setGeometricPencilMode(enabled)
  }

  setPolygonSides (sides) {
    // Update the polygon sides in the tablet manager
    this.tabletManager.setPolygonSides(sides)
  }

  setPolygonSize (size) {
    // Update the polygon size in the tablet manager
    this.tabletManager.setPolygonSize(size)
  }

  setFadeDuration (duration) {
    // Update the fade duration in the tablet manager (convert seconds to milliseconds)
    this.tabletManager.setFadeDuration(duration * 1000)
  }

  setMidiOutputEnabled (enabled) {
    // Update the MIDI output enabled state in the MIDI manager
    this.midiManager.setOutputEnabled(enabled)
  }

  setMidiOutputDevice (deviceId) {
    // Update the MIDI output device in the MIDI manager
    this.midiManager.setOutputDevice(deviceId)
    // Reinitialize MIDI output with the new device
    this.midiManager.initializeOutput()
  }

  setOctaveRange (range) {
    // Update the octave range in the MIDI manager
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
      }
    }
  }

  updateColorPalette (data) {
    const { palette, index, color } = data

    if (SETTINGS.COLORS && SETTINGS.COLORS[palette.toUpperCase() + '_PALETTE']) {
      const paletteKey = palette.toUpperCase() + '_PALETTE'
      SETTINGS.COLORS[paletteKey][index] = color
      console.log(`Updated ${palette} palette color at index ${index} to ${color}`)
    }
  }

  updatePitchColorFactor (data) {
    const { value } = data

    // Update the pitchToColor function in UTILS
    if (UTILS.pitchToColor) {
      // Store the factor for the pitchToColor function
      UTILS.pitchColorFactor = value
      console.log(`Updated pitch color factor to ${value}`)
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

    // Map luminode names to settings keys
    const luminodeMapping = {
      lissajous: 'LISSAJOUS',
      sphere: 'SPHERE',
      harmonograph: 'HARMONOGRAPH',
      gegoNet: 'GEGO_NET',
      gegoShape: 'GEGO_SHAPE',
      sotoGrid: 'SOTO_GRID',
      sotoGridRotated: 'SOTO_GRID',
      whitneyLines: 'WHITNEY_LINES',
      phyllotaxis: 'PHYLLOTAXIS',
      moireCircles: 'MOIRE_CIRCLES',
      wovenNet: 'WOVEN_NET',
      sinewave: 'SINEWAVE',
      triangle: 'TRIANGLE',
      polygons: 'POLYGONS',
      noiseValley: 'NOISE_VALLEY',
      catenoid: 'CATENOID',
      lineCylinder: 'LINE_CYLINDER',
      clavilux: 'CLAVILUX',
      diamond: 'DIAMOND'
    }

    const settingsKey = luminodeMapping[luminode]
    if (settingsKey && SETTINGS.MODULES[settingsKey]) {
      const moduleConfig = SETTINGS.MODULES[settingsKey]
      if (moduleConfig.hasOwnProperty(param)) {
        moduleConfig[param] = value
        console.log(`Updated ${luminode} ${param} to ${value}`)
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

    // Get all active notes based on track assignments
    const activeNotes = this.midiManager.getActiveNotesForTracks()

    // Draw all luminodes
    this.drawLuminodes(t, activeNotes)

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

      // Draw the luminode with track-specific parameters
      this.drawTrackLuminode(luminode, track.luminode, t, notes, layout)
    })
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
      case 'sphere':
        const sphereColorMode = SETTINGS.MODULES.SPHERE.USE_COLOR || false
        luminode.draw(t, notes, sphereColorMode, layout)
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
      projectNameText.value = name || 'Untitled Project'
    }
  }

  handleProjectNameChange (newName) {
    try {
      this.projectManager.downloadProject(newName)
      this.uiManager.showStatus(`Project "${newName}" saved automatically!`, 'success')
    } catch (error) {
      console.error('Error auto-saving project:', error)
      this.uiManager.showStatus('Error auto-saving project. Check console for details.', 'error')
    }
  }

  clearCurrentState () {
    // Clear all track luminodes
    this.trackLuminodes.clear()

    // Clear canvas
    this.canvasDrawer.clear()

    // Clear tablet strokes
    this.tabletManager.clear()

    // Reset all tracks to default state
    const tracks = this.trackManager.getTracks()
    tracks.forEach(track => {
      track.midiDevice = null
      track.luminode = null
      track.muted = false
      track.solo = false
      track.layout = { x: 0, y: 0, rotation: 0 }
      // Trigger callback to update UI
      this.trackManager.triggerCallback('trackUpdated', { trackId: track.id, track })
    })

    // Clear MIDI output device
    this.midiManager.setOutputDevice(null)

    // Reset project name to default
    this.updateProjectName('Untitled Project')

    console.log('Current state cleared before loading new project')
  }

  // Cleanup method
  destroy () {
    this.stop()
    // Add any other cleanup needed
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.glowVisualizer = new GLOWVisualizer()

  // Expose debug method globally
  window.debugMidi = () => window.glowVisualizer.debugMidiDevices()
})
