// Phyllotaxis drawing module
import { SETTINGS, UTILS } from '../settings.js'

export class PhyllotaxisLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
  }

  draw (t, notes, dotsPerNote = SETTINGS.MODULES.PHYLLOTAXIS.DOTS_PER_NOTE, layout = { x: 0, y: 0, rotation: 0 }) {
    if (!notes || notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const goldenAngle = SETTINGS.MODULES.PHYLLOTAXIS.GOLDEN_ANGLE

    const scale = SETTINGS.MODULES.PHYLLOTAXIS.SCALE
    const baseSize = SETTINGS.MODULES.PHYLLOTAXIS.BASE_SIZE
    const maxSize = SETTINGS.MODULES.PHYLLOTAXIS.MAX_SIZE
    const rotationSpeed = SETTINGS.MODULES.PHYLLOTAXIS.ROTATION_SPEED

    this.canvasDrawer.applyLayoutTransform(layout)
    this.ctx.rotate(t * rotationSpeed)

    const totalDots = notes.length * dotsPerNote

    notes.forEach((note, noteIndex) => {
      for (let j = 0; j < dotsPerNote; j++) {
        const i = noteIndex * dotsPerNote + j
        const angle = i * goldenAngle
        const radius = scale * Math.sqrt(i + 1)
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        const size = baseSize + (i / totalDots) * (maxSize - baseSize)
        this.ctx.beginPath()
        this.ctx.fillStyle = UTILS.pitchToColor(note.midi)
        this.ctx.arc(x, y, size, 0, Math.PI * 2)
        this.ctx.fill()
      }
    })

    this.canvasDrawer.restoreLayoutTransform()
  }
}
