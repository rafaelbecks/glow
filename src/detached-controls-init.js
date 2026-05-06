import { WindowBridge } from './window-bridge.js'
import { SidePanel } from './side-panel.js'
import { SETTINGS } from './settings.js'
import { TrajectorySystem } from './trajectory-system.js'
import { ModulationSystem } from './modulation-system.js'
import { getAvailableLuminodes } from './luminodes/index.js'

class ProxyModulationSystem extends ModulationSystem {
  constructor (bridge) {
    super()
    this.bridge = bridge
  }

  addModulator (type = 'lfo', id = null) {
    const modulatorId = super.addModulator(type, id)
    this.bridge.send('ACTION', { type: 'addModulator', modulatorId })
    return modulatorId
  }

  removeModulator (id) {
    super.removeModulator(id)
    this.bridge.send('ACTION', { type: 'removeModulator', modulatorId: id })
  }

  updateModulator (id, updates) {
    super.updateModulator(id, updates)
    this.bridge.send('ACTION', {
      type: 'updateModulator',
      modulatorId: id,
      updates
    })
  }
}

class ProxyTrackManager {
  constructor (bridge) {
    this.bridge = bridge
    this.tracks = []
    this.midiDevices = []
    this._trajectorySystem = new TrajectorySystem()
    this._modulationSystem = new ProxyModulationSystem(bridge)
    this._callbacks = {}
    this._availableLuminodes = getAvailableLuminodes()
  }

  on (event, cb) {
    if (!this._callbacks[event]) this._callbacks[event] = []
    this._callbacks[event].push(cb)
  }

  _emit (event, data) {
    (this._callbacks[event] || []).forEach((cb) => cb(data))
  }

  applyState (state, fullReset = false) {
    if (state.canvasSettings) { Object.assign(SETTINGS.CANVAS, state.canvasSettings) }
    if (state.colorSettings) { Object.assign(SETTINGS.COLORS, state.colorSettings) }

    const prevDevices = JSON.stringify(this.midiDevices)
    this.tracks = state.tracks || []
    this.midiDevices = state.midiDevices || []
    const devicesChanged = prevDevices !== JSON.stringify(this.midiDevices)

    if (state.trajectoryConfigs) {
      Object.entries(state.trajectoryConfigs).forEach(([id, config]) => {
        this._trajectorySystem.updateTrackConfig(Number(id), config)
      })
    }
    if (state.modulators) {
      this._modulationSystem.modulators = state.modulators
    }

    if (fullReset || devicesChanged) {
      // Full re-render covers both project resets and device list changes
      this._emit('tracksReset')
    } else {
      this.tracks.forEach((track) =>
        this._emit('trackUpdated', { trackId: track.id, track })
      )
    }
  }

  // --- Read ---
  getTracks () {
    return this.tracks
  }

  getTrack (id) {
    return this.tracks.find((t) => t.id === id)
  }

  getAvailableMidiDevices () {
    return this.midiDevices
  }

  getAvailableLuminodes () {
    return this._availableLuminodes
  }

  getTrajectoryConfig (trackId) {
    return this._trajectorySystem.getTrackConfig(trackId)
  }

  getTrajectoryTypes () {
    return this._trajectorySystem.getTrajectoryTypes()
  }

  getTrajectoryTypeNames () {
    return this._trajectorySystem.getTrajectoryTypeNames()
  }

  getModulators () {
    return this._modulationSystem.getModulators()
  }

  getModulator (id) {
    return this._modulationSystem.getModulator(id)
  }

  getModulationSystem () {
    return this._modulationSystem
  }

  getActiveTracks () {
    const hasSolo = this.tracks.some((t) => t.solo)
    return hasSolo
      ? this.tracks.filter((t) => t.solo)
      : this.tracks.filter((t) => !t.muted)
  }

  // --- Write (send action, no optimistic updates for discrete changes) ---
  _action (type, payload = {}) {
    this.bridge.send('ACTION', { type, ...payload })
  }

  toggleMute (trackId) {
    this._action('toggleMute', { trackId })
  }

  toggleSolo (trackId) {
    this._action('toggleSolo', { trackId })
  }

  setMidiDevice (trackId, deviceId) {
    this._action('setMidiDevice', { trackId, deviceId })
  }

  setLuminode (trackId, luminode) {
    this._action('setLuminode', { trackId, luminode })
  }

  setLayout (trackId, updates) {
    const track = this.getTrack(trackId)
    if (track) track.layout = { ...track.layout, ...updates }
    this._action('setLayout', { trackId, updates })
  }

  updateTrajectoryConfig (trackId, updates) {
    const config = this._trajectorySystem.updateTrackConfig(trackId, updates)
    this._emit('trajectoryUpdated', { trackId, config })
    this._action('updateTrajectoryConfig', { trackId, updates })
    return config
  }

  removeModulator (id) {
    this._modulationSystem.removeModulator(id)
  }

  updateModulator (id, updates) {
    this._modulationSystem.updateModulator(id, updates)
  }
}

// --- Bootstrap ---
if (!window.opener) {
  document.body.innerHTML =
    '<p style="color:white;font-family:monospace;padding:20px">Open this window from the main GLOW app.</p>'
} else {
  const bridge = new WindowBridge()
  bridge.connect(window.opener)

  const proxyTrackManager = new ProxyTrackManager(bridge)
  const stubTabletManager = { on: () => {}, triggerCallback: () => {} }
  const stubUiManager = { setPanelToggleActive: () => {} }

  const sidePanel = new SidePanel(
    proxyTrackManager,
    stubTabletManager,
    stubUiManager,
    null,
    { detached: true }
  )
  sidePanel.setSettings(SETTINGS)

  // Canvas/color events update local SETTINGS immediately so the Canvas tab
  // re-renders with current values when the user switches back to it.
  sidePanel.on('canvasSettingChange', (data) => {
    if (data?.setting !== undefined) SETTINGS.CANVAS[data.setting] = data.value
    bridge.send('ACTION', { type: 'canvasSettingChange', data })
  })

  sidePanel.on('colorPaletteChange', (data) => {
    const key = data?.palette?.toUpperCase() + '_PALETTE'
    if (key && SETTINGS.COLORS[key]) { SETTINGS.COLORS[key][data.index] = data.color }
    bridge.send('ACTION', { type: 'colorPaletteChange', data })
  })

  sidePanel.on('pitchColorFactorChange', (data) => {
    bridge.send('ACTION', { type: 'pitchColorFactorChange', data })
  })

  const sidePanelEvents = [
    [
      'luminodeConfigChange',
      (data) => ({ type: 'luminodeConfigChange', data })
    ],
    ['connectTablet', () => ({ type: 'connectTablet' })],
    ['clearTablet', () => ({ type: 'clearTablet' })],
    ['tabletWidthChange', (width) => ({ type: 'tabletWidthChange', width })],
    [
      'geometricModeChange',
      (enabled) => ({ type: 'geometricModeChange', enabled })
    ],
    [
      'shapeDetectionThresholdChange',
      (threshold) => ({ type: 'shapeDetectionThresholdChange', threshold })
    ],
    [
      'geometricPencilChange',
      (enabled) => ({ type: 'geometricPencilChange', enabled })
    ],
    ['polygonSidesChange', (sides) => ({ type: 'polygonSidesChange', sides })],
    ['polygonSizeChange', (size) => ({ type: 'polygonSizeChange', size })],
    [
      'fadeDurationChange',
      (duration) => ({ type: 'fadeDurationChange', duration })
    ],
    ['midiOutputChange', (enabled) => ({ type: 'midiOutputChange', enabled })],
    [
      'midiOutputDeviceChange',
      (deviceId) => ({ type: 'midiOutputDeviceChange', deviceId })
    ],
    ['octaveRangeChange', (range) => ({ type: 'octaveRangeChange', range })]
  ]

  sidePanelEvents.forEach(([event, mapper]) => {
    sidePanel.on(event, (...args) => bridge.send('ACTION', mapper(...args)))
  })

  let panelShown = false

  bridge.on('STATE_SYNC', (state) => {
    proxyTrackManager.applyState(state, false)
    if (!panelShown) {
      panelShown = true
      sidePanel.show()
    }
  })

  bridge.on('TRACKS_RESET', (state) =>
    proxyTrackManager.applyState(state, true)
  )

  bridge.send('READY')
}
