// Lissajous drawing module
import { SETTINGS, UTILS } from '../settings.js'

export class LissajousLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
  }

  draw (t, notes) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const a = notes[0] % 7 + 1
    const b = notes[1 % notes.length] % 7 + 1
    const delta = (notes[2 % notes.length] || notes[0]) * 0.1

    this.ctx.save()
    this.ctx.translate(this.dimensions.width / 2, this.dimensions.height / 2)
    this.ctx.rotate(Math.sin(t * 0.1) * 0.3)
    this.ctx.beginPath()

    for (let i = 0; i < Math.PI * 2; i += 0.01) {
      const x = Math.sin(a * i + delta + t * 0.5) * SETTINGS.MODULES.LISSAJOUS.SCALE
      const y = Math.sin(b * i + t * 0.3) * SETTINGS.MODULES.LISSAJOUS.SCALE
      this.ctx.lineTo(x, y)
    }

    this.ctx.strokeStyle = 'hsla(' + (a + b) * 20 + ', 100%, 60%, 0.5)'
    this.ctx.shadowColor = this.ctx.strokeStyle
    this.ctx.shadowBlur = SETTINGS.MODULES.LISSAJOUS.SHADOW_BLUR
    this.ctx.lineWidth = SETTINGS.MODULES.LISSAJOUS.LINE_WIDTH
    this.ctx.stroke()
    this.ctx.restore()
  }
}
