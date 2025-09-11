// Main application bootstrap and orchestration
import { SETTINGS, UTILS } from './settings.js';
import { MIDIManager } from './midi.js';
import { TrackManager } from './track-manager.js';
import { SidePanel } from './side-panel.js';
import { TabletPanel } from './tablet-panel.js';
import { TabletManager } from './tablet-manager.js';
import { CanvasDrawer } from './canvas-drawer.js';
import { UIManager } from './ui.js';
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
  ScanlineGradientsLuminode,
  PolygonsLuminode
} from './luminodes/index.js';

export class GLOWVisualizer {
  constructor() {
    this.canvas = document.getElementById('canvas');
    this.canvasDrawer = new CanvasDrawer(this.canvas);
    this.trackManager = new TrackManager();
    this.midiManager = new MIDIManager(this.trackManager);
    this.sidePanel = new SidePanel(this.trackManager);
    this.tabletManager = new TabletManager(this.canvas);
    this.tabletPanel = new TabletPanel(this.tabletManager);
    this.uiManager = new UIManager();
    this.visualizerStarted = false;
    
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
      scanlineGradients: new ScanlineGradientsLuminode(this.canvasDrawer),
      polygons: new PolygonsLuminode(this.canvasDrawer)
    };

    this.isRunning = false;
    this.animationId = null;
    
    this.setupEventHandlers();
    this.initialize();
  }

  initialize() {
    // Initial canvas setup
    this.canvasDrawer.resize();    
  }

  setupEventHandlers() {
    // UI event handlers
    this.uiManager.on('startVisualizer', () => this.start());
    this.uiManager.on('connectTablet', () => this.connectTablet());
    this.uiManager.on('clearTablet', () => this.clearTablet());
    this.uiManager.on('clearCanvas', () => this.clearCanvas());
    this.uiManager.on('tabletWidthChange', (width) => this.setTabletWidth(width));
    this.uiManager.on('resize', () => this.handleResize());
    this.uiManager.on('togglePanel', () => this.toggleSidePanel());
    this.uiManager.on('toggleTabletPanel', () => this.toggleTabletPanel());
    this.uiManager.on('toggleMute', (trackId) => this.trackManager.toggleMute(trackId));
    this.uiManager.on('toggleSolo', (trackId) => this.trackManager.toggleSolo(trackId));
    
    // Tablet panel events
    this.tabletPanel.on('connectTablet', () => this.connectTablet());
    this.tabletPanel.on('clearTablet', () => this.clearTablet());
    this.tabletPanel.on('tabletWidthChange', (width) => this.setTabletWidth(width));
    this.tabletPanel.on('colorModeChange', (enabled) => this.setColorMode(enabled));
  }

  async start() {
    try {
      this.visualizerStarted = true;
      this.uiManager.hideStartButton();
      this.uiManager.hideLogoContainer();
      this.uiManager.showPanelToggleButton();
      this.uiManager.showTabletPanelToggleButton();
      this.uiManager.showInfoButton();
      
      this.uiManager.showStatus('Connecting to MIDI devices...', 'info');
      
      await this.midiManager.setupMIDI();
      
      this.uiManager.showStatus('Starting visualizer...', 'success');
      this.isRunning = true;
      this.animate();
      
      // Initialize side panel after MIDI setup
      this.sidePanel.renderTracks();
      
    } catch (error) {
      console.error('Failed to start visualizer:', error);
      this.uiManager.showStatus('Failed to start. Check console for details.', 'error');
      this.uiManager.showStartButton();
    }
  }

  async connectTablet() {
    try {
      this.uiManager.showStatus('Connecting to tablet...', 'info');
      const success = await this.tabletManager.connectUgeeQ6();
      
      if (success) {
        this.uiManager.showStatus('Tablet connected successfully!', 'success');
      } else {
        this.uiManager.showStatus('No tablet found or connection failed.', 'error');
      }
    } catch (error) {
      console.error('Tablet connection error:', error);
      this.uiManager.showStatus('Tablet connection failed.', 'error');
    }
  }

  clearTablet() {
    this.tabletManager.clear();
    this.uiManager.showStatus('Tablet drawing cleared.', 'info');
  }

  clearCanvas() {
    this.canvasDrawer.clear();
    this.uiManager.showStatus('Canvas cleared.', 'info');
  }

  setTabletWidth(width) {
    this.tabletManager.setLineWidth(width);
  }

  handleResize() {
    this.canvasDrawer.resize();
  }

  toggleSidePanel() {
    this.sidePanel.toggle();
    this.uiManager.setPanelToggleActive(this.sidePanel.isPanelVisible());
  }

  toggleTabletPanel() {
    this.tabletPanel.toggle();
    this.uiManager.setTabletPanelToggleActive(this.tabletPanel.isPanelVisible());
  }

  setColorMode(enabled) {
    // Update the color mode in the UI manager
    if (this.uiManager.elements.colorToggle) {
      this.uiManager.elements.colorToggle.checked = enabled;
    }
  }

  animate() {
    if (!this.isRunning) return;

    const time = performance.now();
    const t = time / 1000;

    // Clean up old notes
    this.midiManager.cleanupOldNotes();

    // Clear canvas with fade effect
    this.canvasDrawer.clear();

    // Get all active notes based on track assignments
    const activeNotes = this.midiManager.getActiveNotesForTracks();

    // Draw all luminodes
    this.drawLuminodes(t, activeNotes);

    // Update side panel activity indicators
    this.sidePanel.updateActivityIndicators(activeNotes);

    // Draw tablet strokes
    this.tabletManager.drawStrokes();

    // Check for periodic tablet clearing
    this.tabletManager.checkAndClearStrokes(time);

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  drawLuminodes(t, activeNotes) {
    // Check if any drawing is active
    const hasActiveNotes = Object.values(activeNotes).some(notes => notes.length > 0);
    const hasTabletStrokes = this.tabletManager.strokes.length > 0;
    const isDrawingActive = hasActiveNotes || hasTabletStrokes;

    // Update settings button and logo visibility based on drawing activity
    if (isDrawingActive) {
      this.uiManager.hideLogoContainer();
    } else if (!this.visualizerStarted) {
      this.uiManager.showLogoContainer();
    } else {
      this.uiManager.hideLogoContainer();
    }

    // Background gradient
    this.luminodes.scanlineGradients.draw(t, activeNotes.scanlineGradients, ['#4444ff', '#ffeeaa', '#ff77cc']);

    // Soto grid animations
    this.luminodes.sotoGrid.draw(t, activeNotes.sotoGrid || [], false);
    this.luminodes.sotoGridRotated.draw(t, activeNotes.sotoGridRotated || [], true);

    // Core visual modules
    this.luminodes.lissajous.draw(t, activeNotes.lissajous.map(n => n.midi));
    this.luminodes.harmonograph.draw(t, activeNotes.harmonograph);
    this.luminodes.sphere.draw(t, activeNotes.sphere);
    this.luminodes.gegoNet.draw(t, activeNotes.gegoNet);
    this.luminodes.gegoShape.draw(t, activeNotes.gegoShape);
    this.luminodes.phyllotaxis.draw(t, activeNotes.phyllotaxis);
    this.luminodes.whitneyLines.draw(t, activeNotes.whitneyLines, this.uiManager.getColorMode());

    // Additional visual modules
    this.luminodes.moireCircles.draw(t, activeNotes.moireCircles);
    this.luminodes.wovenNet.draw(t, activeNotes.wovenNet);
    this.luminodes.sinewave.draw(t, activeNotes.sinewave);
    this.luminodes.triangle.draw(t, activeNotes.triangle, 'triangle', 1);
    this.luminodes.polygons.draw(t, activeNotes.polygons);
  }


  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  // Debug method to check MIDI devices
  debugMidiDevices() {
    console.log('=== MIDI Debug Info ===');
    console.log('Legacy system devices:', this.midiManager.getDeviceInfo());
    console.log('Track system devices:', this.midiManager.getAllMidiDevices());
    console.log('TrackManager devices:', this.trackManager.getAvailableMidiDevices());
    console.log('Current tracks:', this.trackManager.getTracks());
  }

  // Cleanup method
  destroy() {
    this.stop();
    // Add any other cleanup needed
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.glowVisualizer = new GLOWVisualizer();
  
  // Expose debug method globally
  window.debugMidi = () => window.glowVisualizer.debugMidiDevices();
});
