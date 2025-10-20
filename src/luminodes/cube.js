// Cube - 3D wireframe cube with configurable segments and rotation
import { SETTINGS, UTILS } from '../settings.js'

export class CubeLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lastChordSignature = ''
    this.currentBaseHue = Math.floor(Math.random() * 360)
  }

  // Generate cube wireframe points
  generateCubePoints (size, segments) {
    const points = []
    const halfSize = size / 2
    const step = size / segments

    // Generate points for all faces of the cube
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        for (let k = 0; k <= segments; k++) {
          const x = -halfSize + i * step
          const y = -halfSize + j * step
          const z = -halfSize + k * step

          points.push({ x, y, z, i, j, k })
        }
      }
    }

    return { points, segments }
  }

  // Apply deformation based on active notes
  applyDeformation (points, notes, t) {
    if (notes.length === 0) return points

    const deformed = points.map(point => ({ ...point }))

    notes.forEach((note, index) => {
      const velocity = note.velocity || 64
      const midi = note.midi || 60

      const waveStrength = (velocity / 127) * 0.3
      const waveFreq = (midi / 127) * 0.1 + 0.05
      const waveSpeed = (midi / 127) * 0.3 + 0.1

      deformed.forEach(point => {
        // Create wave patterns based on position
        const wave1 = Math.sin(point.x * waveFreq + t * waveSpeed) * waveStrength
        const wave2 = Math.sin(point.y * waveFreq + t * waveSpeed * 1.2) * waveStrength * 0.7
        const wave3 = Math.sin(point.z * waveFreq + t * waveSpeed * 0.8) * waveStrength * 0.5

        // Apply deformation
        const totalWave = (wave1 + wave2 + wave3) * 0.3
        point.x *= (1 + totalWave)
        point.y *= (1 + totalWave)
        point.z *= (1 + totalWave)
      })
    })

    return deformed
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const { width, height } = this.dimensions
    const size = SETTINGS.MODULES.CUBE.SIZE
    const segments = SETTINGS.MODULES.CUBE.SEGMENTS
    const scale = SETTINGS.MODULES.CUBE.SCALE

    this.canvasDrawer.applyLayoutTransform(layout)

    // Generate cube points
    const { points } = this.generateCubePoints(size, segments)

    // Apply deformation based on active notes
    const deformedPoints = this.applyDeformation(points, notes, t)

    // Create a unique signature of active MIDI notes for color changes
    const chordSig = notes.map(n => n.midi).sort().join('-')
    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    // Set up drawing context
    const baseHue = this.currentBaseHue + t * 2
    const hue = useColor ? (baseHue + notes.length * 15) % 360 : SETTINGS.MODULES.CUBE.BASE_HUE

    this.ctx.strokeStyle = useColor ? `hsla(${hue}, 80%, 60%, 0.4)` : `hsla(${hue}, 0%, 80%, 0.4)`
    this.ctx.shadowColor = useColor ? `hsla(${hue}, 80%, 70%, 0.5)` : 'rgba(255, 255, 255, 0.5)'
    this.ctx.lineWidth = SETTINGS.MODULES.CUBE.LINE_WIDTH

    const rotationSpeed = SETTINGS.MODULES.CUBE.ROTATION_SPEED

    // Draw horizontal lines (along X axis)
    for (let j = 0; j <= segments; j++) {
      for (let k = 0; k <= segments; k++) {
        this.ctx.beginPath()
        for (let i = 0; i <= segments; i++) {
          const point = deformedPoints[i * (segments + 1) * (segments + 1) + j * (segments + 1) + k]

          // Apply 3D rotation
          const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
            point.x * scale,
            point.y * scale,
            point.z * scale,
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
        this.ctx.stroke()
      }
    }

    // Draw vertical lines (along Y axis)
    for (let i = 0; i <= segments; i++) {
      for (let k = 0; k <= segments; k++) {
        this.ctx.beginPath()
        for (let j = 0; j <= segments; j++) {
          const point = deformedPoints[i * (segments + 1) * (segments + 1) + j * (segments + 1) + k]

          // Apply 3D rotation
          const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
            point.x * scale,
            point.y * scale,
            point.z * scale,
            t * rotationSpeed * 0.1,
            t * rotationSpeed * 0.15
          )

          // Apply perspective projection
          const perspectiveX = rotatedX + (rotatedX / width) * rotatedZ * 0.001
          const perspectiveY = rotatedY + (rotatedY / height) * rotatedZ * 0.001 - rotatedZ * 0.3

          if (j === 0) {
            this.ctx.moveTo(perspectiveX, perspectiveY)
          } else {
            this.ctx.lineTo(perspectiveX, perspectiveY)
          }
        }
        this.ctx.stroke()
      }
    }

    // Draw depth lines (along Z axis)
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        this.ctx.beginPath()
        for (let k = 0; k <= segments; k++) {
          const point = deformedPoints[i * (segments + 1) * (segments + 1) + j * (segments + 1) + k]

          // Apply 3D rotation
          const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
            point.x * scale,
            point.y * scale,
            point.z * scale,
            t * rotationSpeed * 0.1,
            t * rotationSpeed * 0.15
          )

          // Apply perspective projection
          const perspectiveX = rotatedX + (rotatedX / width) * rotatedZ * 0.001
          const perspectiveY = rotatedY + (rotatedY / height) * rotatedZ * 0.001 - rotatedZ * 0.3

          if (k === 0) {
            this.ctx.moveTo(perspectiveX, perspectiveY)
          } else {
            this.ctx.lineTo(perspectiveX, perspectiveY)
          }
        }
        this.ctx.stroke()
      }
    }

    this.canvasDrawer.restoreLayoutTransform()
  }
}
