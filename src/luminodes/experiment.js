// Experiment — Whitney lines with tan projection
import { SETTINGS, UTILS } from '../settings.js'

export class ExperimentLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const notesToUse = notes.map(n => n.midi)
    const r = SETTINGS.MODULES.EXPERIMENT.RADIUS
    const totalLines = notesToUse.length * SETTINGS.MODULES.EXPERIMENT.LINES_PER_NOTE

    this.canvasDrawer.applyLayoutTransform(layout)

    for (let i = 0; i < totalLines; i++) {
      const angle = t * SETTINGS.MODULES.EXPERIMENT.ROTATION_SPEED + i * (Math.PI * 2 / totalLines)
      const x = Math.tan(angle) * r
      const y = Math.sin(angle) * r

      this.ctx.beginPath()
      this.ctx.moveTo(0, 0)

      if (SETTINGS.MODULES.EXPERIMENT.HORIZONTAL) {
        this.ctx.lineTo(x, y)
      } else {
        this.ctx.lineTo(y, x)
      }

      if (SETTINGS.MODULES.EXPERIMENT.USE_COLOR) {
        const note = notesToUse[i % notesToUse.length]
        this.ctx.strokeStyle = UTILS.pitchToColor(note)
        this.ctx.shadowColor = this.ctx.strokeStyle
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
        this.ctx.shadowColor = 'white'
      }

      this.ctx.lineWidth = SETTINGS.MODULES.EXPERIMENT.LINE_WIDTH
      this.ctx.shadowBlur = SETTINGS.MODULES.EXPERIMENT.SHADOW_BLUR
      this.ctx.stroke()
    }

    this.canvasDrawer.restoreLayoutTransform()
  }
}
