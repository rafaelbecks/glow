// Square Tunnel - concentric squares/rectangles creating a tunnel effect
import { SETTINGS, UTILS } from '../settings.js'

export class SquareTunnelLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lastChordSignature = ''
    this.currentBaseHue = Math.floor(Math.random() * 360)
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    this.dimensions = this.canvasDrawer.getDimensions()
    const { width, height } = this.dimensions

    const m = SETTINGS.MODULES.SQUARE_TUNNEL
    const lineWidth = m.LINE_WIDTH
    const animSpeed = m.ANIMATION_SPEED // signed: positive=forward, negative=backward
    const rotationAngle = m.ROTATION_ANGLE // degrees, static tilt
    const rotationSpeed = m.ROTATION_SPEED // auto-rotation speed
    const scale = m.SCALE
    const aspectRatio = m.ASPECT_RATIO
    const linesPerNoteEnabled = m.LINES_PER_NOTE_ENABLED
    const linesPerNote = m.LINES_PER_NOTE
    const fixedCount = m.FIXED_LINE_COUNT
    const usePerspective = m.PERSPECTIVE
    const shadowBlur = m.SHADOW_BLUR

    // Number of squares to draw
    const lineCount = linesPerNoteEnabled
      ? Math.max(3, notes.length * linesPerNote)
      : fixedCount

    // Color chord signature for hue cycling
    const chordSig = notes.map(n => n.midi).sort().join('-')
    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    this.canvasDrawer.applyLayoutTransform(layout)

    // Animation offset: continuous 0..1 loop
    const animOffset = ((t * animSpeed * 0.1) % 1 + 1) % 1

    // Current rotation: static angle + auto-rotation
    const currentAngle = (rotationAngle * Math.PI) / 180 + t * rotationSpeed * 0.1

    this.ctx.save()
    this.ctx.rotate(currentAngle)
    this.ctx.lineWidth = lineWidth

    if (usePerspective) {
      this._drawPerspective(notes, lineCount, animOffset, scale, aspectRatio, shadowBlur, useColor)
    } else {
      this._drawLinear(notes, lineCount, animOffset, scale, aspectRatio, shadowBlur, useColor)
    }

    this.ctx.restore()
    this.canvasDrawer.restoreLayoutTransform()
  }

  _drawLinear (notes, lineCount, animOffset, scale, aspectRatio, shadowBlur, useColor) {
    const { width, height } = this.dimensions

    // Max half-size: diagonal/2 * scale ensures coverage at any rotation
    const maxHalfSize = (Math.sqrt(width * width + height * height) / 2) * scale

    for (let i = 0; i < lineCount; i++) {
      // Normalized position 0..1 from center to edge
      const fraction = ((i / lineCount) + animOffset) % 1.0

      // Size grows linearly from center
      const halfSize = fraction * maxHalfSize
      const hw = halfSize * aspectRatio
      const hh = halfSize / aspectRatio

      if (halfSize < 1) continue

      // Inner squares glow more brightly
      const brightness = 1 - fraction * 0.8
      const alpha = brightness * 0.85 + 0.1

      this._applyColor(useColor, notes, i, fraction, alpha, shadowBlur * brightness)

      this.ctx.beginPath()
      this.ctx.rect(-hw, -hh, hw * 2, hh * 2)
      this.ctx.stroke()
    }
  }

  _drawPerspective (notes, lineCount, animOffset, scale, aspectRatio, shadowBlur, useColor) {
    const { width, height } = this.dimensions
    const focalLength = 400

    // World-space tube half-dimensions — matched to screen proportions
    const tubeHalfW = (width / 2) * scale * aspectRatio
    const tubeHalfH = (height / 2) * scale / aspectRatio

    // Z range: near (almost at camera) to far
    const zMin = focalLength * 0.1
    const zMax = focalLength * 20

    for (let i = 0; i < lineCount; i++) {
      // Fractional position: 0=near, 1=far
      const fraction = ((i / lineCount) + animOffset) % 1.0

      // Logarithmic Z for authentic perspective feel
      const z = zMin * Math.pow(zMax / zMin, fraction)
      const projScale = focalLength / z

      const hw = tubeHalfW * projScale
      const hh = tubeHalfH * projScale

      // Skip extremely large or invisible squares
      if (hw > Math.max(width, height) * 2.5 || hw < 1) continue

      // Far = transparent, near = opaque
      const alpha = (1 - fraction) * 0.85 + 0.1

      this._applyColor(useColor, notes, i, fraction, alpha, shadowBlur * (1 - fraction))

      this.ctx.beginPath()
      this.ctx.rect(-hw, -hh, hw * 2, hh * 2)
      this.ctx.stroke()
    }
  }

  _applyColor (useColor, notes, index, fraction, alpha, shadowBlurAmount) {
    if (useColor) {
      const noteIndex = index % notes.length
      const midi = notes[noteIndex]?.midi || 60
      const factor = UTILS.pitchColorFactor || 30
      const hue = (midi % 14) * factor
      const lightness = 45 + (1 - fraction) * 30
      this.ctx.strokeStyle = `hsla(${hue}, 100%, ${lightness}%, ${alpha})`
      this.ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${alpha * 0.6})`
    } else {
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
      this.ctx.shadowColor = `rgba(255, 255, 255, ${alpha * 0.5})`
    }
    this.ctx.shadowBlur = Math.max(0, shadowBlurAmount)
  }
}
