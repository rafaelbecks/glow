import { SETTINGS, UTILS } from '../settings.js'

export class SphericalLensLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
  }

  applySphericalAberration (x, y, lensCenterX, lensCenterY, lensRadius, aberrationStrength, t) {
    const dx = x - lensCenterX
    const dy = y - lensCenterY
    const distFromCenter = Math.sqrt(dx * dx + dy * dy)

    if (distFromCenter >= lensRadius) {
      return { x, y }
    }

    const normalizedDist = distFromCenter / lensRadius

    // Outer rays bend more than inner rays (spherical aberration)
    const aberrationFactor = Math.pow(normalizedDist, 2.0) * aberrationStrength * 1.5
    const angle = Math.atan2(dy, dx)
    const bendTowardCenter = -aberrationFactor * (1 - normalizedDist * 0.3) * lensRadius * 0.6

    const waveFreq = 0.08
    const waveSpeed = 0.3
    const waveStrength = aberrationFactor * lensRadius * 0.2

    const wave1 = Math.sin(distFromCenter * waveFreq * 10 + angle * 3 + t * waveSpeed) * waveStrength
    const wave2 = Math.sin(distFromCenter * waveFreq * 6 + angle * 5 + t * waveSpeed * 1.3) * waveStrength * 0.6
    const wave3 = Math.sin(x * 0.02 + t * waveSpeed * 0.8) * waveStrength * 0.4
    const wave4 = Math.sin(y * 0.02 + t * waveSpeed * 0.9) * waveStrength * 0.4

    const perpAngle = angle + Math.PI / 2
    const totalWave = (wave1 + wave2 + wave3 + wave4) * 0.5

    const radialDistortion = Math.cos(angle) * bendTowardCenter + Math.cos(perpAngle) * totalWave
    const tangentialDistortion = Math.sin(angle) * bendTowardCenter + Math.sin(perpAngle) * totalWave

    return {
      x: x + radialDistortion,
      y: y + tangentialDistortion
    }
  }

  generateDistortedLine (startX, startY, endX, endY, lensCenterX, lensCenterY, lensRadius, aberrationStrength, t, numSegments = 200) {
    const points = []

    for (let i = 0; i <= numSegments; i++) {
      const segmentT = i / numSegments
      const x = startX + (endX - startX) * segmentT
      const y = startY + (endY - startY) * segmentT

      const distorted = this.applySphericalAberration(
        x, y, lensCenterX, lensCenterY, lensRadius, aberrationStrength, t
      )

      points.push(distorted)
    }

    return points
  }

  drawLines (t, notes, useColor, lensCenterX, lensCenterY, lensRadius, orientation, lineLength, aberrationStrength) {
    const { width, height } = this.dimensions
    const linesPerNote = SETTINGS.MODULES.SPHERICAL_LENS.LINES_PER_NOTE
    const totalLines = notes.length * linesPerNote

    const isHorizontal = orientation === 'horizontal'
    const canvasSize = isHorizontal ? height : width
    const lineSize = isHorizontal ? width : height
    const actualLineLength = lineLength > 0 ? lineLength : lineSize
    const halfLength = actualLineLength / 2
    const spacing = canvasSize / (totalLines + 1)

    const waveSpeed = SETTINGS.MODULES.SPHERICAL_LENS.WAVE_SPEED || 0.3
    const waveAmplitude = SETTINGS.MODULES.SPHERICAL_LENS.WAVE_AMPLITUDE || 5

    for (let i = 0; i < totalLines; i++) {
      const lineIndex = i % totalLines
      const noteIndex = Math.floor(i / linesPerNote)
      const note = notes[noteIndex] || notes[0]

      const baseLinePos = (lineIndex + 1) * spacing - canvasSize / 2
      const waveOffset = Math.sin(t * waveSpeed + lineIndex * 0.3) * waveAmplitude
      const linePos = baseLinePos + waveOffset

      let startX, startY, endX, endY

      if (isHorizontal) {
        startX = -halfLength
        startY = linePos
        endX = halfLength
        endY = linePos
      } else {
        startX = linePos
        startY = -halfLength
        endX = linePos
        endY = halfLength
      }

      const useChromaticAberration = SETTINGS.MODULES.SPHERICAL_LENS.CHROMATIC_ABERRATION && !useColor
      const chromaticOffset = useChromaticAberration ? lensRadius * 0.08 : 0

      if (useChromaticAberration) {
        // Calculate perpendicular direction for RGB separation
        const lineDirX = endX - startX
        const lineDirY = endY - startY
        const lineLen = Math.sqrt(lineDirX * lineDirX + lineDirY * lineDirY)
        const perpX = lineLen > 0 ? -lineDirY / lineLen : 0
        const perpY = lineLen > 0 ? lineDirX / lineLen : 1

        const channels = [
          { offsetX: perpX * -chromaticOffset, offsetY: perpY * -chromaticOffset, color: 'rgba(255, 0, 0, 0.7)' },
          { offsetX: 0, offsetY: 0, color: 'rgba(0, 255, 0, 0.7)' },
          { offsetX: perpX * chromaticOffset, offsetY: perpY * chromaticOffset, color: 'rgba(0, 0, 255, 0.7)' }
        ]

        channels.forEach(channel => {
          const points = this.generateDistortedLine(
            startX + channel.offsetX, startY + channel.offsetY,
            endX + channel.offsetX, endY + channel.offsetY,
            lensCenterX, lensCenterY, lensRadius,
            aberrationStrength, t
          )

          this.ctx.strokeStyle = channel.color
          this.ctx.shadowColor = channel.color

          this.ctx.beginPath()
          if (points.length > 0) {
            this.ctx.moveTo(points[0].x, points[0].y)
            for (let j = 1; j < points.length; j++) {
              this.ctx.lineTo(points[j].x, points[j].y)
            }
          }
          this.ctx.stroke()
        })
      } else {
        const points = this.generateDistortedLine(
          startX, startY, endX, endY,
          lensCenterX, lensCenterY, lensRadius,
          aberrationStrength, t
        )

        if (useColor && note) {
          this.ctx.strokeStyle = UTILS.pitchToColor(note.midi)
          this.ctx.shadowColor = this.ctx.strokeStyle
        } else {
          this.ctx.strokeStyle = SETTINGS.MODULES.SPHERICAL_LENS.LINE_COLOR
          this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
        }

        this.ctx.beginPath()
        if (points.length > 0) {
          this.ctx.moveTo(points[0].x, points[0].y)
          for (let j = 1; j < points.length; j++) {
            this.ctx.lineTo(points[j].x, points[j].y)
          }
        }
        this.ctx.stroke()
      }
    }
  }

  draw3DLens (lensCenterX, lensCenterY, lensRadius, t) {
    const depth = SETTINGS.MODULES.SPHERICAL_LENS.LENS_DEPTH || 0.3
    const rotationSpeed = 0.15
    const rotationAngle = t * rotationSpeed

    // Rotating light source creates 3D effect
    const lightX = lensCenterX + Math.cos(rotationAngle) * lensRadius * 0.4
    const lightY = lensCenterY + Math.sin(rotationAngle) * lensRadius * 0.4

    const gradient = this.ctx.createRadialGradient(
      lightX, lightY, lensRadius * 0.1,
      lensCenterX, lensCenterY, lensRadius
    )

    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(0.4, 'rgba(220, 220, 255, 0.6)')
    gradient.addColorStop(0.6, 'rgba(180, 180, 220, 0.4)')
    gradient.addColorStop(0.8, 'rgba(120, 120, 160, 0.3)')
    gradient.addColorStop(1, 'rgba(80, 80, 120, 0.2)')

    this.ctx.beginPath()
    this.ctx.arc(lensCenterX, lensCenterY, lensRadius, 0, Math.PI * 2)
    this.ctx.strokeStyle = gradient
    this.ctx.lineWidth = SETTINGS.MODULES.SPHERICAL_LENS.LENS_WIDTH
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.arc(
      lensCenterX - lensRadius * depth * 0.15,
      lensCenterY - lensRadius * depth * 0.15,
      lensRadius * 0.9,
      0, Math.PI * 2
    )
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    this.ctx.lineWidth = SETTINGS.MODULES.SPHERICAL_LENS.LENS_WIDTH * 0.4
    this.ctx.stroke()
  }

  drawPointSource (t, notes, useColor, lensCenterX, lensCenterY, lensRadius) {
    const linesPerNote = SETTINGS.MODULES.SPHERICAL_LENS.LINES_PER_NOTE
    const totalRays = Math.min(notes.length * linesPerNote, 30)
    const sourceAngle = t * SETTINGS.MODULES.SPHERICAL_LENS.ROTATION_SPEED

    const sourceX = lensCenterX + Math.cos(sourceAngle) * lensRadius
    const sourceY = lensCenterY + Math.sin(sourceAngle) * lensRadius

    const angleSpread = Math.PI / 2
    for (let i = 0; i < totalRays; i++) {
      const angle = sourceAngle - angleSpread / 2 + (i / (totalRays - 1)) * angleSpread
      const rayLength = lensRadius * 2
      const endX = sourceX + Math.cos(angle) * rayLength
      const endY = sourceY + Math.sin(angle) * rayLength

      const points = this.generateDistortedLine(
        sourceX, sourceY, endX, endY,
        lensCenterX, lensCenterY, lensRadius,
        SETTINGS.MODULES.SPHERICAL_LENS.ABERRATION_STRENGTH, t
      )

      const noteIndex = i % notes.length
      const note = notes[noteIndex]

      if (useColor && note) {
        this.ctx.strokeStyle = UTILS.pitchToColor(note.midi)
        this.ctx.shadowColor = this.ctx.strokeStyle
      } else {
        this.ctx.strokeStyle = 'rgba(255, 200, 0, 0.4)'
        this.ctx.shadowColor = 'rgba(255, 200, 0, 0.3)'
      }

      this.ctx.beginPath()
      if (points.length > 0) {
        this.ctx.moveTo(points[0].x, points[0].y)
        for (let j = 1; j < points.length; j++) {
          this.ctx.lineTo(points[j].x, points[j].y)
        }
      }
      this.ctx.stroke()
    }
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    this.dimensions = this.canvasDrawer.getDimensions()

    const { width, height } = this.dimensions
    const lensRadius = SETTINGS.MODULES.SPHERICAL_LENS.RADIUS
    const lensCenterX = SETTINGS.MODULES.SPHERICAL_LENS.CENTER_X || 0
    const lensCenterY = SETTINGS.MODULES.SPHERICAL_LENS.CENTER_Y || 0
    const orientation = SETTINGS.MODULES.SPHERICAL_LENS.ORIENTATION || 'horizontal'
    const lineLength = SETTINGS.MODULES.SPHERICAL_LENS.LINE_LENGTH || 0
    const aberrationStrength = SETTINGS.MODULES.SPHERICAL_LENS.ABERRATION_STRENGTH || 1.0
    const useColorMode = useColor !== undefined ? useColor : (SETTINGS.MODULES.SPHERICAL_LENS.USE_COLOR || false)
    const showPointSource = SETTINGS.MODULES.SPHERICAL_LENS.SHOW_POINT_SOURCE !== false

    this.canvasDrawer.applyLayoutTransform(layout)

    this.ctx.lineWidth = SETTINGS.MODULES.SPHERICAL_LENS.LINE_WIDTH
    this.ctx.shadowBlur = SETTINGS.MODULES.SPHERICAL_LENS.SHADOW_BLUR

    this.draw3DLens(lensCenterX, lensCenterY, lensRadius, t)

    this.drawLines(
      t, notes, useColorMode,
      lensCenterX, lensCenterY, lensRadius,
      orientation, lineLength, aberrationStrength
    )

    if (showPointSource) {
      this.drawPointSource(t, notes, useColorMode, lensCenterX, lensCenterY, lensRadius)
    }

    this.canvasDrawer.restoreLayoutTransform()
  }
}
