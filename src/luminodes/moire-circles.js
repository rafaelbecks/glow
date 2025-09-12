// Moire circles drawing module
import { SETTINGS, UTILS } from '../settings.js'

export class MoireCirclesLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
  }

  draw (t, notes) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const baseCount = SETTINGS.MODULES.MOIRE_CIRCLES.BASE_COUNT
    const spacing = SETTINGS.MODULES.MOIRE_CIRCLES.SPACING
    const speed = SETTINGS.MODULES.MOIRE_CIRCLES.SPEED

    this.ctx.save()
    this.ctx.translate(this.dimensions.width / 2, this.dimensions.height / 2)

    notes.forEach((n, i) => {
      const midi = n.midi
      const velocity = n.velocity || 0.5
      const angleOffset = Math.sin(t * speed * (i + 1)) * 0.4
      const circleCount = baseCount + Math.floor((midi % 6) * 1.5)
      const sizeMultiplier = 1 + velocity * 1.5
      const hue = (midi % 12) * 30

      this.ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.15)`
      this.ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.8)`
      this.ctx.shadowBlur = 15
      this.ctx.lineWidth = 1

      for (let j = 0; j < circleCount; j++) {
        const radius = j * spacing * sizeMultiplier
        this.ctx.beginPath()
        for (let a = 0; a < Math.PI * 2; a += 0.2) {
          const x = radius * Math.cos(a + angleOffset * j)
          const y = radius * Math.sin(a + angleOffset * j)
          if (j === 0 && a === 0) {
            this.ctx.moveTo(x, y)
          } else {
            this.ctx.lineTo(x, y)
          }
        }
        this.ctx.stroke()
      }
    })

    this.ctx.restore()
  }
}
