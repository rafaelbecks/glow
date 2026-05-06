import { WindowBridge } from './window-bridge.js'
import { SETTINGS } from './settings.js'

export class ControlsManager {
  constructor (glow) {
    this.glow = glow
    this.bridge = new WindowBridge()
    this.controlsWindow = null
    this._pollInterval = null
    this._setupHandlers()
  }

  toggle () {
    this.isOpen() ? this.controlsWindow.focus() : this.open()
  }

  isOpen () {
    return !!(this.controlsWindow && !this.controlsWindow.closed)
  }

  open () {
    if (this.isOpen()) {
      this.controlsWindow.focus()
      return
    }

    this.controlsWindow = window.open(
      'controls.html',
      'glow-controls',
      'width=400,height=900,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes'
    )
    this.bridge.connect(this.controlsWindow)

    if (this.glow.sidePanel.isPanelVisible()) this.glow.sidePanel.hide()
    this.glow.uiManager.hidePanelToggleButton()
    this.glow.uiManager.setDetachActive(true)

    this._pollInterval = setInterval(() => {
      if (this.controlsWindow?.closed) this._onClosed()
    }, 500)
  }

  _onClosed () {
    clearInterval(this._pollInterval)
    this._pollInterval = null
    this.controlsWindow = null
    this.glow.uiManager.showPanelToggleButton()
    this.glow.uiManager.setDetachActive(false)
  }

  _getState () {
    const { trackManager } = this.glow
    const trajectoryConfigs = {}
    trackManager.getTracks().forEach((t) => {
      trajectoryConfigs[t.id] = trackManager.getTrajectoryConfig(t.id)
    })
    return {
      tracks: JSON.parse(JSON.stringify(trackManager.getTracks())),
      midiDevices: trackManager.getAvailableMidiDevices(),
      trajectoryConfigs,
      modulators: JSON.parse(JSON.stringify(trackManager.getModulators())),
      canvasSettings: JSON.parse(JSON.stringify(SETTINGS.CANVAS)),
      colorSettings: JSON.parse(JSON.stringify(SETTINGS.COLORS))
    }
  }

  _sendState () {
    if (!this.bridge.isConnected()) return
    this.bridge.send('STATE_SYNC', this._getState())
  }

  _setupHandlers () {
    const { trackManager } = this.glow

    trackManager.on('tracksReset', () => {
      if (this.bridge.isConnected()) { this.bridge.send('TRACKS_RESET', this._getState()) }
    })
    trackManager.on('midiDeviceAdded', () => this._sendState())
    trackManager.on('midiDeviceRemoved', () => this._sendState())

    this.bridge.on('READY', () => this._sendState())
    this.bridge.on('ACTION', (action) => this._dispatch(action))
  }

  _dispatch ({ type, ...p }) {
    const glow = this.glow
    const { trackManager } = glow
    const sync = () => this._sendState()

    switch (type) {
      case 'toggleMute':
        trackManager.toggleMute(p.trackId)
        sync()
        break
      case 'toggleSolo':
        trackManager.toggleSolo(p.trackId)
        sync()
        break
      case 'setMidiDevice':
        trackManager.setMidiDevice(p.trackId, p.deviceId)
        sync()
        break
      case 'setLuminode':
        trackManager.setLuminode(p.trackId, p.luminode)
        glow.handleLuminodeChange({ trackId: p.trackId, luminode: p.luminode })
        sync()
        break
      case 'setLayout':
        trackManager.setLayout(p.trackId, p.updates)
        break
      case 'updateTrajectoryConfig':
        trackManager.updateTrajectoryConfig(p.trackId, p.updates)
        break
      case 'addModulator':
        trackManager.addModulator('lfo', p.modulatorId)
        sync()
        break
      case 'removeModulator':
        trackManager.removeModulator(p.modulatorId)
        sync()
        break
      case 'updateModulator':
        trackManager.updateModulator(p.modulatorId, p.updates)
        break
      case 'luminodeConfigChange':
        glow.updateLuminodeConfig(p.data)
        break
      case 'canvasSettingChange':
        glow.updateCanvasSetting(p.data)
        break
      case 'colorPaletteChange':
        glow.updateColorPalette(p.data)
        break
      case 'pitchColorFactorChange':
        glow.updatePitchColorFactor(p.data)
        break
      case 'connectTablet':
        glow.connectTablet()
        break
      case 'clearTablet':
        glow.clearTablet()
        break
      case 'tabletWidthChange':
        glow.setTabletWidth(p.width)
        break
      case 'geometricModeChange':
        glow.setGeometricMode(p.enabled)
        break
      case 'shapeDetectionThresholdChange':
        glow.setShapeDetectionThreshold(p.threshold)
        break
      case 'geometricPencilChange':
        glow.setGeometricPencilMode(p.enabled)
        break
      case 'polygonSidesChange':
        glow.setPolygonSides(p.sides)
        break
      case 'polygonSizeChange':
        glow.setPolygonSize(p.size)
        break
      case 'fadeDurationChange':
        glow.setFadeDuration(p.duration)
        break
      case 'midiOutputChange':
        glow.setMidiOutputEnabled(p.enabled)
        break
      case 'midiOutputDeviceChange':
        glow.setMidiOutputDevice(p.deviceId)
        break
      case 'octaveRangeChange':
        glow.setOctaveRange(p.range)
        break
    }
  }
}
