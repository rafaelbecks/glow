/**
 * Live luminode preview for the Luminode Center.
 * Reuses CanvasDrawer; isolates draw errors so the main app stays up.
 * Note source: MIDI generator tracks when active, otherwise sample notes.
 */
import { CanvasDrawer } from '../canvas-drawer.js'
import { compileLuminodeSource } from './runtime.js'

const SAMPLE_NOTES = [
  { midi: 60, velocity: 0.75 },
  { midi: 64, velocity: 0.65 },
  { midi: 67, velocity: 0.55 }
]

export class LuminodePreview {
  constructor (canvas) {
    this.canvas = canvas
    this.drawer = null
    this.instance = null
    this.lastValidSource = null
    this.lastError = null
    this.rafId = null
    this.running = false
    this.startTime = 0
    this.virtualSize = 480
    this.onError = null
    this.onOk = null
    this.onNoteSourceChange = null
    /** @type {null | (() => { notes: Array, source: 'midi' | 'sample' })} */
    this.noteProvider = null
    this.lastNoteSource = null
  }

  setCallbacks ({ onError, onOk, onNoteSourceChange } = {}) {
    this.onError = onError || null
    this.onOk = onOk || null
    this.onNoteSourceChange = onNoteSourceChange || null
  }

  /**
   * @param {null | (() => { notes: Array, source: 'midi' | 'sample' })} provider
   */
  setNoteProvider (provider) {
    this.noteProvider = provider
  }

  initDrawer () {
    if (!this.canvas) return
    const size = this.canvas.width || 360
    this.canvas.width = size
    this.canvas.height = size
    this.drawer = new CanvasDrawer(this.canvas)
    this.drawer.width = this.virtualSize
    this.drawer.height = this.virtualSize
  }

  resolveNotes () {
    if (typeof this.noteProvider === 'function') {
      try {
        const result = this.noteProvider()
        if (result && Array.isArray(result.notes)) {
          return {
            notes: result.notes,
            source: result.source === 'midi' ? 'midi' : 'sample'
          }
        }
      } catch (_) {}
    }
    return {
      notes: SAMPLE_NOTES.map((n) => ({
        ...n,
        timestamp: this.startTime || performance.now()
      })),
      source: 'sample'
    }
  }

  /**
   * Compile and swap instance when source is valid.
   * On failure, keep last valid instance and report error.
   * @param {string} source
   * @param {{ module?: object }} [options]
   */
  updateSource (source, options = {}) {
    const compiled = compileLuminodeSource(source, { module: options.module })
    if (!compiled.ok) {
      this.lastError = compiled.error
      if (this.onError) this.onError(compiled.error)
      return false
    }

    try {
      if (!this.drawer) this.initDrawer()
      const instance = new compiled.Class(this.drawer)
      this.safeDraw(instance, 0.5)
      this.instance = instance
      this.lastValidSource = source
      this.lastError = null
      if (this.onOk) this.onOk()
      return true
    } catch (error) {
      this.lastError = error
      if (this.onError) this.onError(error)
      return false
    }
  }

  safeDraw (instance, t) {
    if (!instance || !this.drawer) return
    const ctx = this.drawer.getContext()
    const size = this.canvas.width
    const scale = size / this.virtualSize

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, size, size)

    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.scale(scale, scale)
    ctx.translate(-this.virtualSize / 2, -this.virtualSize / 2)

    const { notes, source } = this.resolveNotes()
    if (source !== this.lastNoteSource) {
      this.lastNoteSource = source
      if (this.onNoteSourceChange) this.onNoteSourceChange(source)
    }

    try {
      instance.draw(t, notes, { x: 0, y: 0, rotation: 0 })
    } catch (err) {
      ctx.restore()
      throw err
    }

    ctx.restore()
  }

  start () {
    if (this.running) return
    this.running = true
    this.startTime = performance.now()
    const tick = (now) => {
      if (!this.running) return
      const t = (now - this.startTime) / 1000
      if (this.instance) {
        try {
          this.safeDraw(this.instance, t)
        } catch (error) {
          this.lastError = error
          if (this.onError) this.onError(error)
        }
      }
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  stop () {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  dispose () {
    this.stop()
    this.instance = null
    this.drawer = null
  }
}

/**
 * Build a note provider that prefers live MIDI generator notes.
 * @param {{ midiManager?: object, midiGenerator?: object }} hooks
 */
export function createPreviewNoteProvider (hooks = {}) {
  return () => {
    const { midiManager, midiGenerator } = hooks
    if (midiManager && midiGenerator) {
      const gens = midiGenerator
        .getGenerators()
        .filter((g) => g.enabled)
      if (gens.length > 0) {
        for (const g of gens) {
          const list = midiManager.activeNotesByTrack?.[g.trackId]
          if (list && list.length > 0) {
            return {
              source: 'midi',
              notes: list.map((n) => ({ ...n }))
            }
          }
        }
        // Generators active but currently silent — empty list (debug-accurate)
        return { source: 'midi', notes: [] }
      }
    }

    return {
      source: 'sample',
      notes: SAMPLE_NOTES.map((n) => ({
        ...n,
        timestamp: performance.now()
      }))
    }
  }
}
