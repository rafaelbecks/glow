import { SETTINGS, UTILS } from '../settings.js'

export class WindmillLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.noteTimestamps = new Map()
  }

  generateBlade (spiralRadius, spiralAngle, bladeWidth, sizeVariation) {
    const center = { x: 0, y: 0, z: 0 }
    const radius = spiralRadius * sizeVariation
    
    const v1 = this.polarToCartesian(radius, spiralAngle - bladeWidth / 2)
    const v2 = this.polarToCartesian(radius, spiralAngle + bladeWidth / 2)

    return [
      center,
      { x: v1.x, y: v1.y, z: 0 },
      { x: v2.x, y: v2.y, z: 0 }
    ]
  }

  polarToCartesian (r, angle) {
    return {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle)
    }
  }

  easeOutCubic (t) {
    return 1 - Math.pow(1 - t, 3)
  }

  calculateRotation (t, noteTimestamp, baseRotationRate, accelerationDuration, chirality) {
    if (!noteTimestamp || noteTimestamp > t) {
      return t * baseRotationRate * chirality
    }

    const noteAge = t - noteTimestamp
    const accelerationFactor = SETTINGS.MODULES.WINDMILL.ACCELERATION_FACTOR || 2.0
    
    if (noteAge < accelerationDuration) {
      const progress = noteAge / accelerationDuration
      const easedProgress = this.easeOutCubic(progress)
      const startRate = baseRotationRate
      const endRate = baseRotationRate * accelerationFactor
      const avgRate = (startRate + endRate) * 0.5
      return noteAge * avgRate * chirality
    } else {
      const startRate = baseRotationRate
      const endRate = baseRotationRate * accelerationFactor
      const avgRateDuringAccel = (startRate + endRate) * 0.5
      const rotationDuringAccel = accelerationDuration * avgRateDuringAccel
      const postAccelTime = noteAge - accelerationDuration
      const rotationAfterAccel = postAccelTime * baseRotationRate * accelerationFactor
      return (rotationDuringAccel + rotationAfterAccel) * chirality
    }
  }

  drawHub (instanceX, scale, enableProjection, rotationAngle, useColor) {
    const hubRadius = SETTINGS.MODULES.WINDMILL.HUB_RADIUS || 8
    const lineWidth = SETTINGS.MODULES.WINDMILL.LINE_WIDTH
    const { width, height } = this.dimensions

    this.ctx.lineWidth = lineWidth
    if (!useColor) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
    }
    
    for (let i = 0; i < 2; i++) {
      const radius = hubRadius * (i === 0 ? 1 : 0.6)
      this.ctx.beginPath()
      
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
        const x = radius * Math.cos(angle) + instanceX
        const y = radius * Math.sin(angle)
        const z = 0

        let finalX, finalY

        if (enableProjection) {
          const rotationAngleX = rotationAngle
          const rotationAngleY = rotationAngle * 0.75
          const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
            x * scale,
            y * scale,
            z * scale,
            rotationAngleX,
            rotationAngleY
          )
          finalX = rotatedX + (rotatedX / width) * rotatedZ * 0.001
          finalY = rotatedY + (rotatedY / height) * rotatedZ * 0.001 - rotatedZ * 0.2
        } else {
          finalX = x * scale
          finalY = y * scale
        }

        if (angle === 0) {
          this.ctx.moveTo(finalX, finalY)
        } else {
          this.ctx.lineTo(finalX, finalY)
        }
      }
      
      this.ctx.closePath()
      this.ctx.stroke()
    }
  }

  drawWindmillInstance (notes, instanceIndex, instanceCount, spacing, t, useColor) {
    if (notes.length === 0) return

    const baseRadius = SETTINGS.MODULES.WINDMILL.RADIUS
    const baseRotationRate = SETTINGS.MODULES.WINDMILL.ROTATION_RATE
    const chirality = SETTINGS.MODULES.WINDMILL.CHIRALITY || 1
    const depth = SETTINGS.MODULES.WINDMILL.DEPTH
    const scale = SETTINGS.MODULES.WINDMILL.SCALE || 1.0
    const lineWidth = SETTINGS.MODULES.WINDMILL.LINE_WIDTH
    const accelerationDuration = SETTINGS.MODULES.WINDMILL.ACCELERATION_DURATION || 1.0
    const enableProjection = SETTINGS.MODULES.WINDMILL.ENABLE_PROJECTION !== false
    const rotationAngle = SETTINGS.MODULES.WINDMILL.PERSPECTIVE || 0.2
    const bladeMultiplier = SETTINGS.MODULES.WINDMILL.BLADE_MULTIPLIER || 1
    const spiralScale = SETTINGS.MODULES.WINDMILL.SPIRAL_SCALE || 8
    const goldenAngle = SETTINGS.MODULES.WINDMILL.GOLDEN_ANGLE || (Math.PI * (3 - Math.sqrt(5)))
    const sizeVariationAmount = SETTINGS.MODULES.WINDMILL.SIZE_VARIATION || 0.15
    const bladeWidthBase = SETTINGS.MODULES.WINDMILL.BLADE_WIDTH || 0.3

    const allBlades = []
    notes.forEach((note, noteIndex) => {
      for (let m = 0; m < bladeMultiplier; m++) {
        allBlades.push({ note, noteIndex, multiplierIndex: m })
      }
    })

    const bladeCount = allBlades.length
    const instanceX = (instanceIndex - (instanceCount - 1) / 2) * spacing

    let oldestTimestamp = null
    notes.forEach(note => {
      const noteKey = `${note.midi}-${note.timestamp || 0}`
      if (!this.noteTimestamps.has(noteKey)) {
        const timestampSeconds = note.timestamp ? note.timestamp / 1000 : t
        this.noteTimestamps.set(noteKey, timestampSeconds)
      }
      const timestamp = this.noteTimestamps.get(noteKey)
      if (!oldestTimestamp || timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp
      }
    })

    const rotation = this.calculateRotation(t, oldestTimestamp, baseRotationRate, accelerationDuration, chirality)

    allBlades.forEach((bladeData, bladeIndex) => {
      const { note, noteIndex, multiplierIndex } = bladeData
      const midi = note.midi || 60
      const velocity = note.velocity || 64
      const velocityFactor = velocity / 127

      const i = bladeIndex
      const spiralAngle = i * goldenAngle + rotation
      const spiralRadius = baseRadius * (0.3 + spiralScale * Math.sqrt(i + 1) / Math.sqrt(bladeCount))
      
      const sizeVariation = 1.0 + sizeVariationAmount * Math.sin(spiralAngle * 2) * (0.5 + velocityFactor * 0.5)
      const bladeWidth = bladeWidthBase * (0.8 + 0.4 * Math.sqrt(i + 1) / Math.sqrt(bladeCount))

      const blade = this.generateBlade(spiralRadius, spiralAngle, bladeWidth, sizeVariation)

      const translatedBlade = blade.map(v => ({
        x: v.x + instanceX,
        y: v.y,
        z: v.z
      }))

      const depthBlade = translatedBlade.map((v, idx) => {
        const phase = (bladeIndex / bladeCount) * Math.PI * 2
        return {
          x: v.x,
          y: v.y,
          z: phase * depth
        }
      })

      if (useColor) {
        this.ctx.strokeStyle = UTILS.pitchToColor(midi)
        this.ctx.shadowColor = UTILS.pitchToColor(midi)
      } else {
        const alpha = 0.4 + velocityFactor * 0.3
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
      }

      this.ctx.lineWidth = lineWidth
      const { width, height } = this.dimensions

      const [rotatedA, rotatedB, rotatedC] = depthBlade.map(v => {
        let finalX, finalY

        if (enableProjection) {
          const rotationAngleX = rotationAngle
          const rotationAngleY = rotationAngle * 0.75
          const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
            v.x * scale,
            v.y * scale,
            v.z * scale,
            rotationAngleX,
            rotationAngleY
          )
          finalX = rotatedX + (rotatedX / width) * rotatedZ * 0.001
          finalY = rotatedY + (rotatedY / height) * rotatedZ * 0.001 - rotatedZ * 0.2
        } else {
          finalX = v.x * scale
          finalY = v.y * scale
        }

        return { x: finalX, y: finalY }
      })

      this.ctx.beginPath()
      this.ctx.moveTo(rotatedA.x, rotatedA.y)
      this.ctx.lineTo(rotatedB.x, rotatedB.y)
      this.ctx.stroke()

      this.ctx.beginPath()
      this.ctx.moveTo(rotatedB.x, rotatedB.y)
      this.ctx.lineTo(rotatedC.x, rotatedC.y)
      this.ctx.stroke()

      this.ctx.beginPath()
      this.ctx.moveTo(rotatedC.x, rotatedC.y)
      this.ctx.lineTo(rotatedA.x, rotatedA.y)
      this.ctx.stroke()
    })

    this.drawHub(instanceX, scale, enableProjection, rotationAngle, useColor)

    const cleanupTime = t - 10
    this.noteTimestamps.forEach((timestamp, key) => {
      if (timestamp < cleanupTime) {
        this.noteTimestamps.delete(key)
      }
    })
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    this.dimensions = this.canvasDrawer.getDimensions()
    this.canvasDrawer.applyLayoutTransform(layout)

    const instanceCount = SETTINGS.MODULES.WINDMILL.INSTANCE_COUNT || 1
    const spacing = SETTINGS.MODULES.WINDMILL.SPACING

    for (let i = 0; i < instanceCount; i++) {
      this.drawWindmillInstance(notes, i, instanceCount, spacing, t, useColor)
    }

    this.canvasDrawer.restoreLayoutTransform()
  }
}

