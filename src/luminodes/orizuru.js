import { SETTINGS, UTILS } from '../settings.js'
import { ORIZURU_SVG_DATA, ORIZURU_UNFOLDED_OBJ, ORIZURU_FOLDED_OBJ, ORIZURU_FACE_DATA } from './orizuru-patterns.js'

export class OrizuruLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.dimensions = canvasDrawer.getDimensions()
    this.flatVertices = null
    this.unfoldedVertices = null
    this.foldedVertices = null
    this.edges = null
    this.edgeCreaseTypes = null
    this.vertexMapping = null
    this.init()
  }

  init () {
    this.loadSVGData()
    this.parseOBJData()
    this.createVertexMapping()
    this.buildEdges()
  }

  loadSVGData () {
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(ORIZURU_SVG_DATA, 'image/svg+xml')
    const lines = svgDoc.querySelectorAll('line')
    
    const viewBox = svgDoc.querySelector('svg').getAttribute('viewBox').split(' ').map(Number)
    const [vbX, vbY, vbWidth, vbHeight] = viewBox
    const centerX = vbX + vbWidth / 2
    const centerY = vbY + vbHeight / 2
    const maxDim = Math.max(vbWidth, vbHeight)
    
    this.svgLines = []
    lines.forEach(line => {
      const x1 = parseFloat(line.getAttribute('x1'))
      const y1 = parseFloat(line.getAttribute('y1'))
      const x2 = parseFloat(line.getAttribute('x2'))
      const y2 = parseFloat(line.getAttribute('y2'))
      const stroke = line.getAttribute('stroke') || '#000'
      const opacity = parseFloat(line.getAttribute('opacity') || '1')
      
      // Determine crease type from color
      // Red (#f00, #ff0000) = mountain, Blue (#00f, #0000ff) = valley, Yellow (#ff0, #ffff00) = facet
      let creaseType = 'facet' // default
      const strokeLower = stroke.toLowerCase()
      if (strokeLower === '#f00' || strokeLower === '#ff0000' || strokeLower === 'red') {
        creaseType = 'mountain'
      } else if (strokeLower === '#00f' || strokeLower === '#0000ff' || strokeLower === 'blue') {
        creaseType = 'valley'
      } else if (strokeLower === '#ff0' || strokeLower === '#ffff00' || strokeLower === 'yellow') {
        creaseType = 'facet'
      }
      
      this.svgLines.push({
        x1: (x1 - centerX) / maxDim,
        y1: (y1 - centerY) / maxDim,
        x2: (x2 - centerX) / maxDim,
        y2: (y2 - centerY) / maxDim,
        stroke,
        opacity,
        creaseType
      })
    })
    
    const vertexMap = new Map()
    this.svgLines.forEach(line => {
      const key1 = `${Math.round(line.x1 * 100) / 100},${Math.round(line.y1 * 100) / 100}`
      const key2 = `${Math.round(line.x2 * 100) / 100},${Math.round(line.y2 * 100) / 100}`
      
      if (!vertexMap.has(key1)) {
        vertexMap.set(key1, { x: line.x1, y: line.y1, z: 0 })
      }
      if (!vertexMap.has(key2)) {
        vertexMap.set(key2, { x: line.x2, y: line.y2, z: 0 })
      }
    })
    
    this.flatVertices = Array.from(vertexMap.values())
  }

  parseOBJVertices (objData) {
    const lines = objData.split('\n').filter(line => line.trim().startsWith('v '))
    const rawVertices = lines.map((line) => {
      const parts = line.trim().split(/\s+/)
      return {
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3])
      }
    })

    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    let minZ = Infinity, maxZ = -Infinity

    rawVertices.forEach(v => {
      minX = Math.min(minX, v.x)
      maxX = Math.max(maxX, v.x)
      minY = Math.min(minY, v.y)
      maxY = Math.max(maxY, v.y)
      minZ = Math.min(minZ, v.z)
      maxZ = Math.max(maxZ, v.z)
    })

    const rangeX = maxX - minX
    const rangeY = maxY - minY
    const rangeZ = maxZ - minZ
    const maxRange = Math.max(rangeX, rangeY, rangeZ)
    const scale = maxRange > 0 ? 1 / maxRange : 1
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const centerZ = (minZ + maxZ) / 2

    return rawVertices.map((v, idx) => ({
      x: (v.x - centerX) * scale,
      y: (v.y - centerY) * scale,
      z: (v.z - centerZ) * scale,
      idx
    }))
  }

  parseOBJData () {
    // Parse unfolded vertices (0 state)
    this.unfoldedVertices = this.parseOBJVertices(ORIZURU_UNFOLDED_OBJ)
    
    // Parse folded vertices (1 state)
    this.foldedVertices = this.parseOBJVertices(ORIZURU_FOLDED_OBJ)

    // Parse face data to build edges
    const faceLines = ORIZURU_FACE_DATA.split('\n').filter(line => line.trim().startsWith('f '))
    const edgeSet = new Set()
    
    faceLines.forEach(line => {
      const parts = line.trim().split(/\s+/)
      const v1 = parseInt(parts[1].split('/')[0]) - 1
      const v2 = parseInt(parts[2].split('/')[0]) - 1
      const v3 = parseInt(parts[3].split('/')[0]) - 1
      
      const e1 = v1 < v2 ? `${v1},${v2}` : `${v2},${v1}`
      const e2 = v2 < v3 ? `${v2},${v3}` : `${v3},${v2}`
      const e3 = v1 < v3 ? `${v1},${v3}` : `${v3},${v1}`
      
      edgeSet.add(e1)
      edgeSet.add(e2)
      edgeSet.add(e3)
    })
    
    this.edges = Array.from(edgeSet).map(edge => {
      const [v1, v2] = edge.split(',').map(Number)
      return { v1, v2 }
    })
    
    // Map edges to crease types from SVG lines and build vertex crease influence
    this.edgeCreaseTypes = new Map()
    this.vertexCreaseInfluence = [] // Array of maps: [{mountain: count, valley: count, facet: count}, ...]
    
    if (this.svgLines && this.unfoldedVertices) {
      // Initialize vertex crease influence
      this.vertexCreaseInfluence = this.unfoldedVertices.map(() => ({
        mountain: 0,
        valley: 0,
        facet: 0
      }))
      
      // For each edge, try to find matching SVG line and get its crease type
      this.edges.forEach(edge => {
        const v1 = this.unfoldedVertices[edge.v1]
        const v2 = this.unfoldedVertices[edge.v2]
        if (!v1 || !v2) return
        
        // Find closest SVG line
        let bestMatch = null
        let bestDist = Infinity
        
        this.svgLines.forEach(svgLine => {
          const dist1 = Math.sqrt(
            Math.pow(svgLine.x1 - v1.x, 2) + Math.pow(svgLine.y1 - v1.y, 2)
          ) + Math.sqrt(
            Math.pow(svgLine.x2 - v2.x, 2) + Math.pow(svgLine.y2 - v2.y, 2)
          )
          const dist2 = Math.sqrt(
            Math.pow(svgLine.x1 - v2.x, 2) + Math.pow(svgLine.y1 - v2.y, 2)
          ) + Math.sqrt(
            Math.pow(svgLine.x2 - v1.x, 2) + Math.pow(svgLine.y2 - v1.y, 2)
          )
          const dist = Math.min(dist1, dist2)
          
          if (dist < bestDist && dist < 0.1) {
            bestDist = dist
            bestMatch = svgLine.creaseType
          }
        })
        
        if (bestMatch) {
          const edgeKey = `${edge.v1},${edge.v2}`
          this.edgeCreaseTypes.set(edgeKey, bestMatch)
          
          // Update vertex crease influence
          if (this.vertexCreaseInfluence[edge.v1]) {
            this.vertexCreaseInfluence[edge.v1][bestMatch]++
          }
          if (this.vertexCreaseInfluence[edge.v2]) {
            this.vertexCreaseInfluence[edge.v2][bestMatch]++
          }
        }
      })
    }
  }

  createVertexMapping () {
    if (!this.flatVertices || this.flatVertices.length === 0) {
      this.vertexMapping = this.foldedVertices.map((_, idx) => idx)
      return
    }

    this.vertexMapping = []
    const usedFlatIndices = new Set()

    this.foldedVertices.forEach((foldedVert, foldedIdx) => {
      let bestMatch = -1
      let bestDist = Infinity

      this.flatVertices.forEach((flatVert, flatIdx) => {
        if (usedFlatIndices.has(flatIdx)) return

        const fx = flatVert.x
        const fy = flatVert.y
        const fz = 0

        const dist = Math.sqrt(
          Math.pow(fx - foldedVert.x, 2) +
          Math.pow(fy - foldedVert.y, 2) +
          Math.pow(fz - foldedVert.z, 2)
        )

        if (dist < bestDist) {
          bestDist = dist
          bestMatch = flatIdx
        }
      })

      if (bestMatch >= 0 && bestDist < 0.5) {
        this.vertexMapping[foldedIdx] = bestMatch
        usedFlatIndices.add(bestMatch)
      } else {
        this.vertexMapping[foldedIdx] = -1
      }
    })
  }

  buildEdges () {
    if (this.edges) return
    this.edges = []
    for (let i = 0; i < this.foldedVertices.length; i++) {
      for (let j = i + 1; j < this.foldedVertices.length; j++) {
        const v1 = this.foldedVertices[i]
        const v2 = this.foldedVertices[j]
        const dist = Math.sqrt(
          Math.pow(v1.x - v2.x, 2) +
          Math.pow(v1.y - v2.y, 2) +
          Math.pow(v1.z - v2.z, 2)
        )
        if (dist < 0.3) {
          this.edges.push({ v1: i, v2: j })
        }
      }
    }
  }

  getInterpolatedVertices (foldProgress) {
    if (!this.foldedVertices || !this.unfoldedVertices) return []

    const foldAmount = Math.max(0, Math.min(1, foldProgress))
    const vertices = []

    // Direct interpolation from unfolded to folded, using crease types to guide morphing
    this.foldedVertices.forEach((foldedVert, idx) => {
      let unfoldedVert = { x: 0, y: 0, z: 0 }

      if (this.unfoldedVertices && idx < this.unfoldedVertices.length) {
        unfoldedVert = this.unfoldedVertices[idx]
      } else {
        unfoldedVert = { x: foldedVert.x, y: foldedVert.y, z: 0 }
      }

      // Get crease type influence for this vertex
      const creaseInfluence = this.vertexCreaseInfluence && this.vertexCreaseInfluence[idx]
        ? this.vertexCreaseInfluence[idx]
        : { mountain: 0, valley: 0, facet: 1 }
      
      const totalInfluence = creaseInfluence.mountain + creaseInfluence.valley + creaseInfluence.facet
      
      // Calculate crease-based easing factor
      // Mountain and valley creases should fold more aggressively, facets stay flatter
      let easingFactor = foldAmount
      
      if (totalInfluence > 0) {
        const mountainRatio = creaseInfluence.mountain / totalInfluence
        const valleyRatio = creaseInfluence.valley / totalInfluence
        const facetRatio = creaseInfluence.facet / totalInfluence
        
        // Mountain and valley creases use more aggressive easing (faster initial, slower end)
        // Facet creases use gentler easing (slower initial, faster end)
        if (mountainRatio + valleyRatio > facetRatio) {
          // More active creases - use ease-in-out-cubic for smoother start
          easingFactor = foldAmount < 0.5
            ? 4 * foldAmount * foldAmount * foldAmount
            : 1 - Math.pow(-2 * foldAmount + 2, 3) / 2
        } else {
          // More facet creases - use smoothstep for gentler transition
          easingFactor = foldAmount * foldAmount * (3 - 2 * foldAmount)
        }
      } else {
        // Default smoothstep
        easingFactor = foldAmount * foldAmount * (3 - 2 * foldAmount)
      }

      // Interpolate directly from unfolded to folded
      const result = {
        x: unfoldedVert.x + (foldedVert.x - unfoldedVert.x) * easingFactor,
        y: unfoldedVert.y + (foldedVert.y - unfoldedVert.y) * easingFactor,
        z: unfoldedVert.z + (foldedVert.z - unfoldedVert.z) * easingFactor
      }
      
      vertices.push(result)
    })

    return vertices
  }

  // Apply 3D rotation based on X and Y angles
  applyRotation (x, y, z, xAngle, yAngle) {
    // First rotate around Y axis
    const cosY = Math.cos(yAngle)
    const sinY = Math.sin(yAngle)
    const rotX1 = x * cosY - z * sinY
    const rotZ1 = x * sinY + z * cosY
    const rotY1 = y

    // Then rotate around X axis
    const cosX = Math.cos(xAngle)
    const sinX = Math.sin(xAngle)
    const rotY2 = rotY1 * cosX - rotZ1 * sinX
    const rotZ2 = rotY1 * sinX + rotZ1 * cosX

    return { x: rotX1, y: rotY2, z: rotZ2 }
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    this.dimensions = this.canvasDrawer.getDimensions()
    const { width, height } = this.dimensions
    
    // Get context after layout transform is applied
    this.canvasDrawer.applyLayoutTransform(layout)
    const ctx = this.canvasDrawer.getContext()

    const foldAmount = SETTINGS.MODULES.ORIZURU.FOLD_AMOUNT !== undefined ? SETTINGS.MODULES.ORIZURU.FOLD_AMOUNT : 1.0
    const scale = SETTINGS.MODULES.ORIZURU.SCALE || 200
    const lineWidth = SETTINGS.MODULES.ORIZURU.LINE_WIDTH || 1.0
    const xRotation = SETTINGS.MODULES.ORIZURU.PERSPECTIVE !== undefined ? SETTINGS.MODULES.ORIZURU.PERSPECTIVE : 3.0
    const yRotation = SETTINGS.MODULES.ORIZURU.Y_ROTATION !== undefined ? SETTINGS.MODULES.ORIZURU.Y_ROTATION : 0.0
    const projectionDepth = SETTINGS.MODULES.ORIZURU.PROJECTION_DEPTH || 0.3
    const useColorMode = SETTINGS.MODULES.ORIZURU.USE_COLOR !== undefined ? SETTINGS.MODULES.ORIZURU.USE_COLOR : useColor
    const instances = SETTINGS.MODULES.ORIZURU.INSTANCES || 1
    const spatialRadius = instances > 1 ? (SETTINGS.MODULES.ORIZURU.SPATIAL_RADIUS || 200) : 0

    // Always use 3D projection for smoother transitions
    const enableProjection = SETTINGS.MODULES.ORIZURU.ENABLE_PROJECTION !== false

    ctx.lineWidth = lineWidth

    let colorPalette = []
    if (useColorMode && notes.length > 0) {
      colorPalette = notes.map(note => UTILS.pitchToColor(note.midi || 60))
    }

    for (let instanceIndex = 0; instanceIndex < instances; instanceIndex++) {
      // Only apply spatial radius offset when there are multiple instances
      // When instances = 1, it should be centered (no offset)
      let offsetX = 0
      let offsetY = 0
      
      if (instances > 1) {
        const angle = (instanceIndex / instances) * Math.PI * 2
        offsetX = spatialRadius * Math.cos(angle)
        offsetY = spatialRadius * Math.sin(angle)
      }

      ctx.save()
      ctx.translate(offsetX, offsetY)

      // Always use 3D structure for smooth morphing, even when unfolded
      // This treats the SVG as a 3D paper plane
      if (!this.foldedVertices || !this.edges) {
        ctx.restore()
        continue
      }

      const interpolatedVertices = this.getInterpolatedVertices(foldAmount)

        this.edges.forEach(edge => {
          const v1 = interpolatedVertices[edge.v1]
          const v2 = interpolatedVertices[edge.v2]

          if (!v1 || !v2) return

          // Scale vertices
          let x1 = v1.x * scale
          let y1 = v1.y * scale
          let z1 = v1.z * scale
          let x2 = v2.x * scale
          let y2 = v2.y * scale
          let z2 = v2.z * scale

          // Apply rotation (both X and Y)
          const rot1 = this.applyRotation(x1, y1, z1, xRotation, yRotation)
          const rot2 = this.applyRotation(x2, y2, z2, xRotation, yRotation)

          let p1, p2
          if (enableProjection) {
            // Apply 3D projection for depth effect
            p1 = {
              x: rot1.x + (rot1.x / width) * rot1.z * projectionDepth * 0.001,
              y: rot1.y + (rot1.y / height) * rot1.z * projectionDepth * 0.001 - rot1.z * 0.2
            }
            p2 = {
              x: rot2.x + (rot2.x / width) * rot2.z * projectionDepth * 0.001,
              y: rot2.y + (rot2.y / height) * rot2.z * projectionDepth * 0.001 - rot2.z * 0.2
            }
          } else {
            p1 = { x: rot1.x, y: rot1.y }
            p2 = { x: rot2.x, y: rot2.y }
          }

          // Use standard color rendering (no crease type colors)
          if (useColorMode && colorPalette.length > 0) {
            const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)]
            ctx.strokeStyle = randomColor
            ctx.shadowColor = randomColor
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
          }

          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        })

      ctx.restore()
    }

    this.canvasDrawer.restoreLayoutTransform()
  }
}
