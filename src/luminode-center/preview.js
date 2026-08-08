/**
 * Live luminode preview for the Luminode Lab.
 * Reuses CanvasDrawer; isolates draw errors so the main app stays up.
 *
 * Rules:
 * - Invalid compile / smoke-draw: do not touch the live instance or canvas.
 * - Valid update: dispose previous instance, reset surface, start clean.
 */
import { CanvasDrawer } from '../canvas-drawer.js'
import { compileLuminodeSource } from './runtime.js'

const SAMPLE_NOTES = [
  { midi: 60, velocity: 0.75 },
  { midi: 64, velocity: 0.65 },
  { midi: 67, velocity: 0.55 }
]

const PREVIEW_BITMAP = 360

export class LuminodePreview {
  constructor (canvas) {
    this.canvas = canvas
    this.drawer = null
    this.instance = null
    this.lastValidSource = null
    this.lastValidModule = null
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
    this.drawFailed = false
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

  resetSurface () {
    if (!this.canvas) return
    // Resetting width/height clears the bitmap and drops any stale transform state
    this.canvas.width = PREVIEW_BITMAP
    this.canvas.height = PREVIEW_BITMAP
    this.drawer = new CanvasDrawer(this.canvas)
    this.drawer.width = this.virtualSize
    this.drawer.height = this.virtualSize
    const ctx = this.drawer.getContext()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, PREVIEW_BITMAP, PREVIEW_BITMAP)
  }

  initDrawer () {
    this.resetSurface()
  }

  disposeInstance (instance) {
    if (!instance) return
    try {
      if (typeof instance.dispose === 'function') {
        instance.dispose()
      }
    } catch (_) {}
    try {
      if (instance.gl) {
        const ext = instance.gl.getExtension('WEBGL_lose_context')
        if (ext) ext.loseContext()
      }
    } catch (_) {}
    try {
      if (instance.offscreen && instance.offscreen !== this.canvas) {
        instance.offscreen.width = 0
        instance.offscreen.height = 0
      }
    } catch (_) {}
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
   * Compile and swap instance only when source is valid.
   * On failure, leave the current preview untouched.
   * @param {string} source
   * @param {{ module?: object }} [options]
   */
  updateSource (source, options = {}) {
    const module = options.module && typeof options.module === 'object'
      ? options.module
      : {}

    const compiled = compileLuminodeSource(source, { module })
    if (!compiled.ok) {
      this.lastError = compiled.error
      if (this.onError) this.onError(compiled.error)
      return false
    }

    // Build candidate against a temporary surface so failures never touch the live canvas
    let candidate = null
    let tempCanvas = null
    let tempDrawer = null
    try {
      tempCanvas = document.createElement('canvas')
      tempCanvas.width = PREVIEW_BITMAP
      tempCanvas.height = PREVIEW_BITMAP
      tempDrawer = new CanvasDrawer(tempCanvas)
      tempDrawer.width = this.virtualSize
      tempDrawer.height = this.virtualSize

      candidate = new compiled.Class(tempDrawer)
      this.smokeDraw(candidate, tempDrawer, tempCanvas, 0.5)

      // Success — swap cleanly onto the live preview
      this.disposeInstance(this.instance)
      this.resetSurface()

      // Rebuild on the live drawer so the instance's ctx/dimensions match preview
      this.disposeInstance(candidate)
      candidate = null
      const live = new compiled.Class(this.drawer)
      this.smokeDraw(live, this.drawer, this.canvas, 0.5)

      this.instance = live
      this.lastValidSource = source
      this.lastValidModule = module
      this.lastError = null
      this.drawFailed = false
      this.startTime = performance.now()
      if (this.onOk) this.onOk()
      return true
    } catch (error) {
      this.disposeInstance(candidate)
      // Live instance + canvas unchanged
      this.lastError = error
      if (this.onError) this.onError(error)
      return false
    } finally {
      if (tempCanvas) {
        tempCanvas.width = 0
        tempCanvas.height = 0
      }
    }
  }

  smokeDraw (instance, drawer, canvas, t) {
    const ctx = drawer.getContext()
    const size = canvas.width
    const scale = size / this.virtualSize

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, size, size)

    ctx.save()
    ctx.translate(size / 2, size / 2)
    ctx.scale(scale, scale)
    ctx.translate(-this.virtualSize / 2, -this.virtualSize / 2)

    try {
      const notes = SAMPLE_NOTES.map((n) => ({
        ...n,
        timestamp: performance.now()
      }))
      instance.draw(t, notes, { x: 0, y: 0, rotation: 0 })
    } finally {
      ctx.restore()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
    }
  }

  safeDraw (instance, t) {
    if (!instance || !this.drawer) return
    const ctx = this.drawer.getContext()
    const size = this.canvas.width
    const scale = size / this.virtualSize

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
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
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      throw err
    }

    ctx.restore()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
  }

  /**
   * Runtime draw blew up — stop using the broken instance; leave canvas as-is.
   * A successful updateSource() clears drawFailed and swaps in a fresh instance.
   */
  recoverFromDrawError (error) {
    this.disposeInstance(this.instance)
    this.instance = null
    this.drawFailed = true
    this.lastError = error
    if (this.onError) this.onError(error)
  }

  start () {
    if (this.running) return
    this.running = true
    this.startTime = performance.now()
    const tick = (now) => {
      if (!this.running) return
      const t = (now - this.startTime) / 1000
      if (this.instance && !this.drawFailed) {
        try {
          this.safeDraw(this.instance, t)
        } catch (error) {
          this.recoverFromDrawError(error)
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
    this.disposeInstance(this.instance)
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
