// Torus - 3D wireframe torus surface
import { SETTINGS, UTILS } from '../settings.js'
import { getEulerRotation, isRotationEnabled } from '../rotation-utils.js'

export class TorusLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lastChordSignature = ''
    this.currentBaseHue = Math.floor(Math.random() * 360)
  }

  // Generate torus surface points
  // R = major radius (center of tube to center of torus)
  // r = minor radius (tube thickness)
  generateTorusPoints (majorRadius, minorRadius, rings, segments) {
    const points = []

    for (let i = 0; i <= rings; i++) {
      const v = (i / rings) * Math.PI * 2

      for (let j = 0; j <= segments; j++) {
        const u = (j / segments) * Math.PI * 2
        const x = (majorRadius + minorRadius * Math.cos(v)) * Math.cos(u)
        const y = minorRadius * Math.sin(v)
        const z = (majorRadius + minorRadius * Math.cos(v)) * Math.sin(u)

        points.push({ x, y, z, u, v })
      }
    }

    return { points, rings, segments }
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    this.dimensions = this.canvasDrawer.getDimensions()

    const { width, height } = this.dimensions
    const moduleSettings = SETTINGS.MODULES.TORUS
    const majorRadius = moduleSettings.MAJOR_RADIUS
    const minorRadius = moduleSettings.MINOR_RADIUS
    const rings = moduleSettings.RINGS
    const segments = moduleSettings.SEGMENTS
    const scale = moduleSettings.SCALE

    this.canvasDrawer.applyLayoutTransform(layout)

    const { points } = this.generateTorusPoints(majorRadius, minorRadius, rings, segments)


    const chordSig = notes.map(n => n.midi).sort().join('-')
    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    // Use pitchToColor when useColor is true
    if (useColor) {
      const midiValue = notes.length > 0 ? notes[0].midi : 60
      this.ctx.strokeStyle = UTILS.pitchToColor(midiValue)
      this.ctx.shadowColor = this.ctx.strokeStyle
    } else {
      const baseHue = this.currentBaseHue + t * 2
      this.ctx.strokeStyle = `hsla(${baseHue}, 0%, 80%, 0.4)`
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
    }
    this.ctx.lineWidth = moduleSettings.LINE_WIDTH

    const rotationSpeed = moduleSettings.ROTATION_SPEED

    const euler = getEulerRotation(moduleSettings)
    const rotationEnabled = isRotationEnabled(moduleSettings)
    const baseAngleX = rotationEnabled ? t * rotationSpeed * 0.1 : 0
    const baseAngleY = rotationEnabled ? t * rotationSpeed * 0.15 : 0
    const angleX = baseAngleX + euler.x
    const angleY = baseAngleY + euler.y
    const angleZ = euler.z

    // Draw rings around the major circle (fixed v, vary u)
    for (let i = 0; i <= rings; i++) {
      this.ctx.beginPath()
      for (let j = 0; j <= segments; j++) {
        const point = points[i * (segments + 1) + j]

        const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
          point.x * scale,
          point.y * scale,
          point.z * scale,
          angleX,
          angleY,
          angleZ
        )

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

    // Draw tube cross-section loops (fixed u, vary v)
    for (let j = 0; j <= segments; j++) {
      this.ctx.beginPath()
      for (let i = 0; i <= rings; i++) {
        const point = points[i * (segments + 1) + j]

        const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
          point.x * scale,
          point.y * scale,
          point.z * scale,
          angleX,
          angleY,
          angleZ
        )

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

    this.canvasDrawer.restoreLayoutTransform()
  }
}
