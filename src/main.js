// Main application bootstrap and orchestration
import { SETTINGS, UTILS } from './settings.js'
import { MIDIManager } from './midi.js'
import { TrackManager } from './track-manager.js'
import { SidePanel } from './side-panel.js'
import { TabletManager } from './tablet-manager.js'
import { CanvasDrawer } from './canvas-drawer.js'
import { UIManager } from './ui.js'
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
  PolygonsLuminode
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
    this.sidePanel = new SidePanel(this.trackManager, this.tabletManager, this.uiManager)
    this.sidePanel.setSettings(SETTINGS)
    this.visualizerStarted = false

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
      polygons: new PolygonsLuminode(this.canvasDrawer)
    }

    this.isRunning = false
    this.animationId = null

    this.setupEventHandlers()
    this.initialize()
  }

  initialize () {
    // Initial canvas setup
    this.canvasDrawer.resize()
    this.resizeTabletCanvas()
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
    this.sidePanel.on('backgroundBleedingChange', (enabled) => this.setBackgroundBleeding(enabled))
    this.sidePanel.on('canvasLayerChange', (layer) => this.setCanvasLayer(layer))
    this.sidePanel.on('geometricModeChange', (enabled) => this.setGeometricMode(enabled))
    this.sidePanel.on('shapeDetectionThresholdChange', (threshold) => this.setShapeDetectionThreshold(threshold))
    this.sidePanel.on('geometricPencilChange', (enabled) => this.setGeometricPencilMode(enabled))
    this.sidePanel.on('polygonSidesChange', (sides) => this.setPolygonSides(sides))
    this.sidePanel.on('fadeDurationChange', (duration) => this.setFadeDuration(duration))
    this.sidePanel.on('midiOutputChange', (enabled) => this.setMidiOutputEnabled(enabled))
    this.sidePanel.on('midiOutputDeviceChange', (deviceId) => this.setMidiOutputDevice(deviceId))
    this.sidePanel.on('octaveRangeChange', (range) => this.setOctaveRange(range))
    
    // Canvas and color settings
    this.sidePanel.on('canvasSettingChange', (data) => this.updateCanvasSetting(data))
    this.sidePanel.on('colorPaletteChange', (data) => this.updateColorPalette(data))
    this.sidePanel.on('pitchColorFactorChange', (data) => this.updatePitchColorFactor(data))
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
      this.populateMidiOutputDevices()
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
    console.log('Save file functionality - to be implemented')
    this.uiManager.showStatus('Save file functionality - to be implemented', 'info')
  }


  setBackgroundBleeding (enabled) {
    // Update the background bleeding setting in the tablet manager
    this.tabletManager.setBackgroundBleeding(enabled)
  }

  setCanvasLayer (layer) {
    // Update the canvas layer order in the tablet manager
    this.tabletManager.setCanvasLayerOrder(layer)
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

  populateMidiOutputDevices () {
    // Get available MIDI devices from the MIDI manager
    const devices = this.midiManager.getAvailableOutputDevices()
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
    const { trackId, luminode, param, value } = data
    
    // Map luminode names to settings keys
    const luminodeMapping = {
      'lissajous': 'LISSAJOUS',
      'sphere': 'SPHERE',
      'harmonograph': 'HARMONOGRAPH',
      'gegoNet': 'GEGO_NET',
      'gegoShape': 'GEGO_SHAPE',
      'sotoGrid': 'SOTO_GRID',
      'sotoGridRotated': 'SOTO_GRID',
      'whitneyLines': 'WHITNEY_LINES',
      'phyllotaxis': 'PHYLLOTAXIS',
      'moireCircles': 'MOIRE_CIRCLES',
      'wovenNet': 'WOVEN_NET',
      'sinewave': 'SINEWAVE',
      'triangle': 'TRIANGLE',
      'polygons': 'POLYGONS'
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

    // Soto grid animations
    this.luminodes.sotoGrid.draw(t, activeNotes.sotoGrid || [], false)
    this.luminodes.sotoGridRotated.draw(t, activeNotes.sotoGridRotated || [], true)

    // Core visual modules
    this.luminodes.lissajous.draw(t, activeNotes.lissajous.map(n => n.midi))
    this.luminodes.harmonograph.draw(t, activeNotes.harmonograph)
    this.luminodes.sphere.draw(t, activeNotes.sphere)
    this.luminodes.gegoNet.draw(t, activeNotes.gegoNet)
    this.luminodes.gegoShape.draw(t, activeNotes.gegoShape)
    this.luminodes.phyllotaxis.draw(t, activeNotes.phyllotaxis)
    // Get Whitney Lines color mode from settings
    const whitneyColorMode = SETTINGS.MODULES.WHITNEY_LINES.USE_COLOR || false
    this.luminodes.whitneyLines.draw(t, activeNotes.whitneyLines, whitneyColorMode)

    // Additional visual modules
    this.luminodes.moireCircles.draw(t, activeNotes.moireCircles)
    this.luminodes.wovenNet.draw(t, activeNotes.wovenNet)
    this.luminodes.sinewave.draw(t, activeNotes.sinewave)
    this.luminodes.triangle.draw(t, activeNotes.triangle, 'triangle', 1)
    this.luminodes.polygons.draw(t, activeNotes.polygons)
  }

  stop () {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
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
