// Epitrochoid - compact epitrochoid figure luminode
// Mathematical basis: Epitrochoid/hypotrochoid curves forming bounded figures
// Each figure: rotating circles creating closed rosette patterns that grow and transform
// r(θ) = r₀ * (1 + a*cos(n*θ + φ)) - epitrochoid/hypotrochoid curves
// Figures are delimited, minimalist, and respond to MIDI input
import { SETTINGS, UTILS } from '../settings.js'

export class EpitrochoidLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
  }

  // Generate an epitrochoid point
  generateEpitrochoidPoint (angle, size, complexity, rotation, t) {
    // Base radius
    const baseR = size * 0.4

    // Epitrochoid: combination of rotating circles
    // Use epitrochoid: r = R + r * cos((R/r + 1) * θ)
    const R = baseR
    const r = baseR * (0.2 + complexity * 0.3)
    const n = Math.floor(2 + complexity * 4) // number of loops

    // Main curve
    const mainR = R + r * Math.cos(n * angle + rotation)
    const x = mainR * Math.cos(angle)
    const y = mainR * Math.sin(angle)

    // Add subtle secondary rotation for depth
    const z = size * 0.1 * Math.sin(angle * 2 + t * 0.5)

    return { x, y, z }
  }

  // Draw a single epitrochoid figure
  drawEpitrochoidFigure (note, idx, lineIdx, t, notes) {
    const midi = note.midi
    const velocity = note.velocity || 0

    // Figure size - bounded and compact
    const baseSize = SETTINGS.MODULES.EPITROCHOID.BASE_SIZE
    const size = baseSize * (0.7 + velocity * 0.6)

    // Complexity based on pitch and velocity
    const complexity = (midi / 127) * 0.8 + velocity * 0.5

    // Rotation speed
    const rotationSpeed = SETTINGS.MODULES.EPITROCHOID.ROTATION_SPEED
    const rotation = t * rotationSpeed + idx * Math.PI * 2 / notes.length + lineIdx * Math.PI / 6

    // Number of loops (curlicue complexity)
    const numLoops = Math.max(2, Math.floor(2 + complexity * 3))
    const segments = SETTINGS.MODULES.EPITROCHOID.SEGMENTS

    // Growth factor - figures grow over time
    const growthFactor = 1 + velocity * SETTINGS.MODULES.EPITROCHOID.GROWTH_RATE * Math.sin(t * 0.3)

    // Interference from other notes - subtle transformation
    let interference = 0
    if (notes.length > 1) {
      interference = notes.reduce((sum, otherNote, otherIdx) => {
        if (otherIdx === idx) return sum
        const otherMidi = otherNote.midi
        const otherVelocity = otherNote.velocity || 0
        const freq = (otherMidi / 127) * 0.1
        const amp = (otherVelocity / 127) * 0.15
        return sum + amp * Math.sin(t * freq + otherIdx * 1.3)
      }, 0)
    }

    this.ctx.beginPath()

    // Draw the epitrochoid figure
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2 * numLoops

      // Add interference for transformation
      const transformedAngle = angle + interference * 0.3

      const point = this.generateEpitrochoidPoint(
        transformedAngle,
        size * growthFactor,
        complexity,
        rotation,
        t
      )

      let finalX, finalY

      // Apply 3D rotation if enabled
      if (SETTINGS.MODULES.EPITROCHOID.USE_3D_ROTATION) {
        const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
          point.x,
          point.y,
          point.z,
          t * rotationSpeed * 0.05,
          t * rotationSpeed * 0.08
        )

        // Perspective projection
        const { width, height } = this.dimensions
        finalX = rotatedX + (rotatedX / width) * rotatedZ * 0.001
        finalY = rotatedY + (rotatedY / height) * rotatedZ * 0.001 - rotatedZ * SETTINGS.MODULES.EPITROCHOID.DEPTH_PROJECTION
      } else {
        // Classic 2D rendering
        finalX = point.x
        finalY = point.y
      }

      if (i === 0) {
        this.ctx.moveTo(finalX, finalY)
      } else {
        this.ctx.lineTo(finalX, finalY)
      }
    }

    // Close the figure
    this.ctx.closePath()

    // Styling
    if (SETTINGS.MODULES.EPITROCHOID.USE_COLOR) {
      this.ctx.strokeStyle = UTILS.pitchToColor(midi)
    } else {
      const alpha = 0.5 + velocity * 0.3
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
    }

    this.ctx.shadowColor = this.ctx.strokeStyle
    this.ctx.lineWidth = SETTINGS.MODULES.EPITROCHOID.LINE_WIDTH
    this.ctx.stroke()
  }

  draw (t, notes, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    this.dimensions = this.canvasDrawer.getDimensions()

    this.canvasDrawer.applyLayoutTransform(layout)

    const linesPerNote = SETTINGS.MODULES.EPITROCHOID.LINES_PER_NOTE

    // Draw multiple figures per note based on linesPerNote
    notes.forEach((note, idx) => {
      for (let lineIdx = 0; lineIdx < linesPerNote; lineIdx++) {
        this.drawEpitrochoidFigure(note, idx, lineIdx, t, notes)
      }
    })

    this.canvasDrawer.restoreLayoutTransform()
  }
}

