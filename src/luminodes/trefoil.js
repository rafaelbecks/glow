// Trefoil knot - 3D wireframe trefoil knot with deformation
import { SETTINGS, UTILS } from '../settings.js'

export class TrefoilKnotLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lastChordSignature = ''
    this.currentBaseHue = Math.floor(Math.random() * 360)
  }

  // Generate trefoil knot points using parametric equations
  // x = sin(t) + 2*sin(2t)
  // y = cos(t) - 2*cos(2t)
  // z = -sin(3t)
  generateTrefoilPoints (segments, scale = 1.0) {
    const points = []

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2

      const x = (Math.sin(t) + 2 * Math.sin(2 * t)) * scale
      const y = (Math.cos(t) - 2 * Math.cos(2 * t)) * scale
      const z = -Math.sin(3 * t) * scale

      points.push({ x, y, z, t })
    }

    return points
  }

  // Apply deformation based on active notes
  applyDeformation (points, notes, deformationStrength, t) {
    if (notes.length === 0) return points

    const deformed = points.map(point => ({ ...point }))

    notes.forEach((note, index) => {
      const velocity = note.velocity || 64
      const midi = note.midi || 60

      const waveStrength = (velocity / 127) * deformationStrength
      const waveFreq = (midi / 127) * 0.1 + 0.05
      const waveSpeed = (midi / 127) * 0.3 + 0.1

      deformed.forEach(point => {
        // Create multiple wave patterns along the curve
        const wave1 = Math.sin(point.t * waveFreq + t * waveSpeed) * waveStrength
        const wave2 = Math.sin(point.t * waveFreq * 2 + t * waveSpeed * 1.2) * waveStrength * 0.6
        const wave3 = Math.sin(point.x * waveFreq * 0.5 + point.y * waveFreq * 0.3 + t * waveSpeed * 0.8) * waveStrength * 0.4

        const totalWave = (wave1 + wave2 + wave3) * 0.3

        // Deform the point in all dimensions
        const scale = 1 + totalWave
        point.x *= scale
        point.y *= scale
        point.z *= scale
      })
    })

    return deformed
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const { width, height } = this.dimensions
    const segments = SETTINGS.MODULES.TREFOIL.SEGMENTS
    // Ensure NODE_MODE is properly read as boolean
    const nodeMode = Boolean(SETTINGS.MODULES.TREFOIL.NODE_MODE)
    // In node mode, number of laces equals number of notes. Otherwise, use fixed number.
    const numLaces = nodeMode ? Math.max(1, notes.length) : SETTINGS.MODULES.TREFOIL.NUM_LACES
    const baseScale = SETTINGS.MODULES.TREFOIL.SCALE
    const scaleVariation = SETTINGS.MODULES.TREFOIL.SCALE_VARIATION

    this.canvasDrawer.applyLayoutTransform(layout)

    // Create a unique signature of active MIDI notes for color changes
    const chordSig = notes.map(n => n.midi).sort().join('-')
    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    const rotationSpeed = SETTINGS.MODULES.TREFOIL.ROTATION_SPEED

    // Draw multiple laces (instances) of the trefoil knot
    for (let lace = 0; lace < numLaces; lace++) {
      // Calculate scale for this lace (each lace can have a slightly different size)
      const laceScale = baseScale * (1 + (lace / numLaces) * scaleVariation)

      // Generate trefoil points for this lace
      const basePoints = this.generateTrefoilPoints(segments, laceScale)

      // Apply deformation based on active notes
      const deformationStrength = SETTINGS.MODULES.TREFOIL.DEFORMATION_STRENGTH
      const deformedPoints = this.applyDeformation(basePoints, notes, deformationStrength, t)

      // Set up drawing context for this lace (different colors for different laces when using color mode)
      const baseHue = this.currentBaseHue + t * 2
      if (useColor) {
        // Use pitch-based color with variation for different laces
        const midiValue = notes.length > 0 ? notes[0].midi + lace * 3 : 60
        this.ctx.strokeStyle = UTILS.pitchToColor(midiValue)
        this.ctx.shadowColor = this.ctx.strokeStyle
      } else {
        // Use different hues for different laces in grayscale mode
        const laceHue = (baseHue + lace * 30) % 360
        this.ctx.strokeStyle = `hsla(${laceHue}, 0%, 80%, 0.4)`
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
      }

      this.ctx.lineWidth = SETTINGS.MODULES.TREFOIL.LINE_WIDTH

      // Draw the trefoil knot curve
      this.ctx.beginPath()
      for (let i = 0; i < deformedPoints.length; i++) {
        const point = deformedPoints[i]

        // Apply 3D rotation
        const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
          point.x,
          point.y,
          point.z,
          t * rotationSpeed * 0.1,
          t * rotationSpeed * 0.15
        )

        // Apply perspective projection
        const perspectiveX = rotatedX + (rotatedX / width) * rotatedZ * 0.001
        const perspectiveY = rotatedY + (rotatedY / height) * rotatedZ * 0.001 - rotatedZ * 0.3

        if (i === 0) {
          this.ctx.moveTo(perspectiveX, perspectiveY)
        } else {
          this.ctx.lineTo(perspectiveX, perspectiveY)
        }
      }
      // Close the curve
      const firstPoint = deformedPoints[0]
      const [rotatedFirstX, rotatedFirstY, rotatedFirstZ] = UTILS.rotate3D(
        firstPoint.x,
        firstPoint.y,
        firstPoint.z,
        t * rotationSpeed * 0.1,
        t * rotationSpeed * 0.15
      )
      const perspectiveFirstX = rotatedFirstX + (rotatedFirstX / width) * rotatedFirstZ * 0.001
      const perspectiveFirstY = rotatedFirstY + (rotatedFirstY / height) * rotatedFirstZ * 0.001 - rotatedFirstZ * 0.3
      this.ctx.lineTo(perspectiveFirstX, perspectiveFirstY)

      this.ctx.stroke()
    }

    this.canvasDrawer.restoreLayoutTransform()
  }
}
