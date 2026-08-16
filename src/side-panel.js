// Modular side panel UI component with separated concerns
import { SidePanelBase } from './components/side-panel-base.js'
import { TrackUIManager } from './components/track-ui-manager.js'
import { LuminodeConfigManager } from './components/luminode-config-manager.js'
import { CanvasUIManager } from './components/canvas-ui-manager.js'
import { ModulationUIManager } from './components/modulation-ui-manager.js'
import { ExternalSystemsUIManager } from './components/external-systems-ui-manager.js'

export class SidePanel {
  constructor (
    trackManager,
    tabletManager,
    uiManager = null,
    midiManager = null,
    options = {},
    midiGenerator = null
  ) {
    // Initialize base panel
    this.basePanel = new SidePanelBase(
      trackManager,
      tabletManager,
      uiManager,
      midiManager,
      options
    )

    // Initialize specialized managers
    this.luminodeConfigManager = new LuminodeConfigManager(
      trackManager,
      this.basePanel.getPanel()
    )
    this.trackUIManager = new TrackUIManager(
      trackManager,
      this.basePanel.getPanel(),
      this.luminodeConfigManager,
      midiGenerator
    )
    this.canvasUIManager = new CanvasUIManager(
      this.basePanel.getPanel(),
      trackManager
    )
    this.modulationUIManager = new ModulationUIManager(
      trackManager,
      this.basePanel.getPanel()
    )
    this.externalSystemsUIManager = new ExternalSystemsUIManager(
      this.basePanel.getPanel(),
      tabletManager,
      midiManager,
      midiGenerator,
      options.ccMapper || null
    )

    // Set up event delegation
    this.setupEventDelegation()
  }

  setupEventDelegation () {
    // Delegate base panel callbacks to specialized managers
    this.basePanel.on('tabSwitched', (data) => {
      this.handleTabSwitch(data.tab)
    })

    this.basePanel.on('panelShown', () => {
      this.trackUIManager.renderTracks()
    })

    // Delegate track manager events
    this.basePanel.on('trackUpdated', (data) => {
      this.trackUIManager.updateTrackUI(data.trackId, data.track)
      this.canvasUIManager.refreshSotoPaletteVisibility()
    })

    this.basePanel.on('midiDeviceAdded', (data) => {
      this.trackUIManager.updateMidiDeviceDropdowns()
    })

    this.basePanel.on('midiDeviceRemoved', (data) => {
      this.trackUIManager.updateMidiDeviceDropdowns()
    })

    this.basePanel.on('tracksReset', () => {
      this.trackUIManager.renderTracks()
    })

    this.basePanel.on('trajectoryUpdated', (data) => {
      this.trackUIManager.updateTrajectoryUI(data.trackId, data.config)
    })

    // Listen for luminode config changes
    this.basePanel.getPanel().addEventListener('luminodeConfigChange', (e) => {
      this.triggerCallback('luminodeConfigChange', e.detail)
    })

    // Listen for canvas setting changes
    this.basePanel.getPanel().addEventListener('canvasSettingChange', (e) => {
      this.triggerCallback('canvasSettingChange', e.detail)
    })

    this.basePanel.getPanel().addEventListener('colorPaletteChange', (e) => {
      this.triggerCallback('colorPaletteChange', e.detail)
    })

    this.basePanel
      .getPanel()
      .addEventListener('pitchColorFactorChange', (e) => {
        this.triggerCallback('pitchColorFactorChange', e.detail)
      })

    this.basePanel.getPanel().addEventListener('canvasExport', (e) => {
      this.triggerCallback('canvasExport', e.detail)
    })

    // Route external systems (MIDI generate + tablet) control events
    this.basePanel.getPanel().addEventListener('externalControlChange', (e) => {
      const { action, data } = e.detail
      this.triggerCallback(action, data)
    })
  }

  // Handle tab switching
  async handleTabSwitch (tabName) {
    this.modulationUIManager.setMonitorActive(tabName === 'modulation')

    if (tabName === 'tracks') {
      this.trackUIManager.renderTracks()
    } else if (tabName === 'modulation') {
      this.modulationUIManager.renderModulationControls()
    } else if (tabName === 'external') {
      await this.externalSystemsUIManager.renderExternalControls()
    } else if (tabName === 'canvas') {
      this.canvasUIManager.renderCanvasControls()
    }
  }

  // Delegate all base panel methods
  on (event, callback) {
    this.basePanel.on(event, callback)
  }

  triggerCallback (event, data) {
    this.basePanel.triggerCallback(event, data)
  }

  show () {
    this.basePanel.show()
  }

  hide () {
    this.basePanel.hide()
  }

  toggle () {
    this.basePanel.toggle()
  }

  isPanelVisible () {
    return this.basePanel.isPanelVisible()
  }

  // Devices are fetched by ExternalSystemsUIManager when the tab is rendered
  updateMidiOutputDevices (devices) {}

  // Delegate track UI methods
  renderTracks () {
    this.trackUIManager.renderTracks()
  }

  updateTrackUI (trackId, track) {
    this.trackUIManager.updateTrackUI(trackId, track)
  }

  updateMidiDeviceDropdowns () {
    this.trackUIManager.updateMidiDeviceDropdowns()
  }

  updateActivityIndicators (activeNotes) {
    this.trackUIManager.updateActivityIndicators(activeNotes)
  }

  // Delegate luminode config methods
  updateLuminodeConfig (trackId, luminode) {
    this.luminodeConfigManager.updateLuminodeConfig(trackId, luminode)
  }

  // Delegate canvas methods
  renderCanvasControls () {
    this.canvasUIManager.renderCanvasControls()
  }

  // Settings management
  setSettings (settings) {
    this.trackUIManager.setSettings(settings)
    this.luminodeConfigManager.setSettings(settings)
    this.canvasUIManager.setSettings(settings)
  }

  setLuminodePicker (picker) {
    this.trackUIManager.setLuminodePicker(picker)
  }

  setOnEditLuminode (callback) {
    this.trackUIManager.setOnEditLuminode(callback)
  }

  setOnGeneratorChanged (callback) {
    this.trackUIManager.setOnGeneratorChanged(callback)
  }

  refreshGeneratorDiceIcons () {
    this.trackUIManager.refreshGeneratorDiceIcons()
  }

  async refreshExternalSystems () {
    await this.externalSystemsUIManager.renderExternalControls()
  }

  setCCMapper (ccMapper) {
    this.externalSystemsUIManager.setCCMapper(ccMapper)
  }

  applyLuminodeSelection (trackId, luminode) {
    this.trackUIManager.applyLuminodeSelection(trackId, luminode)
  }
}
