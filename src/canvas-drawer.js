// Canvas drawing operations and utilities
import { SETTINGS } from './settings.js'

export class CanvasDrawer {
  constructor (canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.width = canvas.width
    this.height = canvas.height
  }

  resize () {
    this.width = this.canvas.width = window.innerWidth
    this.height = this.canvas.height = window.innerHeight
  }

  clear () {
    // Use background color if set, otherwise use black with clear alpha
    if (SETTINGS.CANVAS.BACKGROUND_COLOR && SETTINGS.CANVAS.BACKGROUND_COLOR !== '#000') {
      // For non-black backgrounds, use the background color with clear alpha
      const bgColor = SETTINGS.CANVAS.BACKGROUND_COLOR
      const r = parseInt(bgColor.slice(1, 3), 16)
      const g = parseInt(bgColor.slice(3, 5), 16)
      const b = parseInt(bgColor.slice(5, 7), 16)
      this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${SETTINGS.CANVAS.CLEAR_ALPHA})`
    } else {
      // Default black with clear alpha
      this.ctx.fillStyle = `rgba(0, 0, 0, ${SETTINGS.CANVAS.CLEAR_ALPHA})`
    }
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  setClearAlpha (alpha) {
    SETTINGS.CANVAS.CLEAR_ALPHA = alpha
  }

  setBackgroundColor (color) {
    SETTINGS.CANVAS.BACKGROUND_COLOR = color
    // Apply background color immediately to canvas
    this.ctx.fillStyle = color
    this.ctx.fillRect(0, 0, this.width, this.height)
    // Also update the body background color
    document.body.style.backgroundColor = color
  }

  // Utility drawing functions
  drawOutlinedRotatingTriangle (x, y, size, angle, color) {
    this.ctx.save()
    this.ctx.translate(x, y)
    this.ctx.rotate(angle)
    this.ctx.beginPath()
    this.ctx.moveTo(0, -size)
    this.ctx.lineTo(size * 0.866, size * 0.5)
    this.ctx.lineTo(-size * 0.866, size * 0.5)
    this.ctx.closePath()
    this.ctx.strokeStyle = color
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = 20
    this.ctx.lineWidth = 2
    this.ctx.stroke()
    this.ctx.restore()
  }

  // Generic polygon drawing function for geometric pencil mode
  drawOutlinedRotatingPolygon (x, y, size, angle, color, sides = 3) {
    this.ctx.save()
    this.ctx.translate(x, y)
    this.ctx.rotate(angle)
    this.ctx.beginPath()

    // Calculate polygon vertices
    const angleStep = (Math.PI * 2) / sides
    for (let i = 0; i < sides; i++) {
      const vertexAngle = i * angleStep - Math.PI / 2 // Start from top
      const vx = Math.cos(vertexAngle) * size
      const vy = Math.sin(vertexAngle) * size

      if (i === 0) {
        this.ctx.moveTo(vx, vy)
      } else {
        this.ctx.lineTo(vx, vy)
      }
    }

    this.ctx.closePath()
    this.ctx.strokeStyle = color
    this.ctx.shadowColor = color
    this.ctx.lineWidth = 1
    this.ctx.stroke()
    this.ctx.restore()
  }

  drawStripedSquare (x, y, size, angleDeg, bgColor) {
    const stripeWidth = 4
    const angle = angleDeg * Math.PI / 180

    // Diagonal of the square = size * sqrt(2)
    const paddedSize = Math.ceil(size * Math.SQRT2)

    const patternCanvas = document.createElement('canvas')
    patternCanvas.width = paddedSize
    patternCanvas.height = paddedSize
    const pctx = patternCanvas.getContext('2d')

    // Fill with background color
    pctx.fillStyle = bgColor
    pctx.fillRect(0, 0, paddedSize, paddedSize)

    // Erase diagonal stripes
    pctx.globalCompositeOperation = 'destination-out'
    pctx.save()
    pctx.translate(paddedSize / 2, paddedSize / 2)
    pctx.rotate(angle)
    pctx.translate(-paddedSize / 2, -paddedSize / 2)

    for (let i = -paddedSize; i < paddedSize * 2; i += stripeWidth * 2) {
      pctx.fillRect(i, 0, stripeWidth, paddedSize)
    }

    pctx.restore()
    pctx.globalCompositeOperation = 'source-over'

    // Draw the central square portion, rotated
    this.ctx.save()
    this.ctx.translate(x + size / 2, y + size / 2) // center of square
    this.ctx.rotate(angle)

    // Clip to the visible square
    this.ctx.beginPath()
    this.ctx.rect(-size / 2, -size / 2, size, size)
    this.ctx.clip()

    // Draw pattern, centered
    this.ctx.drawImage(
      patternCanvas,
      -paddedSize / 2,
      -paddedSize / 2,
      paddedSize,
      paddedSize
    )

    this.ctx.restore()
  }

  drawWobblyRect (x, y, size, color) {
    const wobble = 3
    this.ctx.beginPath()
    this.ctx.moveTo(x + Math.random() * wobble, y + Math.random() * wobble)
    for (let i = 0; i < 4; i++) {
      const angle = Math.PI / 2 * i
      const dx = Math.cos(angle) * size + Math.random() * wobble
      const dy = Math.sin(angle) * size + Math.random() * wobble
      this.ctx.lineTo(x + dx, y + dy)
    }
    this.ctx.closePath()
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 1.5 + Math.random()
    this.ctx.stroke()
  }

  drawWobblyContour (shape, t) {
    shape.layers.forEach((layer, idx) => {
      const { radius, jitter, sides } = layer
      const angleStep = (Math.PI * 2) / sides
      this.ctx.beginPath()

      for (let i = 0; i <= sides; i++) {
        const angle = angleStep * i + shape.baseAngle
        const r = radius + (Math.random() - 0.5) * jitter
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r
        if (i === 0) this.ctx.moveTo(x, y)
        else this.ctx.lineTo(x, y)
      }

      this.ctx.closePath()
      this.ctx.strokeStyle = shape.color
      this.ctx.lineWidth = 2
      this.ctx.shadowBlur = 10
      this.ctx.shadowColor = shape.color
      this.ctx.stroke()
    })
  }

  // Square overlap checking
  checkOverlap (square1, square2) {
    return !(square1.x + square1.size <= square2.x ||
             square1.x >= square2.x + square2.size ||
             square1.y + square1.size <= square2.y ||
             square1.y >= square2.y + square2.size)
  }

  // Get canvas context for direct drawing operations
  getContext () {
    return this.ctx
  }

  // Get canvas dimensions
  getDimensions () {
    return { width: this.width, height: this.height }
  }

  // Layout positioning utility
  // Usage in luminodes:
  // 1. Call this.canvasDrawer.applyLayoutTransform(layout) at the start of drawing
  // 2. Draw your luminode content (it will be positioned and rotated automatically)
  // 3. Call this.canvasDrawer.restoreLayoutTransform() at the end
  applyLayoutTransform (layout = { x: 0, y: 0, rotation: 0 }) {
    this.ctx.save()
    this.ctx.translate(
      this.width / 2 + layout.x,
      this.height / 2 + layout.y
    )
    this.ctx.rotate(layout.rotation * Math.PI / 180)
  }

  // Restore layout transform
  restoreLayoutTransform () {
    this.ctx.restore()
  }
}
