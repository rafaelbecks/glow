// Ramiel - Evangelion-inspired octahedron with ray and AT field
import { SETTINGS, UTILS } from '../settings.js'

export class RamielLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lastChordSignature = ''
    this.currentBaseHue = Math.floor(Math.random() * 360)
    this.baseVertices = null
    this.baseEdges = null
    this.lastConfig = null
    this.atFieldAnimations = [] // Track AT field animations
    this.gradientOffset = 0
    this.lastNoteCount = 0
  }

  // Generate octahedron vertices (two pyramids tip-to-tip)
  generateOctahedronVertices (size) {
    const verts = []
    const s = size / 2

    // Top pyramid tip
    verts.push({ x: 0, y: s, z: 0, segment: 0, isTip: true })

    // Top pyramid base (square)
    verts.push({ x: s, y: 0, z: 0, segment: 1, isTip: false })
    verts.push({ x: 0, y: 0, z: s, segment: 1, isTip: false })
    verts.push({ x: -s, y: 0, z: 0, segment: 1, isTip: false })
    verts.push({ x: 0, y: 0, z: -s, segment: 1, isTip: false })

    // Bottom pyramid base (same square, shared)
    // Bottom pyramid tip
    verts.push({ x: 0, y: -s, z: 0, segment: 2, isTip: true })

    return verts
  }

  // Build edges for wireframe and face mapping
  buildOctahedronEdges (verts) {
    const edges = []
    const topTip = 0
    const topBase = [1, 2, 3, 4]
    const bottomTip = 5

    // Map edges to faces for shapeshifting
    const edgeToFaces = new Map()

    // Top pyramid edges (tip to base) - each belongs to one face
    topBase.forEach((i, idx) => {
      const nextBase = topBase[(idx + 1) % topBase.length]
      edges.push([topTip, i])
      // This edge belongs to two faces: [topTip, i, nextBase] and [topTip, i, prevBase]
      const prevBase = topBase[(idx - 1 + topBase.length) % topBase.length]
      const face1 = [topTip, i, nextBase].sort().join('-')
      const face2 = [topTip, i, prevBase].sort().join('-')
      edgeToFaces.set(`${topTip}-${i}`, [face1, face2])
    })

    // Top base ring - each belongs to one face
    for (let i = 0; i < topBase.length; i++) {
      const a = topBase[i]
      const b = topBase[(i + 1) % topBase.length]
      edges.push([a, b])
      // This edge belongs to face [topTip, a, b]
      const face = [topTip, a, b].sort().join('-')
      edgeToFaces.set(`${a}-${b}`, [face])
    }

    // Bottom pyramid edges (tip to base) - each belongs to one face
    topBase.forEach((i, idx) => {
      const nextBase = topBase[(idx + 1) % topBase.length]
      edges.push([bottomTip, i])
      // This edge belongs to two faces
      const prevBase = topBase[(idx - 1 + topBase.length) % topBase.length]
      const face1 = [bottomTip, i, nextBase].sort().join('-')
      const face2 = [bottomTip, i, prevBase].sort().join('-')
      edgeToFaces.set(`${bottomTip}-${i}`, [face1, face2])
    })

    return { edges, edgeToFaces }
  }

  // Apply shapeshifting: triangular faces disassemble and reassemble
  applyShapeshifting (vertices, separation, rate, t) {
    if (separation <= 0) return { vertices, faceMap: null }

    const phase = (t * rate) % (Math.PI * 2)
    const separationFactor = Math.abs(Math.sin(phase)) * separation

    // Define triangular faces for top pyramid (4 faces)
    const topFaces = [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1]
    ]

    // Define triangular faces for bottom pyramid (4 faces)
    const bottomFaces = [
      [5, 1, 2], [5, 2, 3], [5, 3, 4], [5, 4, 1]
    ]

    const allFaces = [...topFaces, ...bottomFaces]
    const result = vertices.map(v => ({ ...v }))
    
    // Create face map for edge filtering
    const faceMap = new Map()
    allFaces.forEach((face, faceIdx) => {
      const faceKey = face.sort().join('-')
      face.forEach(vertIdx => {
        if (!faceMap.has(vertIdx)) {
          faceMap.set(vertIdx, [])
        }
        faceMap.get(vertIdx).push(faceKey)
      })
    })
    
    // Calculate movement direction for each vertex (average of all faces it belongs to)
    const vertexMovements = vertices.map(() => ({ x: 0, y: 0, z: 0, count: 0 }))

    // Calculate face centers and accumulate movement for each vertex
    allFaces.forEach((face) => {
      const faceVerts = face.map(i => vertices[i])
      const centerX = faceVerts.reduce((sum, v) => sum + v.x, 0) / faceVerts.length
      const centerY = faceVerts.reduce((sum, v) => sum + v.y, 0) / faceVerts.length
      const centerZ = faceVerts.reduce((sum, v) => sum + v.z, 0) / faceVerts.length

      const dist = Math.sqrt(centerX * centerX + centerY * centerY + centerZ * centerZ)
      if (dist > 0) {
        const dirX = centerX / dist
        const dirY = centerY / dist
        const dirZ = centerZ / dist

        face.forEach(vertIndex => {
          vertexMovements[vertIndex].x += dirX
          vertexMovements[vertIndex].y += dirY
          vertexMovements[vertIndex].z += dirZ
          vertexMovements[vertIndex].count += 1
        })
      }
    })

    // Apply averaged movement to each vertex
    vertexMovements.forEach((movement, index) => {
      if (movement.count > 0) {
        const avgDirX = movement.x / movement.count
        const avgDirY = movement.y / movement.count
        const avgDirZ = movement.z / movement.count
        const dist = Math.sqrt(avgDirX * avgDirX + avgDirY * avgDirY + avgDirZ * avgDirZ)
        if (dist > 0) {
          result[index].x += (avgDirX / dist) * separationFactor
          result[index].y += (avgDirY / dist) * separationFactor
          result[index].z += (avgDirZ / dist) * separationFactor
        }
      }
    })

    return { vertices: result, faceMap }
  }

  // Draw octagonal AT field
  drawATField (x, y, size, opacity, t, followProjection = false, enableProjection = false, rotationAngle = 0, width = 0, height = 0) {
    const sides = 8
    const angleStep = (Math.PI * 2) / sides

    // Helper to project a 3D point if projection is enabled
    const projectPoint = (px, py, pz = 0) => {
      if (followProjection && enableProjection) {
        // Apply 3D rotation (same as diamond)
        const rotationAngleX = rotationAngle || 0
        const rotationAngleY = rotationAngle * 0.75 || 0
        const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
          px - x,
          py - y,
          pz,
          rotationAngleX,
          rotationAngleY
        )
        // Apply perspective projection (same as diamond)
        const projectedX = x + rotatedX + (rotatedX / width) * rotatedZ * 0.001
        const projectedY = y + rotatedY + (rotatedY / height) * rotatedZ * 0.001 - rotatedZ * 0.3
        return { x: projectedX, y: projectedY }
      }
      return { x: px, y: py }
    }

    // Outer sharp edge
    this.ctx.save()
    this.ctx.strokeStyle = `rgba(255, 140, 0, ${opacity})`
    this.ctx.lineWidth = 2
    this.ctx.shadowBlur = 0
    this.ctx.shadowColor = 'rgba(255, 140, 0, 0.8)'

    this.ctx.beginPath()
    for (let i = 0; i <= sides; i++) {
      const angle = i * angleStep
      const px = x + size * Math.cos(angle)
      const py = y + size * Math.sin(angle)
      const pz = 0 // AT field is flat in XY plane
      const projected = projectPoint(px, py, pz)
      if (i === 0) {
        this.ctx.moveTo(projected.x, projected.y)
      } else {
        this.ctx.lineTo(projected.x, projected.y)
      }
    }
    this.ctx.stroke()

    // Inner blurred glow
    this.ctx.strokeStyle = `rgba(255, 200, 100, ${opacity * 0.6})`
    this.ctx.lineWidth = 1
    this.ctx.shadowBlur = 20
    this.ctx.shadowColor = 'rgba(255, 140, 0, 0.6)'

    const innerSize = size * 0.85
    this.ctx.beginPath()
    for (let i = 0; i <= sides; i++) {
      const angle = i * angleStep
      const px = x + innerSize * Math.cos(angle)
      const py = y + innerSize * Math.sin(angle)
      const pz = 0 // AT field is flat in XY plane
      const projected = projectPoint(px, py, pz)
      if (i === 0) {
        this.ctx.moveTo(projected.x, projected.y)
      } else {
        this.ctx.lineTo(projected.x, projected.y)
      }
    }
    this.ctx.stroke()

    // Center glow (projected center)
    const centerProj = projectPoint(x, y, 0)
    const gradient = this.ctx.createRadialGradient(centerProj.x, centerProj.y, 0, centerProj.x, centerProj.y, size * 0.5)
    gradient.addColorStop(0, `rgba(255, 200, 100, ${opacity * 0.4})`)
    gradient.addColorStop(1, `rgba(255, 140, 0, 0)`)
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(centerProj.x - size, centerProj.y - size, size * 2, size * 2)

    this.ctx.restore()
  }

  // Easing function for AT field fade
  easeInOutCubic (t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  // Draw glass-like surface with moving gradients
  drawGlassSurface (vertices, edges, scale, useColor, note, t, enableProjection, rotationAngle, width, height, edgeToFaces = null, faceMap = null) {
    // Update gradient offset for moving reflection
    this.gradientOffset += 0.02

    // Set up glass-like appearance
    if (useColor && note) {
      const midi = note.midi || 60
      this.ctx.strokeStyle = UTILS.pitchToColor(midi)
      this.ctx.shadowColor = UTILS.pitchToColor(midi)
    } else {
      const baseHue = this.currentBaseHue + t * 2
      this.ctx.strokeStyle = `hsla(${baseHue}, 60%, 70%, 0.6)`
      this.ctx.shadowColor = 'rgba(200, 220, 255, 0.8)'
    }

    this.ctx.lineWidth = SETTINGS.MODULES.RAMIEL.LINE_WIDTH
    this.ctx.shadowBlur = 8

    const rotationAngleX = rotationAngle || 0
    const rotationAngleY = rotationAngle * 0.75 || 0

    // Draw edges with gradient effect
    // When shapeshifting, only draw edges within the same face
    edges.forEach(([ia, ib]) => {
      // If shapeshifting, check if edge should be drawn (only edges within same face)
      if (faceMap) {
        const vertAFaces = faceMap.get(ia) || []
        const vertBFaces = faceMap.get(ib) || []
        const commonFace = vertAFaces.find(f => vertBFaces.includes(f))
        if (!commonFace) {
          return // Skip this edge - vertices are in different separated faces
        }
      }

      const A = vertices[ia]
      const B = vertices[ib]

      let projectedAX, projectedAY, projectedBX, projectedBY

      if (enableProjection) {
        const [rotatedAX, rotatedAY, rotatedAZ] = UTILS.rotate3D(
          A.x * scale,
          A.y * scale,
          A.z * scale,
          rotationAngleX,
          rotationAngleY
        )
        const [rotatedBX, rotatedBY, rotatedBZ] = UTILS.rotate3D(
          B.x * scale,
          B.y * scale,
          B.z * scale,
          rotationAngleX,
          rotationAngleY
        )

        projectedAX = rotatedAX + (rotatedAX / width) * rotatedAZ * 0.001
        projectedAY = rotatedAY + (rotatedAY / height) * rotatedAZ * 0.001 - rotatedAZ * 0.3
        projectedBX = rotatedBX + (rotatedBX / width) * rotatedBZ * 0.001
        projectedBY = rotatedBY + (rotatedBY / height) * rotatedBZ * 0.001 - rotatedBZ * 0.3
      } else {
        projectedAX = A.x * scale
        projectedAY = A.y * scale
        projectedBX = B.x * scale
        projectedBY = B.y * scale
      }

      // Add gradient effect along edge
      const gradient = this.ctx.createLinearGradient(
        projectedAX, projectedAY,
        projectedBX, projectedBY
      )
      const offset1 = (this.gradientOffset + A.x * 0.01) % 1
      const offset2 = (this.gradientOffset + B.x * 0.01) % 1

      if (useColor && note) {
        const midi = note.midi || 60
        gradient.addColorStop(0, UTILS.pitchToColor(midi))
        gradient.addColorStop(1, UTILS.pitchToColor(midi))
      } else {
        const baseHue = this.currentBaseHue + t * 2
        gradient.addColorStop(0, `hsla(${baseHue}, 60%, 70%, ${0.4 + offset1 * 0.4})`)
        gradient.addColorStop(1, `hsla(${baseHue}, 60%, 70%, ${0.4 + offset2 * 0.4})`)
      }

      this.ctx.strokeStyle = gradient
      this.ctx.beginPath()
      this.ctx.moveTo(projectedAX, projectedAY)
      this.ctx.lineTo(projectedBX, projectedBY)
      this.ctx.stroke()
    })
  }

  // Generate or get cached base geometry
  getBaseGeometry (size) {
    const config = `${size}`

    if (this.lastConfig !== config || !this.baseVertices || !this.baseEdges) {
      this.baseVertices = this.generateOctahedronVertices(size)
      const edgeData = this.buildOctahedronEdges(this.baseVertices)
      this.baseEdges = edgeData.edges
      this.baseEdgeToFaces = edgeData.edgeToFaces
      this.lastConfig = config
    }

    return { vertices: this.baseVertices, edges: this.baseEdges, edgeToFaces: this.baseEdgeToFaces }
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    this.dimensions = this.canvasDrawer.getDimensions()
    const { width, height } = this.dimensions

    const size = SETTINGS.MODULES.RAMIEL.SIZE
    const scale = SETTINGS.MODULES.RAMIEL.SCALE
    const instances = SETTINGS.MODULES.RAMIEL.INSTANCES
    const instanceSpacing = SETTINGS.MODULES.RAMIEL.INSTANCE_SPACING
    const enableRotation = SETTINGS.MODULES.RAMIEL.ENABLE_ROTATION
    const rotationSpeed = SETTINGS.MODULES.RAMIEL.ROTATION_SPEED
    const perspective = SETTINGS.MODULES.RAMIEL.PERSPECTIVE
    const enableProjection = SETTINGS.MODULES.RAMIEL.ENABLE_PROJECTION
    const shapeshiftingMode = SETTINGS.MODULES.RAMIEL.SHAPESHIFTING_MODE
    const shapeshiftingRate = SETTINGS.MODULES.RAMIEL.SHAPESHIFTING_RATE
    const shapeshiftingAmount = SETTINGS.MODULES.RAMIEL.SHAPESHIFTING_AMOUNT
    const atFieldSize = SETTINGS.MODULES.RAMIEL.AT_FIELD_SIZE
    const atFieldDuration = SETTINGS.MODULES.RAMIEL.AT_FIELD_DURATION
    const atFieldFollowProjection = SETTINGS.MODULES.RAMIEL.AT_FIELD_FOLLOW_PROJECTION
    const enableRay = SETTINGS.MODULES.RAMIEL.ENABLE_RAY
    const rayLength = SETTINGS.MODULES.RAMIEL.RAY_LENGTH
    const rayPulseRate = SETTINGS.MODULES.RAMIEL.RAY_PULSE_RATE

    this.canvasDrawer.applyLayoutTransform(layout)

    // Get base geometry
    const { vertices: baseVertices, edges: baseEdges, edgeToFaces } = this.getBaseGeometry(size)
    const instancePerNote = SETTINGS.MODULES.RAMIEL.INSTANCE_PER_NOTE

    // Update chord signature
    const chordSig = notes.map(n => n.midi).sort().join('-')
    const noteCount = notes.length
    const isNewChord = chordSig !== this.lastChordSignature
    const isNew4PlusNote = noteCount >= 4 && (this.lastNoteCount < 4 || isNewChord)

    if (isNewChord) {
      this.lastChordSignature = chordSig
      this.currentBaseHue = Math.floor(Math.random() * 360)
    }

    // Trigger AT field when 4+ note chord is first detected
    if (isNew4PlusNote) {
      const now = Date.now()
      // Position AT field in front of diamond body at vertex edge
      // Use base vertex 1 (s, 0, 0) as reference point
      const s = (size * scale) / 2
      // Position in front of the vertex, slightly offset forward (z direction)
      const atFieldX = s * 1.2 // Slightly beyond the vertex
      const atFieldY = 0
      const atFieldZ = s * 0.3 // In front of the body
      this.atFieldAnimations.push({
        chordSig,
        startTime: now,
        x: atFieldX,
        y: atFieldY,
        z: atFieldZ
      })
    }

    this.lastNoteCount = noteCount

    // Calculate base scale for AT field (scales with diamond size, bigger than body)
    const baseScale = (size * scale) / 300 // Normalize to default size of 300
    const scaledATFieldSize = (atFieldSize * baseScale) * 1.5 // Make AT field 1.5x bigger than diamond

    // Update and draw AT fields (only for 4+ note chords, stop when chord changes)
    this.atFieldAnimations = this.atFieldAnimations.filter(anim => {
      // Stop if chord changed or not 4+ notes
      if (anim.chordSig !== chordSig || noteCount < 4) {
        return false
      }

      // Calculate elapsed time and loop it
      const elapsed = (Date.now() - anim.startTime) % atFieldDuration
      const progress = elapsed / atFieldDuration

      // Continuous loop: fade in and out
      let opacity
      if (progress < 0.5) {
        // Fade in
        opacity = this.easeInOutCubic(progress * 2)
      } else {
        // Fade out
        opacity = this.easeInOutCubic(1 - (progress - 0.5) * 2)
      }

      // Project AT field position if using 3D
      let atFieldX = anim.x
      let atFieldY = anim.y
      if (enableProjection && anim.z !== undefined) {
        // Apply rotation to AT field position
        const rotationAngleX = enableRotation ? t * rotationSpeed : perspective
        const rotationAngleY = rotationAngleX * 0.75
        const [rotatedX, rotatedY, rotatedZ] = UTILS.rotate3D(
          anim.x,
          anim.y,
          anim.z || 0,
          rotationAngleX,
          rotationAngleY
        )
        // Apply perspective projection
        atFieldX = rotatedX + (rotatedX / width) * rotatedZ * 0.001
        atFieldY = rotatedY + (rotatedY / height) * rotatedZ * 0.001 - rotatedZ * 0.3
      }

      // Scale AT field with diamond size
      this.drawATField(
        atFieldX,
        atFieldY,
        scaledATFieldSize,
        opacity,
        t,
        atFieldFollowProjection,
        enableProjection,
        enableRotation ? t * rotationSpeed : perspective,
        width,
        height
      )
      return true
    })

    // Calculate rotation angle
    const rotationAngle = enableRotation ? t * rotationSpeed : perspective

    // Determine number of instances
    const numInstances = instancePerNote ? notes.length : instances

    // Draw instances
    for (let i = 0; i < numInstances; i++) {
      const offsetX = (i - (numInstances - 1) / 2) * instanceSpacing
      const offsetY = 0

      // Transform vertices for this instance (centered on canvas)
      let instanceVertices = baseVertices.map(v => ({
        ...v,
        x: v.x + offsetX,
        y: v.y,
        z: v.z + offsetY
      }))

      // Apply shapeshifting if enabled
      let faceMap = null
      if (shapeshiftingMode) {
        const shapeshiftResult = this.applyShapeshifting(instanceVertices, shapeshiftingAmount, shapeshiftingRate, t)
        instanceVertices = shapeshiftResult.vertices
        faceMap = shapeshiftResult.faceMap
      }

      // Get note for this instance
      const note = instancePerNote ? notes[i] : notes[i % notes.length]

      // Draw glass surface
      this.drawGlassSurface(
        instanceVertices,
        baseEdges,
        scale,
        useColor,
        note,
        t,
        enableProjection,
        rotationAngle,
        width,
        height,
        edgeToFaces,
        faceMap
      )

      // Draw ray if enabled (from vertex edge)
      if (enableRay) {
        this.drawRay(
          instanceVertices,
          scale,
          rayLength,
          rayPulseRate,
          t,
          enableProjection,
          rotationAngle,
          width,
          height,
          useColor,
          note
        )
      }
    }

    this.canvasDrawer.restoreLayoutTransform()
  }

  // Draw glowing ray extending from vertex edge
  drawRay (vertices, scale, rayLength, pulseRate, t, enableProjection, rotationAngle, width, height, useColor, note) {
    // Use base vertex 1 (right side) as ray origin
    const originVertex = vertices[1] // (s, 0, 0)
    
    // Calculate pulse (on/off similar to AT field)
    const pulsePhase = (t * pulseRate) % (Math.PI * 2)
    const pulseOpacity = (Math.sin(pulsePhase) + 1) / 2 // 0 to 1
    
    if (pulseOpacity < 0.1) return // Off state

    // Get body color and invert it
    let invertedColor
    if (useColor && note) {
      const midi = note.midi || 60
      const bodyColor = UTILS.pitchToColor(midi)
      // Extract RGB from HSL color string and invert
      invertedColor = this.invertColor(bodyColor)
    } else {
      // Invert HSL: add 180 to hue, keep saturation and lightness
      const baseHue = this.currentBaseHue + t * 2
      const invertedHue = (baseHue + 180) % 360
      invertedColor = `hsla(${invertedHue}, 60%, 70%, 1.0)`
    }
    
    // Ray direction extends outward from vertex
    const directionX = originVertex.x > 0 ? 1 : -1
    const directionY = 0
    const directionZ = 0
    
    // Ray end point
    const endX = originVertex.x + directionX * rayLength * scale
    const endY = originVertex.y + directionY * rayLength * scale
    const endZ = originVertex.z + directionZ * rayLength * scale
    
    // Project points
    let originProjX, originProjY, endProjX, endProjY
    
    if (enableProjection) {
      const rotationAngleX = rotationAngle || 0
      const rotationAngleY = rotationAngle * 0.75 || 0
      
      // Project origin
      const [rotOrigX, rotOrigY, rotOrigZ] = UTILS.rotate3D(
        originVertex.x * scale,
        originVertex.y * scale,
        originVertex.z * scale,
        rotationAngleX,
        rotationAngleY
      )
      originProjX = rotOrigX + (rotOrigX / width) * rotOrigZ * 0.001
      originProjY = rotOrigY + (rotOrigY / height) * rotOrigZ * 0.001 - rotOrigZ * 0.3
      
      // Project end
      const [rotEndX, rotEndY, rotEndZ] = UTILS.rotate3D(
        endX * scale,
        endY * scale,
        endZ * scale,
        rotationAngleX,
        rotationAngleY
      )
      endProjX = rotEndX + (rotEndX / width) * rotEndZ * 0.001
      endProjY = rotEndY + (rotEndY / height) * rotEndZ * 0.001 - rotEndZ * 0.3
    } else {
      originProjX = originVertex.x * scale
      originProjY = originVertex.y * scale
      endProjX = endX * scale
      endProjY = endY * scale
    }
    
    // Draw glowing ray with inverted color
    this.ctx.save()
    
    // Convert inverted color to RGBA for gradient
    const rgbaColor = this.colorToRGBA(invertedColor, pulseOpacity)
    const rgbaColorMid = this.colorToRGBA(invertedColor, pulseOpacity * 0.7)
    const rgbaColorEnd = this.colorToRGBA(invertedColor, pulseOpacity * 0.3)
    
    // Outer bright line
    const gradient = this.ctx.createLinearGradient(originProjX, originProjY, endProjX, endProjY)
    gradient.addColorStop(0, rgbaColor)
    gradient.addColorStop(0.5, rgbaColorMid)
    gradient.addColorStop(1, rgbaColorEnd)
    
    this.ctx.strokeStyle = gradient
    this.ctx.lineWidth = 3
    this.ctx.shadowBlur = 15
    this.ctx.shadowColor = rgbaColor
    
    this.ctx.beginPath()
    this.ctx.moveTo(originProjX, originProjY)
    this.ctx.lineTo(endProjX, endProjY)
    this.ctx.stroke()
    
    // Inner core (brighter)
    const rgbaCore = this.colorToRGBA(invertedColor, pulseOpacity * 0.6)
    this.ctx.strokeStyle = rgbaCore
    this.ctx.lineWidth = 1.5
    this.ctx.shadowBlur = 25
    this.ctx.shadowColor = rgbaColor
    
    this.ctx.beginPath()
    this.ctx.moveTo(originProjX, originProjY)
    this.ctx.lineTo(endProjX, endProjY)
    this.ctx.stroke()
    
    this.ctx.restore()
  }

  // Invert color (for HSL, add 180 to hue; for RGB, invert components)
  invertColor (color) {
    // If it's an HSL color string
    if (color.includes('hsla') || color.includes('hsl')) {
      const match = color.match(/(\d+\.?\d*)/g)
      if (match && match.length >= 1) {
        const hue = parseFloat(match[0])
        const invertedHue = (hue + 180) % 360
        return color.replace(/(\d+\.?\d*)/, invertedHue.toString())
      }
    }
    // If it's an RGB color string, invert RGB values
    if (color.includes('rgba') || color.includes('rgb')) {
      const match = color.match(/(\d+\.?\d*)/g)
      if (match && match.length >= 3) {
        const r = 255 - parseInt(match[0])
        const g = 255 - parseInt(match[1])
        const b = 255 - parseInt(match[2])
        const a = match.length > 3 ? match[3] : '1'
        return `rgba(${r}, ${g}, ${b}, ${a})`
      }
    }
    return color
  }

  // Convert color string to RGBA with opacity
  colorToRGBA (color, opacity) {
    if (color.includes('rgba')) {
      return color.replace(/[\d\.]+\)$/, `${opacity})`)
    }
    if (color.includes('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${opacity})`)
    }
    if (color.includes('hsla') || color.includes('hsl')) {
      // Convert HSL to RGB (simplified)
      const match = color.match(/(\d+\.?\d*)/g)
      if (match && match.length >= 3) {
        const h = parseFloat(match[0]) / 360
        const s = parseFloat(match[1]) / 100
        const l = parseFloat(match[2]) / 100
        
        const c = (1 - Math.abs(2 * l - 1)) * s
        const x = c * (1 - Math.abs((h * 6) % 2 - 1))
        const m = l - c / 2
        
        let r, g, b
        if (h < 1/6) { r = c; g = x; b = 0 }
        else if (h < 2/6) { r = x; g = c; b = 0 }
        else if (h < 3/6) { r = 0; g = c; b = x }
        else if (h < 4/6) { r = 0; g = x; b = c }
        else if (h < 5/6) { r = x; g = 0; b = c }
        else { r = c; g = 0; b = x }
        
        r = Math.round((r + m) * 255)
        g = Math.round((g + m) * 255)
        b = Math.round((b + m) * 255)
        
        return `rgba(${r}, ${g}, ${b}, ${opacity})`
      }
    }
    return `rgba(255, 255, 255, ${opacity})`
  }
}

