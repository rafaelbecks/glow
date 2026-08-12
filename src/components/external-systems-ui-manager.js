import { Pane } from '../lib/tweakpane.min.js'
import { INTERVALS } from '../midi-generator.js'

export class ExternalSystemsUIManager {
  constructor (panel, tabletManager = null, midiManager = null, midiGenerator = null) {
    this.panel = panel
    this.tabletManager = tabletManager
    this.midiManager = midiManager
    this.midiGenerator = midiGenerator
    this.mainPane = null
  }

  async renderExternalControls () {
    const container = this.panel.querySelector('#externalControlsContainer')
    if (!container) return

    if (this.mainPane) {
      this.mainPane.dispose()
      this.mainPane = null
    }

    const generators = this.midiGenerator?.getGenerators() ?? []
    const tracks = this.midiGenerator?.trackManager?.getTracks?.() ?? []
    const deviceOptions = await this.getMidiDeviceOptions()
    const canAdd = this.midiGenerator?.canAddGenerator?.() ?? false

    container.innerHTML = `
      <div class="external-systems-controls">
        <div class="control-section">
          <div class="modulator-header">
            <h4>MIDI Generators</h4>
            <button class="add-modulator-btn" id="addGeneratorBtn" ${canAdd ? '' : 'disabled'}>
              <ion-icon name="add-outline"></ion-icon>
              Add Generator
            </button>
          </div>
          ${generators.length === 0
            ? '<div class="no-modulators">No generators. Click "Add Generator" to drive a track without MIDI hardware.</div>'
            : ''}
          <div id="external-pane-container"></div>
        </div>
      </div>
    `

    this.setupGeneratorListListeners()

    const paneContainer = container.querySelector('#external-pane-container')
    if (!paneContainer) return

    this.mainPane = new Pane({ container: paneContainer })

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

    const midiFolder = this.mainPane.addFolder({ title: 'MIDI', expanded: true })

    generators.forEach((generator, index) => {
      this.createGeneratorFolder(midiFolder, generator, index, tracks)
    })

    const midiOutFolder = midiFolder.addFolder({ title: 'MIDI Output (optional)', expanded: false })
    const midiOutState = {
      midiOut: this.midiGenerator?.isMidiOutEnabled?.() ?? false,
      midiOutDevice: Object.values(deviceOptions)[0] ?? ''
    }

    midiOutFolder.addBinding(midiOutState, 'midiOut', { label: 'Enable' })
      .on('change', (ev) => {
        if (ev.value && midiOutState.midiOutDevice) {
          this.trigger('generateMidiOutDeviceChange', midiOutState.midiOutDevice)
        }
        this.trigger('generateMidiOutChange', ev.value)
      })

    midiOutFolder.addBinding(midiOutState, 'midiOutDevice', {
      label: 'Device',
      options: deviceOptions
    }).on('change', (ev) => this.trigger('generateMidiOutDeviceChange', ev.value))

    // --- Tablet (experimental, collapsed) ---
    const tabletFolder = this.mainPane.addFolder({ title: 'Tablet (experimental)', expanded: false })

    const tabletState = {
      lineWidth: this.tabletManager?.baseLineWidth ?? 4,
      geometricPencil: this.tabletManager?.geometricPencilMode ?? false,
      polygonSides: this.tabletManager?.polygonSides ?? 3,
      fadeDuration: ((this.tabletManager?.fadeDuration ?? 3000) / 1000),
      midiOutput: false,
      midiDevice: Object.values(deviceOptions)[0] ?? '',
      octaveRange: 3
    }

    const connectionFolder = tabletFolder.addFolder({ title: 'Connection', expanded: true })
    connectionFolder.addButton({ title: 'Connect Tablet (WebHID)' }).on('click', () => {
      this.trigger('connectTablet')
    })

    const drawingFolder = tabletFolder.addFolder({ title: 'Drawing', expanded: true })
    drawingFolder.addBinding(tabletState, 'lineWidth', {
      label: 'Line Width', min: 1, max: 20, step: 1
    }).on('change', (ev) => this.trigger('tabletWidthChange', ev.value))

    drawingFolder.addButton({ title: 'Clear Drawing' }).on('click', () => {
      this.trigger('clearTablet')
    })

    const geoFolder = tabletFolder.addFolder({ title: 'Geometric Pencil', expanded: false })
    geoFolder.addBinding(tabletState, 'geometricPencil', { label: 'Enable' })
      .on('change', (ev) => this.trigger('geometricPencilChange', ev.value))

    geoFolder.addBinding(tabletState, 'polygonSides', {
      label: 'Polygon Sides', min: 3, max: 10, step: 1
    }).on('change', (ev) => this.trigger('polygonSidesChange', ev.value))

    geoFolder.addBinding(tabletState, 'fadeDuration', {
      label: 'Fade (sec)', min: 1, max: 10, step: 0.5
    }).on('change', (ev) => this.trigger('fadeDurationChange', Math.round(ev.value * 1000)))

    const tabletMidiFolder = tabletFolder.addFolder({ title: 'MIDI Output', expanded: false })
    tabletMidiFolder.addBinding(tabletState, 'midiOutput', { label: 'Enable' })
      .on('change', (ev) => this.trigger('midiOutputChange', ev.value))

    tabletMidiFolder.addBinding(tabletState, 'midiDevice', {
      label: 'Device',
      options: deviceOptions
    }).on('change', (ev) => this.trigger('midiOutputDeviceChange', ev.value))

    tabletMidiFolder.addBinding(tabletState, 'octaveRange', {
      label: 'Octave Range', min: 1, max: 4, step: 1
    }).on('change', (ev) => this.trigger('octaveRangeChange', ev.value))
  }

  createGeneratorFolder (parentFolder, generator, index, tracks) {
    const used = new Set(this.midiGenerator.getUsedTrackIds(generator.id))
    const trackOptions = {}
    tracks.forEach((track) => {
      if (track.id === generator.trackId || !used.has(track.id)) {
        trackOptions[`Track ${track.id}`] = track.id
      }
    })

    const intervalOptions = Object.fromEntries(
      Object.keys(INTERVALS).map((key) => [key, key])
    )

    const state = {
      enabled: generator.enabled,
      trackId: generator.trackId,
      intervalMs: generator.intervalMs,
      intervalMode: generator.intervalMode,
      numberOfNotes: generator.numberOfNotes,
      velocity: generator.velocity,
      velocityRandom: generator.velocityRandom
    }

    const folder = parentFolder.addFolder({
      title: `Generator ${index + 1}`,
      expanded: true
    })

    folder.addBinding(state, 'enabled', { label: 'Enable' })
      .on('change', (ev) => {
        this.midiGenerator.updateGenerator(generator.id, { enabled: ev.value })
      })

    folder.addBinding(state, 'trackId', {
      label: 'Track',
      options: trackOptions
    }).on('change', (ev) => {
      this.midiGenerator.updateGenerator(generator.id, { trackId: ev.value })
      this.renderExternalControls()
    })

    folder.addBinding(state, 'intervalMs', {
      label: 'Interval (ms)', min: 100, max: 25000, step: 50
    }).on('change', (ev) => {
      this.midiGenerator.updateGenerator(generator.id, { intervalMs: ev.value })
    })

    folder.addBinding(state, 'intervalMode', {
      label: 'Musical Interval',
      options: intervalOptions
    }).on('change', (ev) => {
      this.midiGenerator.updateGenerator(generator.id, { intervalMode: ev.value })
    })

    folder.addBinding(state, 'numberOfNotes', {
      label: 'Notes', min: 1, max: 8, step: 1
    }).on('change', (ev) => {
      this.midiGenerator.updateGenerator(generator.id, { numberOfNotes: ev.value })
    })

    folder.addBinding(state, 'velocity', {
      label: 'Velocity', min: 1, max: 127, step: 1
    }).on('change', (ev) => {
      this.midiGenerator.updateGenerator(generator.id, { velocity: ev.value })
    })

    folder.addBinding(state, 'velocityRandom', {
      label: 'Vel. Random ±', min: 0, max: 64, step: 1
    }).on('change', (ev) => {
      this.midiGenerator.updateGenerator(generator.id, { velocityRandom: ev.value })
    })

    folder.addButton({ title: 'Remove Generator' }).on('click', () => {
      this.midiGenerator.removeGenerator(generator.id)
      this.renderExternalControls()
    })
  }

  setupGeneratorListListeners () {
    const addBtn = this.panel.querySelector('#addGeneratorBtn')
    if (!addBtn || !this.midiGenerator) return

    addBtn.addEventListener('click', () => {
      if (!this.midiGenerator.canAddGenerator()) return
      this.midiGenerator.addGenerator()
      this.renderExternalControls()
    })
  }

  async getMidiDeviceOptions () {
    const options = { 'No device': '' }
    if (!this.midiManager) return options
    try {
      const devices = await this.midiManager.getAvailableOutputDevices()
      devices.forEach(d => { options[d.name] = d.id ?? d.name })
    } catch (e) {
      console.warn('ExternalSystemsUIManager: could not get MIDI devices', e)
    }
    return options
  }

  trigger (action, data) {
    this.panel.dispatchEvent(new CustomEvent('externalControlChange', {
      detail: { action, data }
    }))
  }
}
