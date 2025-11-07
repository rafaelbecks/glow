// Luneburg Lens drawing module
// Based on the Luneburg lens: n = √(2 - (r/R)²)
// Visualizes how parallel rays get refracted by a gradient-index lens
import { SETTINGS, UTILS } from '../settings.js'

export class LuneburgLensLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
  }

  /**
   * Calculate refractive index at distance r from center
   * n = √(2 - (r/R)²)
   */
  refractiveIndex (r, R) {
    const ratio = r / R
    if (ratio >= 1) return 1.0 // Outside the lens
    const n = Math.sqrt(2 - ratio * ratio)
    return Math.max(n, 1.0) // Clamp to minimum of 1.0
  }

  /**
   * Trace a ray through the Luneburg lens
   * For a point source on the edge, rays exit as parallel lines
   * For parallel rays entering, they focus to a point on the opposite edge
   */
  traceRay (startX, startY, angle, lensCenterX, lensCenterY, lensRadius, numSteps = 150, t = 0, notes = [], maxDistance = null) {
    const points = []
    const stepSize = lensRadius * 2.5 / numSteps
    let x = startX
    let y = startY
    let dx = Math.cos(angle) * stepSize
    let dy = Math.sin(angle) * stepSize

    // Wave distortion parameters (like noise valley but softer)
    const distortionStrength = SETTINGS.MODULES.LUNEBURG_LENS.DISTORTION_STRENGTH || 1.5
    const waveStrength = distortionStrength * 0.3 // Softer than noise valley
    const waveFreq = 0.05
    const waveSpeed = 0.2

    // Calculate max distance if specified
    const startDist = Math.sqrt((startX - lensCenterX) ** 2 + (startY - lensCenterY) ** 2)
    let totalDistance = 0

    for (let i = 0; i < numSteps; i++) {
      const distFromCenter = Math.sqrt(
        (x - lensCenterX) ** 2 + (y - lensCenterY) ** 2
      )

      if (distFromCenter < lensRadius) {
        // Inside the lens - apply refraction based on gradient index
        const n = this.refractiveIndex(distFromCenter, lensRadius)
        const gradient = this.calculateGradient(x, y, lensCenterX, lensCenterY, lensRadius)
        
        // Refraction effect: rays bend towards regions of higher refractive index
        const bendStrength = (n - 1.0) * 0.8 * distortionStrength
        const bendFactor = 1.0 - (distFromCenter / lensRadius) // More bending near center
        
        // Apply bending perpendicular to gradient (toward center)
        const perpX = -gradient.y
        const perpY = gradient.x
        
        // Bend the ray direction
        dx += (gradient.x * bendStrength + perpX * bendStrength * 0.3) * stepSize * bendFactor
        dy += (gradient.y * bendStrength + perpY * bendStrength * 0.3) * stepSize * bendFactor
        
        // Add wave-based distortion (like noise valley but softer)
        // Create wavy distortion perpendicular to the ray direction
        const perpDirX = -dy
        const perpDirY = dx
        const perpLen = Math.sqrt(perpDirX * perpDirX + perpDirY * perpDirY)
        
        if (perpLen > 0) {
          const normalizedPerpX = perpDirX / perpLen
          const normalizedPerpY = perpDirY / perpLen
          
          // Multiple wave patterns for organic distortion
          const wave1 = Math.sin(x * waveFreq + t * waveSpeed) * waveStrength
          const wave2 = Math.sin(y * waveFreq + t * waveSpeed * 1.3) * waveStrength * 0.7
          const wave3 = Math.sin(distFromCenter * waveFreq * 0.5 + t * waveSpeed * 0.8) * waveStrength * 0.5
          
          // Combine waves with falloff from center
          const falloff = Math.exp(-distFromCenter * 0.02) // Gentle falloff
          const totalWave = (wave1 + wave2 + wave3) * falloff * bendFactor
          
          // Apply wave distortion perpendicular to ray
          x += normalizedPerpX * totalWave
          y += normalizedPerpY * totalWave
        }
        
        // Normalize direction to maintain step size
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len > 0) {
          dx = dx / len * stepSize
          dy = dy / len * stepSize
        }
      } else {
        // Outside lens - apply wave distortion even outside (but weaker)
        const perpDirX = -dy
        const perpDirY = dx
        const perpLen = Math.sqrt(perpDirX * perpDirX + perpDirY * perpDirY)
        
        if (perpLen > 0) {
          const normalizedPerpX = perpDirX / perpLen
          const normalizedPerpY = perpDirY / perpLen
          
          // Weaker wave distortion outside lens
          const wave1 = Math.sin(x * waveFreq + t * waveSpeed) * waveStrength * 0.3
          const wave2 = Math.sin(y * waveFreq + t * waveSpeed * 1.3) * waveStrength * 0.2
          
          const totalWave = (wave1 + wave2) * 0.5
          
          // Apply wave distortion perpendicular to ray
          x += normalizedPerpX * totalWave
          y += normalizedPerpY * totalWave
        }
        
        // Straight line propagation
        const len = Math.sqrt(dx * dx + dy * dy)
        if (len > 0) {
          dx = dx / len * stepSize
          dy = dy / len * stepSize
        }
      }

      points.push({ x, y })
      x += dx
      y += dy
      totalDistance += stepSize

      // Stop if we've reached max distance or gone far enough
      if (maxDistance !== null && totalDistance >= maxDistance) {
        break
      }
      if (maxDistance === null && (Math.abs(x - lensCenterX) > lensRadius * 3 || 
          Math.abs(y - lensCenterY) > lensRadius * 3)) {
        break
      }
    }

    return points
  }

  /**
   * Calculate gradient of refractive index (points outward from center)
   */
  calculateGradient (x, y, centerX, centerY, radius) {
    const dx = x - centerX
    const dy = y - centerY
    const r = Math.sqrt(dx * dx + dy * dy)
    
    if (r < 0.01) return { x: 0, y: 0 }
    
    // Gradient of n = √(2 - (r/R)²) points radially outward
    // The magnitude decreases as we approach the edge
    const gradientMagnitude = (r / (radius * radius)) / (2 * Math.sqrt(2 - (r / radius) ** 2))
    
    return {
      x: (dx / r) * gradientMagnitude,
      y: (dy / r) * gradientMagnitude
    }
  }

  /**
   * Generate ray paths for parallel incoming rays
   * These will focus to a point on the opposite edge
   * Lines are symmetric and can extend to canvas width
   */
  generateParallelRays (lensCenterX, lensCenterY, lensRadius, numRays, yOffset = 0, lineLength = null, width = 0, t = 0, notes = []) {
    const rays = []
    const spacing = (lensRadius * 2) / (numRays + 1)
    
    // Determine line length - if not specified, use canvas width, otherwise use specified length
    const maxLength = lineLength !== null ? lineLength : width
    const halfLength = maxLength / 2
    
    // Start position - symmetric around center
    const startX = lensCenterX - halfLength
    const startY = lensCenterY - lensRadius + spacing / 2 + yOffset

    for (let i = 0; i < numRays; i++) {
      const y = startY + i * spacing
      const angle = 0 // Parallel rays going right (0 radians = pointing right)
      // Trace ray through full length to maintain distortion
      const points = this.traceRay(startX, y, angle, lensCenterX, lensCenterY, lensRadius, 300, t, notes, maxLength)
      
      rays.push({ points, startY: y })
    }

    return rays
  }

  /**
   * Generate ray paths from a point source on the lens edge
   * These will exit as parallel rays
   */
  generatePointSourceRays (lensCenterX, lensCenterY, lensRadius, numRays, sourceAngle = 0) {
    const rays = []
    const angleSpread = Math.PI / 3 // 60 degree spread

    for (let i = 0; i < numRays; i++) {
      const angle = sourceAngle - angleSpread / 2 + (i / (numRays - 1)) * angleSpread
      const startX = lensCenterX + Math.cos(sourceAngle) * lensRadius
      const startY = lensCenterY + Math.sin(sourceAngle) * lensRadius
      
      const points = this.traceRay(startX, startY, angle, lensCenterX, lensCenterY, lensRadius, 200, 0, [])
      rays.push({ points, angle })
    }

    return rays
  }

  /**
   * Generate concentric circles that get distorted by the lens
   */
  generateConcentricCircles (lensCenterX, lensCenterY, lensRadius, numCircles, notes, t = 0) {
    const circles = []
    const baseRadius = lensRadius * 0.3
    const maxRadius = lensRadius * 1.5
    const radiusStep = (maxRadius - baseRadius) / numCircles

    // Wave distortion parameters (same as for lines)
    const distortionStrength = SETTINGS.MODULES.LUNEBURG_LENS.DISTORTION_STRENGTH || 1.5
    const waveStrength = distortionStrength * 0.3
    const waveFreq = 0.05
    const waveSpeed = 0.2

    for (let i = 0; i < numCircles; i++) {
      const radius = baseRadius + i * radiusStep
      const points = []
      const numPoints = Math.max(64, Math.floor(radius * 0.5)) // More points for larger circles

      for (let j = 0; j < numPoints; j++) {
        const angle = (j / numPoints) * Math.PI * 2
        let x = lensCenterX + Math.cos(angle) * radius
        let y = lensCenterY + Math.sin(angle) * radius

        // Apply lens distortion to each point
        const distFromCenter = Math.sqrt(
          (x - lensCenterX) ** 2 + (y - lensCenterY) ** 2
        )

        if (distFromCenter < lensRadius) {
          // Inside lens - apply distortion based on refractive index
          const n = this.refractiveIndex(distFromCenter, lensRadius)
          const gradient = this.calculateGradient(x, y, lensCenterX, lensCenterY, lensRadius)
          const bendStrength = (n - 1.0) * 0.6 * distortionStrength
          const bendFactor = 1.0 - (distFromCenter / lensRadius)

          // Distort the point toward center
          const distFromEdge = lensRadius - distFromCenter
          const distortionAmount = bendStrength * bendFactor * distFromEdge * 0.1
          x += gradient.x * distortionAmount
          y += gradient.y * distortionAmount

          // Add wave-based distortion (same as lines)
          // Calculate tangent direction (perpendicular to radius)
          const tangentX = -Math.sin(angle)
          const tangentY = Math.cos(angle)
          
          // Multiple wave patterns for organic distortion
          const wave1 = Math.sin(x * waveFreq + t * waveSpeed) * waveStrength
          const wave2 = Math.sin(y * waveFreq + t * waveSpeed * 1.3) * waveStrength * 0.7
          const wave3 = Math.sin(distFromCenter * waveFreq * 0.5 + t * waveSpeed * 0.8) * waveStrength * 0.5
          const wave4 = Math.sin(angle * 8 + t * waveSpeed * 0.5) * waveStrength * 0.4 // Angular wave
          
          // Combine waves with falloff from center
          const falloff = Math.exp(-distFromCenter * 0.02)
          const totalWave = (wave1 + wave2 + wave3 + wave4) * falloff * bendFactor
          
          // Apply wave distortion along tangent (perpendicular to radius)
          x += tangentX * totalWave
          y += tangentY * totalWave
        } else {
          // Outside lens - still apply some wave distortion
          const tangentX = -Math.sin(angle)
          const tangentY = Math.cos(angle)
          
          const wave1 = Math.sin(x * waveFreq + t * waveSpeed) * waveStrength * 0.2
          const wave2 = Math.sin(y * waveFreq + t * waveSpeed * 1.3) * waveStrength * 0.15
          
          const totalWave = (wave1 + wave2) * 0.3
          x += tangentX * totalWave
          y += tangentY * totalWave
        }

        points.push({ x, y })
      }

      circles.push({ points, radius })
    }

    return circles
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    // Read settings in real-time (they're already read from SETTINGS directly)
    const { width, height } = this.dimensions
    const lensRadius = SETTINGS.MODULES.LUNEBURG_LENS.RADIUS
    const linesPerNote = SETTINGS.MODULES.LUNEBURG_LENS.LINES_PER_NOTE
    const mode = SETTINGS.MODULES.LUNEBURG_LENS.MODE || 'parallel' // 'parallel' or 'circles'
    const useColorMode = useColor || SETTINGS.MODULES.LUNEBURG_LENS.USE_COLOR
    const lensCenterX = 0
    const lensCenterY = 0

    this.canvasDrawer.applyLayoutTransform(layout)

    // Draw the lens circle outline
    this.ctx.beginPath()
    this.ctx.arc(lensCenterX, lensCenterY, lensRadius, 0, Math.PI * 2)
    this.ctx.strokeStyle = SETTINGS.MODULES.LUNEBURG_LENS.LENS_COLOR
    this.ctx.lineWidth = SETTINGS.MODULES.LUNEBURG_LENS.LENS_WIDTH
    this.ctx.stroke()

    // Set up line styling
    this.ctx.lineWidth = SETTINGS.MODULES.LUNEBURG_LENS.LINE_WIDTH
    this.ctx.shadowBlur = SETTINGS.MODULES.LUNEBURG_LENS.SHADOW_BLUR

    if (mode === 'circles') {
      // Draw concentric circles mode
      const numCircles = notes.length * linesPerNote
      const circles = this.generateConcentricCircles(
        lensCenterX,
        lensCenterY,
        lensRadius,
        numCircles,
        notes,
        t
      )

      circles.forEach((circle, circleIndex) => {
        const noteIndex = Math.floor(circleIndex / linesPerNote)
        const note = notes[noteIndex] || notes[0]

        if (useColorMode && note) {
          this.ctx.strokeStyle = UTILS.pitchToColor(note.midi)
          this.ctx.shadowColor = this.ctx.strokeStyle
        } else {
          this.ctx.strokeStyle = SETTINGS.MODULES.LUNEBURG_LENS.LINE_COLOR
          this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
        }

        this.ctx.beginPath()
        if (circle.points.length > 0) {
          this.ctx.moveTo(circle.points[0].x, circle.points[0].y)
          for (let i = 1; i < circle.points.length; i++) {
            this.ctx.lineTo(circle.points[i].x, circle.points[i].y)
          }
          this.ctx.closePath() // Close the circle
        }
        this.ctx.stroke()
      })
    } else {
      // Draw parallel lines mode (default)
      const totalRays = notes.length * linesPerNote
      // LINE_LENGTH: 0 or null = full canvas width, otherwise use specified length
      const lineLength = (SETTINGS.MODULES.LUNEBURG_LENS.LINE_LENGTH && SETTINGS.MODULES.LUNEBURG_LENS.LINE_LENGTH > 0) 
        ? SETTINGS.MODULES.LUNEBURG_LENS.LINE_LENGTH 
        : null

      // Draw parallel incoming rays that get focused by the lens
      const rays = this.generateParallelRays(
        lensCenterX,
        lensCenterY,
        lensRadius,
        totalRays,
        Math.sin(t * SETTINGS.MODULES.LUNEBURG_LENS.ANIMATION_SPEED) * lensRadius * 0.3,
        lineLength,
        width,
        t,
        notes
      )

      // Draw each ray
      rays.forEach((ray, rayIndex) => {
        const noteIndex = Math.floor(rayIndex / linesPerNote)
        const note = notes[noteIndex] || notes[0]

        if (useColorMode && note) {
          this.ctx.strokeStyle = UTILS.pitchToColor(note.midi)
          this.ctx.shadowColor = this.ctx.strokeStyle
        } else {
          this.ctx.strokeStyle = SETTINGS.MODULES.LUNEBURG_LENS.LINE_COLOR
          this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
        }

        this.ctx.beginPath()
        if (ray.points.length > 0) {
          this.ctx.moveTo(ray.points[0].x, ray.points[0].y)
          for (let i = 1; i < ray.points.length; i++) {
            this.ctx.lineTo(ray.points[i].x, ray.points[i].y)
          }
        }
        this.ctx.stroke()
      })
    }

    // Optionally draw point source rays (for more visual interest)
    if (SETTINGS.MODULES.LUNEBURG_LENS.SHOW_POINT_SOURCE && notes.length > 0) {
      const totalRays = notes.length * linesPerNote
      const sourceAngle = t * SETTINGS.MODULES.LUNEBURG_LENS.ROTATION_SPEED
      const pointSourceRays = this.generatePointSourceRays(
        lensCenterX,
        lensCenterY,
        lensRadius,
        Math.min(totalRays, 20),
        sourceAngle
      )

      pointSourceRays.forEach((ray, rayIndex) => {
        const noteIndex = rayIndex % notes.length
        const note = notes[noteIndex]

        if (useColorMode && note) {
          this.ctx.strokeStyle = UTILS.pitchToColor(note.midi)
          this.ctx.shadowColor = this.ctx.strokeStyle
        } else {
          this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.6)' // Red for point source rays
          this.ctx.shadowColor = 'rgba(255, 0, 0, 0.5)'
        }

        this.ctx.beginPath()
        if (ray.points.length > 0) {
          this.ctx.moveTo(ray.points[0].x, ray.points[0].y)
          for (let i = 1; i < ray.points.length; i++) {
            this.ctx.lineTo(ray.points[i].x, ray.points[i].y)
          }
        }
        this.ctx.stroke()
      })
    }

    this.canvasDrawer.restoreLayoutTransform()
  }
}

