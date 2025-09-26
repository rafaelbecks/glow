// Noise Valley - topographic terrain drawing module with noise-based generation
import { SETTINGS, UTILS } from '../settings.js'

export class NoiseValleyLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.terrainData = null
    this.lastChordSignature = ''
    this.currentBaseHue = Math.floor(Math.random() * 360)
  }

  generateTerrainData (width, height, density) {
    const cols = Math.floor(width / density)
    const rows = Math.floor(height / density)
    const terrain = []

    for (let i = 0; i < rows; i++) {
      terrain[i] = []
      for (let j = 0; j < cols; j++) {
        // Generate base height using multiple octaves of noise
        let height = 0
        let amplitude = 1
        let frequency = 0.01
        
        for (let octave = 0; octave < 4; octave++) {
          height += amplitude * this.noise(j * frequency, i * frequency)
          amplitude *= 0.5
          frequency *= 2
        }
        
        terrain[i][j] = height
      }
    }
    
    return { terrain, cols, rows }
  }

  // Simple noise function for terrain generation
  noise (x, y) {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return (n - Math.floor(n)) * 2 - 1
  }

  // Apply deformation based on active notes
  applyDeformation (terrain, notes, deformationStrength, t) {
    if (notes.length === 0) return terrain

    const deformed = terrain.map(row => [...row])
    const centerX = Math.floor(terrain[0].length / 2)
    const centerY = Math.floor(terrain.length / 2)

    notes.forEach((note, index) => {
      const velocity = note.velocity || 64
      const midi = note.midi || 60
      
      // Create deformation wave based on note properties
      const waveStrength = (velocity / 127) * deformationStrength
      const waveFreq = (midi / 127) * 0.05 + 0.02
      const waveSpeed = (midi / 127) * 0.5 + 0.1
      
      for (let i = 0; i < terrain.length; i++) {
        for (let j = 0; j < terrain[i].length; j++) {
          // Apply deformation to ALL points, not just within radius
          const x = j - centerX
          const y = i - centerY
          const distance = Math.sqrt(x * x + y * y)
          
          // Create multiple wave patterns across the entire terrain
          const wave1 = Math.sin(x * waveFreq + t * waveSpeed) * waveStrength
          const wave2 = Math.sin(y * waveFreq + t * waveSpeed * 1.3) * waveStrength * 0.7
          const wave3 = Math.sin(distance * waveFreq * 0.5 + t * waveSpeed * 0.8) * waveStrength * 0.5
          
          // Combine waves with some falloff from center for natural look
          const falloff = Math.exp(-distance * 0.01) // Gentle falloff from center
          const totalWave = (wave1 + wave2 + wave3) * falloff
          
          deformed[i][j] += totalWave
        }
      }
    })

    return deformed
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()
    
    const { width, height } = this.dimensions
    const density = SETTINGS.MODULES.NOISE_VALLEY.DENSITY
    const size = SETTINGS.MODULES.NOISE_VALLEY.SIZE
    
    // Generate or regenerate terrain data if needed
    if (!this.terrainData || this.terrainData.cols !== Math.floor(width / density)) {
      this.terrainData = this.generateTerrainData(width, height, density)
    }

    this.canvasDrawer.applyLayoutTransform(layout)

    // Apply deformation based on active notes
    const deformationStrength = SETTINGS.MODULES.NOISE_VALLEY.DEFORMATION_STRENGTH
    const deformedTerrain = this.applyDeformation(this.terrainData.terrain, notes, deformationStrength, t)

    // Create a unique signature of active MIDI notes for color changes
    const chordSig = notes.map(n => n.midi).sort().join('-')
    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    // Set up drawing context
    const baseHue = this.currentBaseHue + t * 2
    const hue = useColor ? (baseHue + notes.length * 15) % 360 : SETTINGS.MODULES.NOISE_VALLEY.BASE_HUE
    
    this.ctx.strokeStyle = useColor ? `hsla(${hue}, 80%, 60%, 0.3)` : `hsla(${hue}, 0%, 80%, 0.3)`
    this.ctx.shadowColor = useColor ? `hsla(${hue}, 80%, 70%, 0.4)` : 'rgba(255, 255, 255, 0.4)'
    this.ctx.lineWidth = SETTINGS.MODULES.NOISE_VALLEY.LINE_WIDTH

    // Draw the terrain grid
    const { terrain, cols, rows } = this.terrainData
    const scaleX = (width * size) / cols
    const scaleY = (height * size) / rows
    const heightScale = SETTINGS.MODULES.NOISE_VALLEY.HEIGHT_SCALE
    const perspective = SETTINGS.MODULES.NOISE_VALLEY.PERSPECTIVE
    const rotationSpeed = SETTINGS.MODULES.NOISE_VALLEY.ROTATION_SPEED

    // Draw horizontal lines
    for (let i = 0; i < rows; i++) {
      this.ctx.beginPath()
      for (let j = 0; j < cols; j++) {
        const x = j * scaleX - (width * size) / 2
        const y = i * scaleY - (height * size) / 2
        const z = deformedTerrain[i][j] * heightScale
        
        // Apply 3D rotation using the same approach as sphere
        const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(x, y, z, t * rotationSpeed * 0.1, t * rotationSpeed * 0.15)
        
        // Apply perspective projection
        const perspectiveX = rotatedX + (rotatedX / width) * rotatedZ * 0.001
        const perspectiveY = rotatedY + (rotatedY / height) * rotatedZ * 0.001 - rotatedZ * perspective
        
        if (j === 0) {
          this.ctx.moveTo(perspectiveX, perspectiveY)
        } else {
          this.ctx.lineTo(perspectiveX, perspectiveY)
        }
      }
      this.ctx.stroke()
    }

    // Draw vertical lines
    for (let j = 0; j < cols; j++) {
      this.ctx.beginPath()
      for (let i = 0; i < rows; i++) {
        const x = j * scaleX - (width * size) / 2
        const y = i * scaleY - (height * size) / 2
        const z = deformedTerrain[i][j] * heightScale
        
        // Apply 3D rotation using the same approach as sphere
        const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(x, y, z, t * rotationSpeed * 0.1, t * rotationSpeed * 0.15)
        
        // Apply perspective projection
        const perspectiveX = rotatedX + (rotatedX / width) * rotatedZ * 0.001
        const perspectiveY = rotatedY + (rotatedY / height) * rotatedZ * 0.001 - rotatedZ * perspective
        
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
