// Woven net drawing module
import { SETTINGS, UTILS } from '../settings.js'

export class WovenNetLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.wovenPattern = []
    this.lastWovenChord = ''
  }

  draw (t, notes) {
    if (!notes || notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const chordSig = notes.map(n => n.midi).sort().join('-')

    if (chordSig !== this.lastWovenChord) {
      this.wovenPattern = this.generateWovenPattern(notes)
      this.lastWovenChord = chordSig
    }

    this.ctx.save()
    this.ctx.translate(this.dimensions.width / 2, this.dimensions.height / 2)

    this.wovenPattern.forEach(({ x, y, size, color }) => {
      this.canvasDrawer.drawWobblyRect(x, y, size, color)
    })

    this.ctx.restore()
  }

  generateWovenPattern (notes) {
    const gridSize = SETTINGS.MODULES.WOVEN_NET.BASE_GRID_SIZE + notes.length * SETTINGS.MODULES.WOVEN_NET.GRID_SIZE_PER_NOTE
    const spacing = SETTINGS.MODULES.WOVEN_NET.SPACING
    const pattern = []

    if (!notes || notes.length === 0) return pattern

    const shuffledNotes = [...notes].sort(() => Math.random() - 0.5)
    const baseColor = notes.length > 1 ? 'vibrant' : 'mono'
    let noteIndex = 0

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        const x = i * spacing + (Math.random() - 0.5) * 10
        const y = j * spacing + (Math.random() - 0.5) * 10
        const size = SETTINGS.MODULES.WOVEN_NET.BASE_SIZE + Math.random() * SETTINGS.MODULES.WOVEN_NET.SIZE_VARIATION

        let color = 'white'
        if (baseColor === 'vibrant' && shuffledNotes.length > 0) {
          color = UTILS.pitchToColor(shuffledNotes[noteIndex % shuffledNotes.length].midi)
          noteIndex++
        }

        pattern.push({ x, y, size, color })
      }
    }

    return pattern
  }
}
