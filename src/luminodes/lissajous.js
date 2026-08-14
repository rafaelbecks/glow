// Lissajous drawing module
import { SETTINGS, UTILS } from '../settings.js'

export class LissajousLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
  }

  noteMidi (note, fallback = 60) {
    if (typeof note === 'number') return note
    return note?.midi ?? fallback
  }

  draw (t, notes, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const midis = notes.map((n) => this.noteMidi(n))
    const a = midis[0] % 7 + 1
    const b = midis[1 % midis.length] % 7 + 1
    const delta = (midis[2 % midis.length] || midis[0]) * 0.1

    this.canvasDrawer.applyLayoutTransform(layout)
    this.ctx.rotate(Math.sin(t * 0.1) * 0.3)
    this.ctx.beginPath()

    for (let i = 0; i < Math.PI * 2; i += 0.01) {
      const x = Math.sin(a * i + delta + t * 0.5) * SETTINGS.MODULES.LISSAJOUS.SCALE
      const y = Math.sin(b * i + t * 0.3) * SETTINGS.MODULES.LISSAJOUS.SCALE
      this.ctx.lineTo(x, y)
    }

    const midiValue = midis[0]
    this.ctx.strokeStyle = UTILS.pitchToColor(midiValue)
    this.ctx.shadowColor = this.ctx.strokeStyle
    this.ctx.shadowBlur = SETTINGS.MODULES.LISSAJOUS.SHADOW_BLUR
    this.ctx.lineWidth = SETTINGS.MODULES.LISSAJOUS.LINE_WIDTH
    this.ctx.stroke()
    this.canvasDrawer.restoreLayoutTransform()
  }
}
