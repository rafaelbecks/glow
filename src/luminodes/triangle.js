// Triangle drawing module
import { SETTINGS, UTILS } from '../settings.js'

export class TriangleLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
  }

  draw (t, notes, type = 'triangle', radiusScale = 1, spread = 300) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    notes.forEach(({ midi, velocity, timestamp }) => {
      const progress = (t - timestamp) / 1000
      if (progress > 2) return

      const angle = midi * 0.3 + progress * SETTINGS.MODULES.TRIANGLE.ROTATION_SPEED * 2
      const radius = radiusScale * (velocity + 0.5) * spread

      const offsetX = this.dimensions.width * 0.25
      const offsetY = this.dimensions.height * 0.25

      const baseX = Math.cos(angle) * radius
      const baseY = Math.sin(angle) * radius * 0.5

      const x = baseX + offsetX
      const y = baseY + offsetY
      const color = UTILS.pitchToColor(midi)

      if (type === 'triangle') {
        const size = (SETTINGS.MODULES.TRIANGLE.SIZE + velocity * 12) * 0.25
        const rotation = t + midi * 0.2
        const opacity = SETTINGS.MODULES.TRIANGLE.OPACITY
        
        this.ctx.save()
        this.ctx.globalAlpha = opacity
        this.canvasDrawer.drawOutlinedRotatingTriangle(x, y, size, rotation, color)
        this.canvasDrawer.drawOutlinedRotatingTriangle(this.dimensions.width - x, this.dimensions.height - y, size, rotation, color)
        this.ctx.restore()
      }
    })
  }
}
