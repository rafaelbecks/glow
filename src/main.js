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
  LineCylinderLuminode
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
    this.visualizerStarted = false
    
    // CRT overlay element
    this.crtOverlay = null
    this.crtModeEnabled = false
    this.crtIntensity = 100

    // Initialize luminodes
    this.luminodes = {
      lissajous: new LissajousLuminode(this.canvasDrawer),
      harmonograph: new HarmonographLuminode(this.canvasDrawer),
      sphere: new SphereLuminode(this.canvasDrawer),
      gegoNet: new GegoNetLuminode(this.canvasDrawer),
      gegoShape: new GegoShapeLuminode(this.canvasDrawer),
      sotoGrid: new SotoGridLuminode(this.canvasDrawer),
      sotoGridRotated: new SotoGridLuminode(this.canvasDrawer),
      whitneyLines: new WhitneyLinesLuminode(this.canvasDrawer),
      phyllotaxis: new PhyllotaxisLuminode(this.canvasDrawer),
      moireCircles: new MoireCirclesLuminode(this.canvasDrawer),
      wovenNet: new WovenNetLuminode(this.canvasDrawer),
      sinewave: new SinewaveLuminode(this.canvasDrawer),
      triangle: new TriangleLuminode(this.canvasDrawer),
      polygons: new PolygonsLuminode(this.canvasDrawer),
      noiseValley: new NoiseValleyLuminode(this.canvasDrawer),
      catenoid: new CatenoidLuminode(this.canvasDrawer),
      lineCylinder: new LineCylinderLuminode(this.canvasDrawer)
    }

    this.isRunning = false
    this.animationId = null

    this.setupEventHandlers()
    this.setupSaveDialog()
    this.initialize()
  }

  initialize () {
    // Initial canvas setup
    this.canvasDrawer.resize()
    this.resizeTabletCanvas()
    
    // Create CRT overlay
    this.createCRTOverlay()
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


  async start () {
    try {
      this.visualizerStarted = true
      this.uiManager.hideStartButton()
      this.uiManager.hideLogoContainer()
      this.uiManager.showPanelToggleButton()
      this.uiManager.showOpenButton()
      this.uiManager.showSaveButton()
      this.uiManager.showInfoButton()
      this.uiManager.showCanvasMessage()

      this.uiManager.showStatus('Connecting to MIDI devices...', 'info')

      await this.midiManager.setupMIDI()

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
    console.log('Open file functionality - to be implemented')
    this.uiManager.showStatus('Open file functionality - to be implemented', 'info')
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
      lineCylinder: 'LINE_CYLINDER'
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

        layouts[track.luminode] = {
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

    // Get track layouts for positioning
    const trackLayouts = this.getTrackLayouts()

    // Soto grid animations
    this.luminodes.sotoGrid.draw(t, activeNotes.sotoGrid || [], false, trackLayouts.sotoGrid)
    this.luminodes.sotoGridRotated.draw(t, activeNotes.sotoGridRotated || [], true, trackLayouts.sotoGridRotated)

    // Core visual modules
    this.luminodes.lissajous.draw(t, activeNotes.lissajous.map(n => n.midi), trackLayouts.lissajous)
    this.luminodes.harmonograph.draw(t, activeNotes.harmonograph, trackLayouts.harmonograph)
    this.luminodes.sphere.draw(t, activeNotes.sphere, trackLayouts.sphere)
    this.luminodes.gegoNet.draw(t, activeNotes.gegoNet, trackLayouts.gegoNet)
    this.luminodes.gegoShape.draw(t, activeNotes.gegoShape, trackLayouts.gegoShape)
    this.luminodes.phyllotaxis.draw(t, activeNotes.phyllotaxis, SETTINGS.MODULES.PHYLLOTAXIS.DOTS_PER_NOTE, trackLayouts.phyllotaxis)
    // Get Whitney Lines color mode from settings
    const whitneyColorMode = SETTINGS.MODULES.WHITNEY_LINES.USE_COLOR || false
    this.luminodes.whitneyLines.draw(t, activeNotes.whitneyLines, whitneyColorMode, trackLayouts.whitneyLines)

    // Additional visual modules
    this.luminodes.moireCircles.draw(t, activeNotes.moireCircles, trackLayouts.moireCircles)
    this.luminodes.wovenNet.draw(t, activeNotes.wovenNet, trackLayouts.wovenNet)
    this.luminodes.sinewave.draw(t, activeNotes.sinewave, trackLayouts.sinewave)
    this.luminodes.triangle.draw(t, activeNotes.triangle, 'triangle', 1, 300, trackLayouts.triangle)
    this.luminodes.polygons.draw(t, activeNotes.polygons, trackLayouts.polygons)
    
    // Noise Valley (background layer)
    const noiseValleyColorMode = SETTINGS.MODULES.NOISE_VALLEY.USE_COLOR || false
    this.luminodes.noiseValley.draw(t, activeNotes.noiseValley || [], noiseValleyColorMode, trackLayouts.noiseValley)
    
    // Catenoid (background layer)
    const catenoidColorMode = SETTINGS.MODULES.CATENOID.USE_COLOR || false
    this.luminodes.catenoid.draw(t, activeNotes.catenoid || [], catenoidColorMode, trackLayouts.catenoid)
    
    // Line Cylinder (background layer)
    const lineCylinderColorMode = SETTINGS.MODULES.LINE_CYLINDER.USE_COLOR || false
    this.luminodes.lineCylinder.draw(t, activeNotes.lineCylinder || [], lineCylinderColorMode, trackLayouts.lineCylinder)
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
