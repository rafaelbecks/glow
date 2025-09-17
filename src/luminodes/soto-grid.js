// Soto grid drawing module
import { SETTINGS } from '../settings.js'

export class SotoGridLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.existingSquares = new Map()
    this.sotoSolidTop = Math.random() < 0.5
  }

  draw (t, notes, stripedMode = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const stripeWidth = SETTINGS.MODULES.SOTO_GRID.STRIPE_WIDTH
    const stripeCount = Math.ceil(this.dimensions.width / stripeWidth)

    this.canvasDrawer.applyLayoutTransform(layout)
    this.ctx.translate(-this.dimensions.width / 2, -this.dimensions.height / 2)

    const solidHeight = this.dimensions.height * SETTINGS.MODULES.SOTO_GRID.SOLID_HEIGHT_RATIO
    const solidY = this.sotoSolidTop ? 0 : this.dimensions.height - solidHeight

    // Draw vertical stripes
    for (let i = 0; i < stripeCount; i += 2) {
      const x = i * stripeWidth
      const offset = Math.sin(t * 0.5 + i * 0.2) * 3

      this.ctx.beginPath()
      this.ctx.strokeStyle = 'white'
      this.ctx.lineWidth = stripeWidth * 0.5
      this.ctx.moveTo(x + offset, 0)
      this.ctx.lineTo(x + offset, this.dimensions.height)
      this.ctx.stroke()
    }

    // Draw solid block
    this.ctx.fillStyle = '#efe5da'
    this.ctx.fillRect(0, solidY, this.dimensions.width, solidHeight)

    // Draw squares
    const squares = this.generateSotoSquares(notes, stripedMode)
    squares.forEach(({ x, y, size, color, angle }) => {
      if (!stripedMode) {
        this.ctx.fillStyle = color
        this.ctx.fillRect(x, y, size, size)
      } else {
        this.canvasDrawer.drawStripedSquare(x, y, size, angle, color)
      }
    })

    this.canvasDrawer.restoreLayoutTransform()
  }

  generateSotoSquares (notes, stripedMode = false) {
    const baseSize = SETTINGS.MODULES.SOTO_GRID.BASE_SIZE
    const squares = []

    notes.forEach(({ midi, velocity }) => {
      if (!this.existingSquares.has(midi)) {
        const size = baseSize * (1 + velocity * SETTINGS.MODULES.SOTO_GRID.VELOCITY_MULTIPLIER)
        let x, y, overlap
        let retries = 100

        do {
          overlap = false
          x = Math.random() * (this.dimensions.width - size)
          y = Math.random() * (this.dimensions.height - size)

          for (const s of this.existingSquares.values()) {
            if (this.canvasDrawer.checkOverlap({ x, y, size }, s)) {
              overlap = true
              break
            }
          }

          retries--
          if (retries <= 0) break
        } while (overlap)

        const color = SETTINGS.COLORS.SOTO_PALETTE[midi % SETTINGS.COLORS.SOTO_PALETTE.length]
        const angle = stripedMode ? (Math.random() > 0.5 ? 35 : -35) : 0

        this.existingSquares.set(midi, { x, y, size, color, angle })
      }

      // Always get the current color from palette for existing squares
      const existingSquare = this.existingSquares.get(midi)
      if (existingSquare) {
        const currentColor = SETTINGS.COLORS.SOTO_PALETTE[midi % SETTINGS.COLORS.SOTO_PALETTE.length]
        squares.push({ ...existingSquare, color: currentColor })
      }
    })

    return squares
  }

  clearSquares () {
    this.existingSquares.clear()
  }

  removeSquare (midi) {
    this.existingSquares.delete(midi)
  }
}
