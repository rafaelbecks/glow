// ClaviluxLuminode - Thomas Wilfred-like light compositions
import { SETTINGS, UTILS } from '../settings.js'

export class ClaviluxLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lightForms = []
    this.activeNotes = new Map() // Track active MIDI notes
  }

  draw (t, notes, layout = { x: 0, y: 0, rotation: 0 }) {
    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    // Apply layout transform
    this.canvasDrawer.applyLayoutTransform(layout)

    // Set additive blending mode for light beam effects
    this.ctx.globalCompositeOperation = 'lighter'

    // Handle MIDI notes - create and update light forms
    this.handleMIDINotes(t, notes)

    // Update and render all light forms
    this.updateLightForms(t)
    this.renderLightForms()

    // Restore normal blending mode
    this.ctx.globalCompositeOperation = 'source-over'

    // Restore layout transform
    this.canvasDrawer.restoreLayoutTransform()
  }

  handleMIDINotes (t, notes) {
    const config = SETTINGS.MODULES.CLAVILUX
    const currentNoteIds = new Set()

    // Process each active note
    notes.forEach(({ midi, velocity, timestamp }) => {
      const noteId = midi
      currentNoteIds.add(noteId)

      // If this note is new, create light forms for it
      if (!this.activeNotes.has(noteId)) {
        this.createLightForm(midi, velocity, t, config)
        this.activeNotes.set(noteId, { timestamp, velocity })
      }
    })

    // Remove light forms for notes that are no longer active
    const notesToRemove = []
    this.activeNotes.forEach((noteData, noteId) => {
      if (!currentNoteIds.has(noteId)) {
        notesToRemove.push(noteId)
      }
    })

    notesToRemove.forEach(noteId => {
      this.fadeOutLightFormsForNote(noteId, t)
      this.activeNotes.delete(noteId)
    })
  }

  createLightForm (midi, velocity, t, config) {
    const brightness = velocity / 127
    const alpha = 0.3 + brightness * 0.4

    const lightForm = {
      id: `${midi}-${t}`,
      noteId: midi,
      x: (Math.random() - 0.5) * config.CENTER_AREA,
      y: (Math.random() - 0.5) * config.CENTER_AREA,
      size: config.BASE_SIZE + Math.random() * config.SIZE_VARIATION,
      color: UTILS.pitchToColor(midi),
      originalAlpha: alpha * (0.7 + Math.random() * 0.6),
      currentAlpha: alpha * (0.7 + Math.random() * 0.6),
      // Gentle floating motion - no edge wrapping
      dx: (Math.random() - 0.5) * config.FLOAT_SPEED,
      dy: (Math.random() - 0.5) * config.FLOAT_SPEED,
      created: t,
      fadeStart: null,
      isFading: false,
      // Generate irregular shape once
      shapePoints: this.generateIrregularShape(config.BASE_SIZE + Math.random() * config.SIZE_VARIATION)
    }

    this.lightForms.push(lightForm)

    // Limit total light forms
    if (this.lightForms.length > config.MAX_FORMS) {
      this.lightForms = this.lightForms.slice(-config.MAX_FORMS)
    }
  }

  fadeOutLightFormsForNote (noteId, t) {
    this.lightForms.forEach(lightForm => {
      if (lightForm.noteId === noteId && !lightForm.isFading) {
        lightForm.isFading = true
        lightForm.fadeStart = t
      }
    })
  }

  updateLightForms (t) {
    const config = SETTINGS.MODULES.CLAVILUX
    const dt = 16 // Assume 60fps

    this.lightForms = this.lightForms.filter(lightForm => {
      // Gentle floating motion - keep within center area
      lightForm.x += lightForm.dx * dt
      lightForm.y += lightForm.dy * dt

      // Keep within center bounds - no edge wrapping
      const maxDistance = config.CENTER_AREA / 2
      if (Math.abs(lightForm.x) > maxDistance) {
        lightForm.dx *= -0.8 // Bounce back gently
        lightForm.x = Math.sign(lightForm.x) * maxDistance
      }
      if (Math.abs(lightForm.y) > maxDistance) {
        lightForm.dy *= -0.8 // Bounce back gently
        lightForm.y = Math.sign(lightForm.y) * maxDistance
      }

      // Handle fading out - FIXED: proper fade calculation
      if (lightForm.isFading && lightForm.fadeStart) {
        const fadeProgress = (t - lightForm.fadeStart) / (config.FADE_DURATION / 1000) // Convert to seconds
        if (fadeProgress >= 1) {
          return false // Remove light form
        }
        // Calculate new alpha based on fade progress
        lightForm.currentAlpha = lightForm.originalAlpha * (1 - fadeProgress)
      }

      return true
    })
  }

  renderLightForms () {
    this.lightForms.forEach(lightForm => {
      this.renderLightForm(lightForm)
    })
  }

  renderLightForm (lightForm) {
    const { x, y, color, currentAlpha, shapePoints, size } = lightForm

    // Extract base color and apply current alpha
    const baseColor = color.replace(/,\s*[\d.]+\)$/, '') // Remove existing alpha
    const lightColor = `${baseColor}, ${currentAlpha})`

    // Create a temporary canvas for blur effect
    const blurCanvas = document.createElement('canvas')
    const blurSize = size * 3 // Make blur canvas 3x the size for proper blur
    blurCanvas.width = blurSize
    blurCanvas.height = blurSize
    const blurCtx = blurCanvas.getContext('2d')

    // Set up blur canvas with shadow blur
    blurCtx.fillStyle = lightColor
    blurCtx.shadowColor = lightColor
    blurCtx.shadowBlur = size * 2 // Heavy blur for the shape itself
    blurCtx.shadowOffsetX = 0
    blurCtx.shadowOffsetY = 0

    // Draw the shape on the blur canvas
    blurCtx.beginPath()

    if (shapePoints && shapePoints.length > 0) {
      const centerX = blurSize / 2
      const centerY = blurSize / 2
      blurCtx.moveTo(centerX + shapePoints[0].x, centerY + shapePoints[0].y)
      for (let i = 1; i < shapePoints.length; i++) {
        blurCtx.lineTo(centerX + shapePoints[i].x, centerY + shapePoints[i].y)
      }
      blurCtx.closePath()
    } else {
      // Fallback to circle if no shape points
      blurCtx.arc(blurSize / 2, blurSize / 2, size, 0, Math.PI * 2)
    }

    blurCtx.fill()

    // Draw the blurred shape onto the main canvas
    this.ctx.drawImage(
      blurCanvas,
      x - blurSize / 2,
      y - blurSize / 2,
      blurSize,
      blurSize
    )
  }

  generateIrregularShape (size) {
    const points = []
    const numPoints = 8 + Math.floor(Math.random() * 6) // 8-13 points
    const irregularity = 0.3 + Math.random() * 0.4 // 0.3-0.7 irregularity

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2

      // Create organic variation
      const baseRadius = size * (0.7 + Math.random() * 0.6) // 0.7-1.3 of size
      const irregularRadius = baseRadius * (1 + (Math.random() - 0.5) * irregularity)

      points.push({
        x: Math.cos(angle) * irregularRadius,
        y: Math.sin(angle) * irregularRadius
      })
    }

    return points
  }
}
