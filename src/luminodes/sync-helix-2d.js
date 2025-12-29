// SyncHelix2D - Tubular sine-wave structures in wireframe
// Evangelion sync chart aesthetic: parametric sine wave backbone with circular cross-sections
// Multiple phase-shifted instances create braided interference patterns
import { SETTINGS, UTILS } from '../settings.js'

export class SyncHelix2DLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lastChordSignature = ''
    this.currentBaseHue = Math.floor(Math.random() * 360)
  }

  // Generate a parametric sine wave backbone
  // Returns points along the sine wave path
  // Extended beyond canvas for infinite appearance
  generateSineWaveBackbone (width, amplitude, frequency, phase, segments, extensionFactor = 0.3) {
    const points = []
    const extendedSegments = Math.floor(segments * (1 + extensionFactor * 2))
    const startOffset = -extensionFactor
    
    for (let i = 0; i <= extendedSegments; i++) {
      const u = startOffset + (i / extendedSegments) * (1 + extensionFactor * 2) // Extended range
      const x = (u - 0.5) * width // Can go beyond canvas
      const y = amplitude * Math.sin(u * Math.PI * 2 * frequency + phase)
      
      points.push({ x, y, u })
    }
    
    return points
  }

  // Generate circular cross-section at a point on the sine wave
  // The circle is oriented perpendicular to the wave direction
  generateCrossSection (backbonePoint, nextPoint, radius, crossSectionPoints) {
    const circle = []
    
    // Calculate direction vector (tangent to the wave)
    let dx = 0
    let dy = 1 // Default vertical if no next point
    
    if (nextPoint) {
      dx = nextPoint.x - backbonePoint.x
      dy = nextPoint.y - backbonePoint.y
      const length = Math.sqrt(dx * dx + dy * dy)
      if (length > 0) {
        dx /= length
        dy /= length
      }
    }
    
    // Perpendicular vector (normal to the wave direction)
    const perpX = -dy
    const perpY = dx
    
    // Generate circle points in the plane perpendicular to the wave
    for (let i = 0; i < crossSectionPoints; i++) {
      const angle = (i / crossSectionPoints) * Math.PI * 2
      const cosA = Math.cos(angle)
      const sinA = Math.sin(angle)
      
      // Circle in the plane perpendicular to wave direction
      // Use perpendicular vector and a "depth" vector (z-axis simulation)
      const circleX = backbonePoint.x + radius * cosA * perpX
      const circleY = backbonePoint.y + radius * cosA * perpY
      const circleZ = radius * sinA // Simulated depth
      
      circle.push({
        x: circleX,
        y: circleY,
        z: circleZ,
        angle,
        pointIndex: i
      })
    }
    
    return circle
  }

  // Generate complete tubular structure: sine wave backbone with circular cross-sections
  generateTubularStructure (width, amplitude, frequency, phase, segments, crossSectionRadius, crossSectionPoints, extensionFactor = 0.3) {
    const backbone = this.generateSineWaveBackbone(width, amplitude, frequency, phase, segments, extensionFactor)
    const structure = []
    
    // Generate cross-sections at each backbone point
    backbone.forEach((point, index) => {
      const nextPoint = index < backbone.length - 1 ? backbone[index + 1] : null
      const crossSection = this.generateCrossSection(point, nextPoint, crossSectionRadius, crossSectionPoints)
      
      structure.push({
        backbonePoint: point,
        crossSection,
        segmentIndex: index
      })
    })
    
    return structure
  }

  // Draw a single tubular structure in wireframe
  drawTubularStructure (structure, phaseOffset, t, note, useColor, enableProjection, rotationAngle) {
    const { width, height } = this.dimensions
    const scale = SETTINGS.MODULES.SYNC_HELIX_2D.SCALE
    const lineWidth = SETTINGS.MODULES.SYNC_HELIX_2D.LINE_WIDTH

    // Set up styling
    if (useColor) {
      const midi = note.midi || 60
      this.ctx.strokeStyle = UTILS.pitchToColor(midi)
      this.ctx.shadowColor = UTILS.pitchToColor(midi)
    } else {
      const velocity = note.velocity || 64
      const alpha = 0.4 + (velocity / 127) * 0.3
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
    }

    this.ctx.lineWidth = lineWidth
    const rotationAngleX = rotationAngle || 0
    const rotationAngleY = rotationAngle * 0.75 || 0 // Slight offset for better 3D effect

    // Draw cross-sections (circles)
    structure.forEach((segment, segIdx) => {
      const crossSection = segment.crossSection
      
      // Draw the circle
      this.ctx.beginPath()
      let firstPoint = true
      
      crossSection.forEach((point, pointIdx) => {
        let finalX, finalY
        
        if (enableProjection) {
          // Apply 3D rotation using manual rotation angle
          const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
            point.x * scale,
            point.y * scale,
            point.z * scale,
            rotationAngleX,
            rotationAngleY
          )
          
          // Perspective projection
          finalX = rotatedX + (rotatedX / width) * rotatedZ * 0.001
          finalY = rotatedY + (rotatedY / height) * rotatedZ * 0.001 - rotatedZ * 0.2
        } else {
          // Pure 2D: use x and y, ignore z
          finalX = point.x * scale
          finalY = point.y * scale
        }
        
        // Center vertically on canvas - sine wave oscillates around y=0, so add height/2 to center
        finalY += height / 2
        
        if (firstPoint) {
          this.ctx.moveTo(finalX, finalY)
          firstPoint = false
        } else {
          this.ctx.lineTo(finalX, finalY)
        }
      })
      
      // Close the circle
      this.ctx.closePath()
      this.ctx.stroke()
    })

    // Draw longitudinal connections (connect corresponding points on adjacent cross-sections)
    for (let segIdx = 0; segIdx < structure.length - 1; segIdx++) {
      const currentSegment = structure[segIdx]
      const nextSegment = structure[segIdx + 1]
      
      const currentCrossSection = currentSegment.crossSection
      const nextCrossSection = nextSegment.crossSection
      
      // Connect corresponding points
      const minPoints = Math.min(currentCrossSection.length, nextCrossSection.length)
      for (let pointIdx = 0; pointIdx < minPoints; pointIdx++) {
        const currentPoint = currentCrossSection[pointIdx]
        const nextPoint = nextCrossSection[pointIdx]
        
        let currentX, currentY, nextX, nextY
        
        if (enableProjection) {
          // Apply 3D rotation using manual rotation angle
          const [rotX1, rotY1, rotZ1] = UTILS.rotate3D(
            currentPoint.x * scale,
            currentPoint.y * scale,
            currentPoint.z * scale,
            rotationAngleX,
            rotationAngleY
          )
          const [rotX2, rotY2, rotZ2] = UTILS.rotate3D(
            nextPoint.x * scale,
            nextPoint.y * scale,
            nextPoint.z * scale,
            rotationAngleX,
            rotationAngleY
          )
          
          // Perspective projection
          currentX = rotX1 + (rotX1 / width) * rotZ1 * 0.001
          currentY = rotY1 + (rotY1 / height) * rotZ1 * 0.001 - rotZ1 * 0.2 + height / 2
          nextX = rotX2 + (rotX2 / width) * rotZ2 * 0.001
          nextY = rotY2 + (rotY2 / height) * rotZ2 * 0.001 - rotZ2 * 0.2 + height / 2
        } else {
          currentX = currentPoint.x * scale
          currentY = currentPoint.y * scale + height / 2
          nextX = nextPoint.x * scale
          nextY = nextPoint.y * scale + height / 2
        }
        
        this.ctx.beginPath()
        this.ctx.moveTo(currentX, currentY)
        this.ctx.lineTo(nextX, nextY)
        this.ctx.stroke()
      }
    }
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()
    const { width, height } = this.dimensions

    this.canvasDrawer.applyLayoutTransform(layout)

    const segments = SETTINGS.MODULES.SYNC_HELIX_2D.SEGMENTS
    const amplitude = SETTINGS.MODULES.SYNC_HELIX_2D.AMPLITUDE || height * 0.15
    const baseFrequency = SETTINGS.MODULES.SYNC_HELIX_2D.FREQUENCY || 2.0
    const crossSectionRadius = SETTINGS.MODULES.SYNC_HELIX_2D.RADIUS
    const crossSectionPoints = SETTINGS.MODULES.SYNC_HELIX_2D.CROSS_SECTION_POINTS || 10
    const animationSpeed = SETTINGS.MODULES.SYNC_HELIX_2D.ANIMATION_SPEED
    const syncRate = SETTINGS.MODULES.SYNC_HELIX_2D.SYNC_RATE
    const enableProjection = SETTINGS.MODULES.SYNC_HELIX_2D.ENABLE_PROJECTION
    const rotationAngle = SETTINGS.MODULES.SYNC_HELIX_2D.PERSPECTIVE || 0.2
    const extensionFactor = 0.3 // Extend 30% beyond canvas on each side

    // Create a unique signature of active MIDI notes for color changes
    const chordSig = notes.map(n => n.midi).sort().join('-')
    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    // Draw tubular structures for each active note
    notes.forEach((note, noteIndex) => {
      const midi = note.midi || 60
      const velocity = note.velocity || 64

      // Frequency scaling based on MIDI note
      const frequency = baseFrequency * (0.8 + (midi / 127) * 0.4)
      
      // Phase offset based on MIDI note and time
      const basePhase = (midi / 127) * Math.PI * 2
      
      // Phase modulation for sync/desync animation
      const phaseModulation = Math.sin(t * animationSpeed * syncRate + noteIndex * Math.PI * 2 / notes.length)
      const phaseOffset = basePhase + phaseModulation * Math.PI * 0.5
      
      // Amplitude affected by velocity
      const noteAmplitude = amplitude * (0.7 + (velocity / 127) * 0.6)
      
      // Cross-section radius affected by velocity
      const noteRadius = crossSectionRadius * (0.8 + (velocity / 127) * 0.4)

      // Generate tubular structure (extended beyond canvas)
      const structure = this.generateTubularStructure(
        width, // Always full canvas width
        noteAmplitude,
        frequency,
        phaseOffset,
        segments,
        noteRadius,
        crossSectionPoints,
        extensionFactor
      )

      // Draw the structure
      this.drawTubularStructure(structure, phaseOffset, t, note, useColor, enableProjection, rotationAngle)
    })

    this.canvasDrawer.restoreLayoutTransform()
  }
}
