// Diamond - 3D wireframe 2-cone diamond with radial replication and deformation
import { SETTINGS, UTILS } from '../settings.js'

export class DiamondLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lastChordSignature = ''
    this.currentBaseHue = Math.floor(Math.random() * 360)
    this.baseVertices = null
    this.baseEdges = null
    this.lastConfig = null
  }

  // Generate base diamond vertices (two cones tip-to-tip)
  generateDiamondVertices (R, h, rings, segments) {
    const verts = []

    // Upper cone (tip at +h/2, base at 0)
    for (let i = 0; i <= rings; i++) {
      const t = i / rings
      const y = h / 2 - t * (h / 2) // tip -> base
      const radius = R * t // radius grows linearly from 0 to R

      for (let j = 0; j < segments; j++) {
        const theta = (j / segments) * Math.PI * 2
        const x = radius * Math.cos(theta)
        const z = radius * Math.sin(theta)

        verts.push({
          x,
          y,
          z,
          ring: i,
          seg: j,
          theta,
          isUpper: true
        })
      }
    }

    // Lower cone (tip at -h/2, base at 0) - mirror of upper
    const lowerStartIndex = verts.length
    for (let i = 0; i <= rings; i++) {
      const t = i / rings
      const y = -h / 2 + t * (h / 2) // tip -> base (mirror)
      const radius = R * t // same radius calculation

      for (let j = 0; j < segments; j++) {
        const theta = (j / segments) * Math.PI * 2
        const x = radius * Math.cos(theta)
        const z = radius * Math.sin(theta)

        verts.push({
          x,
          y,
          z,
          ring: i,
          seg: j,
          theta,
          isUpper: false
        })
      }
    }

    return { verts, rings, segments, lowerStartIndex }
  }

  // Build edges for wireframe (rings + spokes)
  buildDiamondEdges (meta) {
    const { verts, rings, segments, lowerStartIndex } = meta
    const edges = []

    // Upper cone rings (horizontal circles)
    for (let i = 0; i <= rings; i++) {
      const ringStart = i * segments
      for (let j = 0; j < segments; j++) {
        const a = ringStart + j
        const b = ringStart + ((j + 1) % segments)
        edges.push([a, b])
      }
    }

    // Upper cone spokes (longitudinal lines from tip to base)
    for (let j = 0; j < segments; j++) {
      for (let i = 0; i < rings; i++) {
        const a = i * segments + j
        const b = (i + 1) * segments + j
        edges.push([a, b])
      }
    }

    // Lower cone rings
    for (let i = 0; i <= rings; i++) {
      const ringStart = lowerStartIndex + i * segments
      for (let j = 0; j < segments; j++) {
        const a = ringStart + j
        const b = ringStart + ((j + 1) % segments)
        edges.push([a, b])
      }
    }

    // Lower cone spokes
    for (let j = 0; j < segments; j++) {
      for (let i = 0; i < rings; i++) {
        const a = lowerStartIndex + i * segments + j
        const b = lowerStartIndex + (i + 1) * segments + j
        edges.push([a, b])
      }
    }

    // Equator ring (connect upper and lower bases at y=0)
    const upperBaseStart = rings * segments
    const lowerBaseStart = lowerStartIndex + rings * segments
    for (let j = 0; j < segments; j++) {
      const a = upperBaseStart + j
      const b = lowerBaseStart + j
      edges.push([a, b])
    }

    return edges
  }

  // Transform vertex for radial replication
  transformVertexForInstance (v, instanceIndex, K, D, distanceMultiplier) {
    const angle = (instanceIndex / K) * Math.PI * 2

    // Rotate around Y axis (no time-based rotation here)
    const cosA = Math.cos(angle)
    const sinA = Math.sin(angle)
    const xr = v.x * cosA - v.z * sinA
    const zr = v.x * sinA + v.z * cosA

    // Translate outward radially with distance multiplier
    const tx = D * distanceMultiplier * Math.cos(angle)
    const tz = D * distanceMultiplier * Math.sin(angle)

    return {
      x: xr + tx,
      y: v.y,
      z: zr + tz,
      ring: v.ring,
      seg: v.seg,
      theta: v.theta,
      isUpper: v.isUpper
    }
  }

  // Apply deformation based on active notes
  applyDeformation (vertices, notes, deformationStrength, t) {
    if (notes.length === 0) return vertices

    const deformed = vertices.map(vertex => ({ ...vertex }))

    notes.forEach((note, index) => {
      const velocity = note.velocity || 64
      const midi = note.midi || 60

      const waveStrength = (velocity / 127) * deformationStrength
      const waveFreq = (midi / 127) * 0.1 + 0.05
      const waveSpeed = (midi / 127) * 0.3 + 0.1

      deformed.forEach(vertex => {
        // Per-vertex radial scale based on theta and ring position
        const u = vertex.theta // segment angle
        const v = vertex.ring / (deformed.length / (2 * 36)) // approximate ring position

        const wave1 = Math.sin(u * waveFreq + t * waveSpeed) * waveStrength
        const wave2 = Math.sin(v * waveFreq * 2 + t * waveSpeed * 1.2) * waveStrength * 0.6
        const wave3 = Math.sin(vertex.x * waveFreq * 0.5 + t * waveSpeed * 0.8) * waveStrength * 0.4

        const totalWave = (wave1 + wave2 + wave3) * 0.3
        const scale = 1 + totalWave

        // Apply radial deformation
        vertex.x *= scale
        vertex.z *= scale

        // Optional tip wobble
        if (vertex.ring === 0) {
          const tipOffset = waveStrength * 0.1 * Math.sin(t * waveSpeed + index)
          vertex.x += tipOffset * Math.cos(vertex.theta)
          vertex.z += tipOffset * Math.sin(vertex.theta)
        }
      })
    })

    return deformed
  }

  // Generate or get cached base geometry
  getBaseGeometry (R, h, rings, segments) {
    const config = `${R}-${h}-${rings}-${segments}`

    if (this.lastConfig !== config || !this.baseVertices || !this.baseEdges) {
      const meta = this.generateDiamondVertices(R, h, rings, segments)
      this.baseVertices = meta.verts
      this.baseEdges = this.buildDiamondEdges(meta)
      this.lastConfig = config
    }

    return { vertices: this.baseVertices, edges: this.baseEdges }
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const { width, height } = this.dimensions
    const R = SETTINGS.MODULES.DIAMOND.RADIUS
    const h = SETTINGS.MODULES.DIAMOND.HEIGHT
    const rings = SETTINGS.MODULES.DIAMOND.RINGS
    const segments = SETTINGS.MODULES.DIAMOND.SEGMENTS
    const K = SETTINGS.MODULES.DIAMOND.INSTANCES
    const D = SETTINGS.MODULES.DIAMOND.RADIAL_SPACING
    const distanceMultiplier = SETTINGS.MODULES.DIAMOND.INSTANCE_DISTANCE
    const scale = SETTINGS.MODULES.DIAMOND.SCALE

    this.canvasDrawer.applyLayoutTransform(layout)

    // Get base geometry (cached)
    const { vertices: baseVertices, edges: baseEdges } = this.getBaseGeometry(R, h, rings, segments)

    // Create a unique signature of active MIDI notes for color changes
    const chordSig = notes.map(n => n.midi).sort().join('-')
    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    // Set up drawing context - use pitchToColor when useColor is true
    if (useColor) {
      // Use the first note's MIDI value for color, or average if multiple notes
      const midiValue = notes.length > 0 ? notes[0].midi : 60
      this.ctx.strokeStyle = UTILS.pitchToColor(midiValue)
      this.ctx.shadowColor = this.ctx.strokeStyle
    } else {
      const baseHue = this.currentBaseHue + t * 2
      this.ctx.strokeStyle = `hsla(${baseHue}, 0%, 80%, 0.4)`
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
    }
    this.ctx.lineWidth = SETTINGS.MODULES.DIAMOND.LINE_WIDTH

    const rotationSpeed = SETTINGS.MODULES.DIAMOND.ROTATION_SPEED

    // Draw K instances of the diamond
    for (let k = 0; k < K; k++) {
      // Transform vertices for this instance (positioning only, no time-based rotation)
      const instanceVertices = baseVertices.map(vertex =>
        this.transformVertexForInstance(vertex, k, K, D, distanceMultiplier)
      )

      // Apply deformation
      const deformationStrength = SETTINGS.MODULES.DIAMOND.DEFORMATION_STRENGTH
      const deformedVertices = this.applyDeformation(instanceVertices, notes, deformationStrength, t)

      // Draw edges
      for (const [ia, ib] of baseEdges) {
        const A = deformedVertices[ia]
        const B = deformedVertices[ib]

        // Apply 3D rotation
        const [rotatedAX, rotatedAY, rotatedAZ] = UTILS.rotate3D(
          A.x * scale,
          A.y * scale,
          A.z * scale,
          t * rotationSpeed * 0.1,
          t * rotationSpeed * 0.15
        )

        const [rotatedBX, rotatedBY, rotatedBZ] = UTILS.rotate3D(
          B.x * scale,
          B.y * scale,
          B.z * scale,
          t * rotationSpeed * 0.1,
          t * rotationSpeed * 0.15
        )

        // Apply perspective projection (same as other luminodes)
        const projectedAX = rotatedAX + (rotatedAX / width) * rotatedAZ * 0.001
        const projectedAY = rotatedAY + (rotatedAY / height) * rotatedAZ * 0.001 - rotatedAZ * 0.3
        const projectedBX = rotatedBX + (rotatedBX / width) * rotatedBZ * 0.001
        const projectedBY = rotatedBY + (rotatedBY / height) * rotatedBZ * 0.001 - rotatedBZ * 0.3

        // Draw line
        this.ctx.beginPath()
        this.ctx.moveTo(projectedAX, projectedAY)
        this.ctx.lineTo(projectedBX, projectedBY)
        this.ctx.stroke()
      }
    }

    this.canvasDrawer.restoreLayoutTransform()
  }
}
