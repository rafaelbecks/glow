// Line Cylinder - 3D wireframe cylinder with vertical lines that opens and closes
import { SETTINGS, UTILS } from '../settings.js'

export class LineCylinderLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lastChordSignature = ''
    this.currentBaseHue = Math.floor(Math.random() * 360)
  }

  // Generate cylinder points with vertical lines
  generateCylinderPoints (radius, height, segments, linesPerNote, notes) {
    const points = []
    const totalLines = notes.length * linesPerNote
    
    for (let i = 0; i < totalLines; i++) {
      const angle = (i / totalLines) * Math.PI * 2
      const x = radius * Math.cos(angle)
      const z = radius * Math.sin(angle)
      
      // Create vertical line from bottom to top
      const topY = height / 2
      const bottomY = -height / 2
      
      points.push({
        x, y: topY, z, angle, lineIndex: i,
        top: { x, y: topY, z },
        bottom: { x, y: bottomY, z }
      })
    }
    
    return { points, totalLines }
  }

  // Apply opening/closing animation based on time and notes
  applyCylinderAnimation (points, t, notes, animationSpeed = 1.0, separationThreshold = 0.1) {
    if (notes.length === 0) return points

    const animated = points.map(point => ({ ...point }))
    
    // Calculate opening/closing factor (0 = closed cylinder, 1 = fully open plane)
    const openFactor = (Math.sin(t * animationSpeed) + 1) / 2 // 0 to 1
    
    // Apply separation threshold - lines won't get closer than this distance
    const clampedOpenFactor = Math.min(openFactor, 1 - separationThreshold)
    
    animated.forEach(point => {
      // Interpolate between cylinder and plane with separation threshold
      const targetX = point.x * (1 - clampedOpenFactor) // When open, x approaches 0
      const targetZ = point.z * (1 - clampedOpenFactor) // When open, z approaches 0
      const targetY = point.y * (1 - clampedOpenFactor) + point.y * clampedOpenFactor // Y stays the same
      
      point.x = targetX
      point.z = targetZ
      point.y = targetY
      
      // Update top and bottom points
      point.top.x = targetX
      point.top.z = targetZ
      point.bottom.x = targetX
      point.bottom.z = targetZ
    })

    return animated
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
        // Create wave patterns that affect the cylinder radius
        const wave1 = Math.sin(point.angle * waveFreq + t * waveSpeed) * waveStrength
        const wave2 = Math.sin(point.y * waveFreq * 0.5 + t * waveSpeed * 1.2) * waveStrength * 0.6
        const wave3 = Math.sin(point.lineIndex * waveFreq * 0.3 + t * waveSpeed * 0.8) * waveStrength * 0.4
        
        const totalWave = (wave1 + wave2 + wave3) * 0.2
        
        // Apply deformation to radius
        const scale = 1 + totalWave
        point.x *= scale
        point.z *= scale
        point.top.x *= scale
        point.top.z *= scale
        point.bottom.x *= scale
        point.bottom.z *= scale
      })
    })

    return deformed
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()
    
    const { width, height } = this.dimensions
    const radius = SETTINGS.MODULES.LINE_CYLINDER.RADIUS
    const cylinderHeight = SETTINGS.MODULES.LINE_CYLINDER.HEIGHT
    const linesPerNote = SETTINGS.MODULES.LINE_CYLINDER.LINES_PER_NOTE
    const scale = SETTINGS.MODULES.LINE_CYLINDER.SCALE
    const animationSpeed = SETTINGS.MODULES.LINE_CYLINDER.ANIMATION_SPEED
    const separationThreshold = SETTINGS.MODULES.LINE_CYLINDER.SEPARATION_THRESHOLD

    this.canvasDrawer.applyLayoutTransform(layout)

    // Generate cylinder points
    const { points } = this.generateCylinderPoints(radius, cylinderHeight, 0, linesPerNote, notes)

    // Apply opening/closing animation with separation threshold
    const animatedPoints = this.applyCylinderAnimation(points, t, notes, animationSpeed, separationThreshold)

    // Apply deformation based on active notes
    const deformationStrength = SETTINGS.MODULES.LINE_CYLINDER.DEFORMATION_STRENGTH
    const deformedPoints = this.applyDeformation(animatedPoints, notes, deformationStrength, t)

    // Create a unique signature of active MIDI notes for color changes
    const chordSig = notes.map(n => n.midi).sort().join('-')
    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    // Set up drawing context
    const baseHue = this.currentBaseHue + t * 2
    const hue = useColor ? (baseHue + notes.length * 15) % 360 : SETTINGS.MODULES.LINE_CYLINDER.BASE_HUE
    
    this.ctx.strokeStyle = useColor ? `hsla(${hue}, 80%, 60%, 0.4)` : `hsla(0, 0%, 100%, 0.4)`
    this.ctx.shadowColor = useColor ? `hsla(${hue}, 80%, 70%, 0.5)` : 'rgba(255, 255, 255, 0.5)'
    this.ctx.lineWidth = SETTINGS.MODULES.LINE_CYLINDER.LINE_WIDTH

    const rotationSpeed = SETTINGS.MODULES.LINE_CYLINDER.ROTATION_SPEED

    // Draw vertical lines
    deformedPoints.forEach(point => {
      this.ctx.beginPath()
      
      // Apply 3D rotation to top point
      const [rotatedTopX, rotatedTopY, rotatedTopZ] = UTILS.rotate3D(
        point.top.x * scale,
        point.top.y * scale,
        point.top.z * scale,
        t * rotationSpeed * 0.1,
        t * rotationSpeed * 0.15
      )
      
      // Apply 3D rotation to bottom point
      const [rotatedBottomX, rotatedBottomY, rotatedBottomZ] = UTILS.rotate3D(
        point.bottom.x * scale,
        point.bottom.y * scale,
        point.bottom.z * scale,
        t * rotationSpeed * 0.1,
        t * rotationSpeed * 0.15
      )
      
      // Apply perspective projection to top point
      const perspectiveTopX = rotatedTopX + (rotatedTopX / width) * rotatedTopZ * 0.001
      const perspectiveTopY = rotatedTopY + (rotatedTopY / height) * rotatedTopZ * 0.001 - rotatedTopZ * 0.3
      
      // Apply perspective projection to bottom point
      const perspectiveBottomX = rotatedBottomX + (rotatedBottomX / width) * rotatedBottomZ * 0.001
      const perspectiveBottomY = rotatedBottomY + (rotatedBottomY / height) * rotatedBottomZ * 0.001 - rotatedBottomZ * 0.3
      
      this.ctx.moveTo(perspectiveTopX, perspectiveTopY)
      this.ctx.lineTo(perspectiveBottomX, perspectiveBottomY)
      this.ctx.stroke()
    })

    this.canvasDrawer.restoreLayoutTransform()
  }
}
