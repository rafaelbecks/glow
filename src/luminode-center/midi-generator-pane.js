/**
 * Mountable Tweakpane for MIDI generators — reusable outside the side panel.
 */
import { Pane } from '../lib/tweakpane.min.js'
import { INTERVALS } from '../midi-generator.js'

export class MidiGeneratorPane {
  /**
   * @param {object} opts
   * @param {import('../midi-generator.js').MidiGenerator} opts.midiGenerator
   * @param {() => void} [opts.onChange] — called after add/remove/track change (UI rebuild)
   */
  constructor ({ midiGenerator, onChange } = {}) {
    this.midiGenerator = midiGenerator
    this.onChange = onChange || null
    this.container = null
    this.pane = null
  }

  mount (container) {
    this.dispose()
    this.container = container
    if (!container || !this.midiGenerator) return

    const generators = this.midiGenerator.getGenerators()
    const tracks = this.midiGenerator.trackManager?.getTracks?.() ?? []
    const canAdd = this.midiGenerator.canAddGenerator()

    container.innerHTML = `
      <div class="luminode-center-generator">
        <div class="luminode-center-generator-header">
          <span>MIDI Generators</span>
          <button type="button" class="btn-secondary luminode-center-generator-add" ${canAdd ? '' : 'disabled'}>
            Add
          </button>
        </div>
        ${generators.length === 0
          ? '<p class="luminode-center-generator-empty">No generators. Add one to drive the preview with live notes.</p>'
          : ''}
        <div class="luminode-center-generator-pane"></div>
      </div>
    `

    const addBtn = container.querySelector('.luminode-center-generator-add')
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (!this.midiGenerator.canAddGenerator()) return
        this.midiGenerator.addGenerator()
        this.remount()
        if (this.onChange) this.onChange()
      })
    }

    const paneHost = container.querySelector('.luminode-center-generator-pane')
    if (!paneHost || generators.length === 0) return

    this.pane = new Pane({ container: paneHost })
    this.stylePane(paneHost)

    generators.forEach((generator, index) => {
      this.createGeneratorFolder(this.pane, generator, index, tracks)
    })
  }

  remount () {
    if (this.container) this.mount(this.container)
  }

  stylePane (paneHost) {
    const apply = () => {
      const el = paneHost.querySelector('.tp-rotv')
      if (el) {
        el.style.width = '100%'
        el.style.margin = '0'
        el.style.padding = '0'
        el.style.background = 'transparent'
        el.style.border = 'none'
      } else {
        requestAnimationFrame(apply)
      }
    }
    requestAnimationFrame(apply)
  }

  createGeneratorFolder (parent, generator, index, tracks) {
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

    const folder = parent.addFolder({
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
      this.remount()
      if (this.onChange) this.onChange()
    })

    folder.addBinding(state, 'intervalMs', {
      label: 'Interval (ms)', min: 100, max: 5000, step: 50
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
      this.remount()
      if (this.onChange) this.onChange()
    })
  }

  dispose () {
    if (this.pane) {
      try {
        this.pane.dispose()
      } catch (_) {}
      this.pane = null
    }
    if (this.container) {
      this.container.innerHTML = ''
    }
  }
}
