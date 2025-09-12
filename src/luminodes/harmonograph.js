// Harmonograph drawing module
import { SETTINGS, UTILS } from '../settings.js'

export class HarmonographLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
  }

  draw (t, notes) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    this.ctx.save()
    this.ctx.translate(this.dimensions.width / 2, this.dimensions.height / 2)

    notes.forEach((note, idx) => {
      const midi = note.midi
      const velocity = note.velocity || 0
      const velocityScale = 1 + velocity * SETTINGS.MODULES.HARMONOGRAPH.VELOCITY_SCALE

      const A1 = (SETTINGS.MODULES.HARMONOGRAPH.BASE_AMPLITUDE + Math.sin(t * 0.3 + idx) * SETTINGS.MODULES.HARMONOGRAPH.AMPLITUDE_VARIATION) * velocityScale
      const A2 = (SETTINGS.MODULES.HARMONOGRAPH.BASE_AMPLITUDE + Math.cos(t * 0.2 + idx * 2) * SETTINGS.MODULES.HARMONOGRAPH.AMPLITUDE_VARIATION) * velocityScale

      const f1 = midi * 0.03 + 0.01 * Math.sin(t + idx)
      const f2 = midi * 0.025 + 0.01 * Math.cos(t + idx * 1.3)
      const p1 = idx * Math.PI / 4
      const p2 = idx * Math.PI / 3
      const d1 = 0.001 + 0.0005 * Math.sin(t * 0.5 + idx)
      const d2 = 0.001 + 0.0005 * Math.cos(t * 0.3 + idx)

      this.ctx.beginPath()
      for (let i = 0; i < SETTINGS.MODULES.HARMONOGRAPH.ITERATIONS; i++) {
        const time = i * SETTINGS.MODULES.HARMONOGRAPH.TIME_STEP + t * 0.2
        const x = A1 * Math.sin(f1 * time + p1) * Math.exp(-d1 * time)
        const y = A2 * Math.sin(f2 * time + p2) * Math.exp(-d2 * time)
        this.ctx.lineTo(x, y)
      }

      const hue = (midi % 12) * 30
      this.ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.4)`
      this.ctx.shadowColor = this.ctx.strokeStyle
      this.ctx.shadowBlur = SETTINGS.MODULES.HARMONOGRAPH.SHADOW_BLUR
      this.ctx.lineWidth = 1
      this.ctx.stroke()
    })

    this.ctx.restore()
  }
}
