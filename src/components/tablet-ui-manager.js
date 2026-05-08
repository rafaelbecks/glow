import { Pane } from '../lib/tweakpane.min.js'

export class TabletUIManager {
  constructor (panel, tabletManager = null, midiManager = null) {
    this.panel = panel
    this.tabletManager = tabletManager
    this.midiManager = midiManager
    this.mainPane = null
  }

  async renderTabletControls () {
    const container = this.panel.querySelector('#tabletControlsContainer')
    if (!container) return

    if (this.mainPane) {
      this.mainPane.dispose()
      this.mainPane = null
    }

    container.innerHTML = '<div id="tablet-pane-container"></div>'
    const paneContainer = container.querySelector('#tablet-pane-container')
    if (!paneContainer) return

    this.mainPane = new Pane({ container: paneContainer })

    // Style pane root (same pattern as CanvasUIManager)
    const stylePane = () => {
      const paneElement = paneContainer.querySelector('.tp-rotv')
      if (paneElement) {
        paneElement.style.width = '100%'
        paneElement.style.margin = '0'
        paneElement.style.padding = '0'
        paneElement.style.background = 'transparent'
        paneElement.style.border = 'none'
      } else {
        requestAnimationFrame(stylePane)
      }
    }
    requestAnimationFrame(stylePane)

    // State, seeded from tabletManager when available
    const state = {
      lineWidth: this.tabletManager?.baseLineWidth ?? 4,
      geometricPencil: this.tabletManager?.geometricPencilMode ?? false,
      polygonSides: this.tabletManager?.polygonSides ?? 3,
      fadeDuration: ((this.tabletManager?.fadeDuration ?? 3000) / 1000),
      midiOutput: false,
      midiDevice: '',
      octaveRange: 3
    }

    // --- Connection ---
    const connectionFolder = this.mainPane.addFolder({ title: 'Connection', expanded: true })
    connectionFolder.addButton({ title: 'Connect Tablet (WebHID)' }).on('click', () => {
      this.trigger('connectTablet')
    })

    // --- Drawing ---
    const drawingFolder = this.mainPane.addFolder({ title: 'Drawing', expanded: true })
    drawingFolder.addBinding(state, 'lineWidth', {
      label: 'Line Width', min: 1, max: 20, step: 1
    }).on('change', (ev) => this.trigger('tabletWidthChange', ev.value))

    drawingFolder.addButton({ title: 'Clear Drawing' }).on('click', () => {
      this.trigger('clearTablet')
    })

    // --- Geometric Pencil ---
    const geoFolder = this.mainPane.addFolder({ title: 'Geometric Pencil', expanded: false })
    geoFolder.addBinding(state, 'geometricPencil', { label: 'Enable' })
      .on('change', (ev) => this.trigger('geometricPencilChange', ev.value))

    geoFolder.addBinding(state, 'polygonSides', {
      label: 'Polygon Sides', min: 3, max: 10, step: 1
    }).on('change', (ev) => this.trigger('polygonSidesChange', ev.value))

    geoFolder.addBinding(state, 'fadeDuration', {
      label: 'Fade (sec)', min: 1, max: 10, step: 0.5
    }).on('change', (ev) => this.trigger('fadeDurationChange', Math.round(ev.value * 1000)))

    // --- MIDI Output ---
    const midiFolder = this.mainPane.addFolder({ title: 'MIDI Output', expanded: false })
    midiFolder.addBinding(state, 'midiOutput', { label: 'Enable' })
      .on('change', (ev) => this.trigger('midiOutputChange', ev.value))

    const deviceOptions = await this.getMidiDeviceOptions()
    state.midiDevice = Object.values(deviceOptions)[0] ?? ''

    midiFolder.addBinding(state, 'midiDevice', { label: 'Device', options: deviceOptions })
      .on('change', (ev) => this.trigger('midiOutputDeviceChange', ev.value))

    midiFolder.addBinding(state, 'octaveRange', {
      label: 'Octave Range', min: 1, max: 4, step: 1
    }).on('change', (ev) => this.trigger('octaveRangeChange', ev.value))
  }

  async getMidiDeviceOptions () {
    const options = { 'No device': '' }
    if (!this.midiManager) return options
    try {
      const devices = await this.midiManager.getAvailableOutputDevices()
      devices.forEach(d => { options[d.name] = d.id ?? d.name })
    } catch (e) {
      console.warn('TabletUIManager: could not get MIDI devices', e)
    }
    return options
  }

  // Fire a CustomEvent on the panel element so SidePanel can route it
  trigger (action, data) {
    this.panel.dispatchEvent(new CustomEvent('tabletControlChange', {
      detail: { action, data }
    }))
  }
}
