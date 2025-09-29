// Catenoid - 3D wireframe catenoid surface with deformation
import { SETTINGS, UTILS } from '../settings.js'

export class CatenoidLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lastChordSignature = ''
    this.currentBaseHue = Math.floor(Math.random() * 360)
  }

  // Generate catenoid surface points
  generateCatenoidPoints (radius, height, rings, segments) {
    const points = []
    
    for (let i = 0; i <= rings; i++) {
      const v = (i / rings) * height - height / 2
      const r = radius * Math.cosh(v / radius)
      
      for (let j = 0; j <= segments; j++) {
        const u = (j / segments) * Math.PI * 2
        const x = r * Math.cos(u)
        const y = v
        const z = r * Math.sin(u)
        
        points.push({ x, y, z, u, v })
      }
    }
    
    return { points, rings, segments }
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
        // Create multiple wave patterns
        const wave1 = Math.sin(point.u * waveFreq + t * waveSpeed) * waveStrength
        const wave2 = Math.sin(point.v * waveFreq * 2 + t * waveSpeed * 1.2) * waveStrength * 0.6
        const wave3 = Math.sin(point.x * waveFreq * 0.5 + t * waveSpeed * 0.8) * waveStrength * 0.4
        
        // Apply deformation to radius
        const radius = Math.sqrt(point.x * point.x + point.z * point.z)
        const totalWave = (wave1 + wave2 + wave3) * 0.3
        
        // Deform the point
        const scale = 1 + totalWave
        point.x *= scale
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
    const radius = SETTINGS.MODULES.CATENOID.RADIUS
    const catenoidHeight = SETTINGS.MODULES.CATENOID.HEIGHT
    const rings = SETTINGS.MODULES.CATENOID.RINGS
    const segments = SETTINGS.MODULES.CATENOID.SEGMENTS
    const scale = SETTINGS.MODULES.CATENOID.SCALE

    this.canvasDrawer.applyLayoutTransform(layout)

    // Generate catenoid points
    const { points } = this.generateCatenoidPoints(radius, catenoidHeight, rings, segments)

    // Apply deformation based on active notes
    const deformationStrength = SETTINGS.MODULES.CATENOID.DEFORMATION_STRENGTH
    const deformedPoints = this.applyDeformation(points, notes, deformationStrength, t)

    // Create a unique signature of active MIDI notes for color changes
    const chordSig = notes.map(n => n.midi).sort().join('-')
    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    // Set up drawing context
    const baseHue = this.currentBaseHue + t * 2
    const hue = useColor ? (baseHue + notes.length * 15) % 360 : SETTINGS.MODULES.CATENOID.BASE_HUE
    
    this.ctx.strokeStyle = useColor ? `hsla(${hue}, 80%, 60%, 0.4)` : `hsla(${hue}, 0%, 80%, 0.4)`
    this.ctx.shadowColor = useColor ? `hsla(${hue}, 80%, 70%, 0.5)` : 'rgba(255, 255, 255, 0.5)'
    this.ctx.lineWidth = SETTINGS.MODULES.CATENOID.LINE_WIDTH

    const rotationSpeed = SETTINGS.MODULES.CATENOID.ROTATION_SPEED

    // Draw horizontal rings
    for (let i = 0; i <= rings; i++) {
      this.ctx.beginPath()
      for (let j = 0; j <= segments; j++) {
        const point = deformedPoints[i * (segments + 1) + j]
        
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

    // Draw vertical lines
    for (let j = 0; j <= segments; j++) {
      this.ctx.beginPath()
      for (let i = 0; i <= rings; i++) {
        const point = deformedPoints[i * (segments + 1) + j]
        
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

    this.canvasDrawer.restoreLayoutTransform()
  }
}
