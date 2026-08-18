// Cube - 3D wireframe cube with configurable segments and rotation
import { SETTINGS, UTILS } from '../settings.js'
import { getEulerRotation, isRotationEnabled } from '../rotation-utils.js'

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

    // Create a unique signature of active MIDI notes for color changes
    const chordSig = notes.map(n => n.midi).sort().join('-')
    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    // Set up drawing context - use pitchToColor when useColor is true
    if (useColor) {
      const midiValue = notes.length > 0 ? notes[0].midi : 60
      this.ctx.strokeStyle = UTILS.pitchToColor(midiValue)
      this.ctx.shadowColor = this.ctx.strokeStyle
    } else {
      const baseHue = this.currentBaseHue + t * 2
      this.ctx.strokeStyle = `hsla(${baseHue}, 0%, 80%, 0.4)`
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
    }
    this.ctx.lineWidth = SETTINGS.MODULES.CUBE.LINE_WIDTH

    const m = SETTINGS.MODULES.CUBE
    const rotationSpeed = m.ROTATION_SPEED
    const euler = getEulerRotation(m)
    const rotationEnabled = isRotationEnabled(m)
    const baseAngleX = rotationEnabled ? t * rotationSpeed * 0.1 : 0
    const baseAngleY = rotationEnabled ? t * rotationSpeed * 0.15 : 0
    const angleX = baseAngleX + euler.x
    const angleY = baseAngleY + euler.y
    const angleZ = euler.z

    // Draw horizontal lines (along X axis)
    for (let j = 0; j <= segments; j++) {
      for (let k = 0; k <= segments; k++) {
        this.ctx.beginPath()
        for (let i = 0; i <= segments; i++) {
          const point = points[i * (segments + 1) * (segments + 1) + j * (segments + 1) + k]

          // Apply 3D rotation
          const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
            point.x * scale,
            point.y * scale,
            point.z * scale,
            angleX,
            angleY,
            angleZ
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
          const point = points[i * (segments + 1) * (segments + 1) + j * (segments + 1) + k]

          // Apply 3D rotation
          const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
            point.x * scale,
            point.y * scale,
            point.z * scale,
            angleX,
            angleY,
            angleZ
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
          const point = points[i * (segments + 1) * (segments + 1) + j * (segments + 1) + k]

          // Apply 3D rotation
          const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
            point.x * scale,
            point.y * scale,
            point.z * scale,
            angleX,
            angleY,
            angleZ
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
