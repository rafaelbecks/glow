// Gego shape drawing module
import { SETTINGS, UTILS } from '../settings.js'

export class GegoShapeLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.gegoShapeNodes = []
    this.gegoShapeConnections = []
    this.lastChordSig = ''
  }

  draw (t, notes, layout = { x: 0, y: 0, rotation: 0 }) {
    if (!notes || notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const chordSig = notes.map(n => n.midi).sort().join('-')
    const velocityAvg = notes.reduce((a, n) => a + n.velocity, 0) / notes.length

    const numNodes = SETTINGS.MODULES.GEGO_SHAPE.BASE_NODES + notes.length * SETTINGS.MODULES.GEGO_SHAPE.NODES_PER_NOTE
    const deformAmount = 0.1 + velocityAvg * 0.2
    const baseSize = SETTINGS.MODULES.GEGO_SHAPE.BASE_SIZE
    const radius = baseSize * (1 + velocityAvg * 1.0)
    const scale = 1 + velocityAvg * 0.5

    // Only regenerate if chord changes
    if (chordSig !== this.lastChordSig) {
      this.gegoShapeNodes = []

      for (let i = 0; i < numNodes; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const r = 1

        const x = r * Math.sin(phi) * Math.cos(theta)
        const y = r * Math.sin(phi) * Math.sin(theta)
        const z = r * Math.cos(phi)
        this.gegoShapeNodes.push({ x, y, z, offset: Math.random() * 10 })
      }

      this.gegoShapeConnections = []
      for (let i = 0; i < this.gegoShapeNodes.length; i++) {
        for (let j = i + 1; j < this.gegoShapeNodes.length; j++) {
          if (Math.random() < SETTINGS.MODULES.GEGO_SHAPE.CONNECTION_PROBABILITY) {
            this.gegoShapeConnections.push([i, j])
          }
        }
      }

      this.lastChordSig = chordSig
    }

    const angle = t * 0.2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    this.canvasDrawer.applyLayoutTransform(layout)
    this.ctx.lineWidth = 0.4
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.1)'
    this.ctx.shadowBlur = 1

    this.gegoShapeConnections.forEach(([i, j]) => {
      const a = this.gegoShapeNodes[i]
      const b = this.gegoShapeNodes[j]

      const ax = a.x * cos - a.z * sin
      const az = a.x * sin + a.z * cos
      const ay = a.y + Math.sin(t * 0.001 + a.offset) * deformAmount

      const bx = b.x * cos - b.z * sin
      const bz = b.x * sin + b.z * cos
      const by = b.y + Math.sin(t * 0.001 + b.offset) * deformAmount

      const x1 = ax * radius * az * scale
      const y1 = ay * radius * az * scale
      const x2 = bx * radius * bz * scale
      const y2 = by * radius * bz * scale

      const dx = x2 - x1
      const dy = y2 - y1
      const dist = Math.sqrt(dx * dx + dy * dy)
      const r = 3 + velocityAvg * 3
      const ux = dx / dist
      const uy = dy / dist

      this.ctx.beginPath()
      this.ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.4)'
      this.ctx.moveTo(x1 + ux * r, y1 + uy * r)
      this.ctx.lineTo(x2 - ux * r, y2 - uy * r)
      this.ctx.stroke()
    })

    this.gegoShapeNodes.forEach((node) => {
      const x = node.x * cos - node.z * sin
      const z = node.x * sin + node.z * cos
      const y = node.y + Math.sin(t * 0.001 + node.offset) * deformAmount

      const px = x * radius * z * scale
      const py = y * radius * z * scale
      const dotSize = 3 + velocityAvg * 3

      this.ctx.beginPath()
      this.ctx.arc(px, py, dotSize, 0, Math.PI * 2)
      this.ctx.strokeStyle = 'hsla(0, 0%, 100%, 0.4)'
      this.ctx.lineWidth = 0.5
      this.ctx.stroke()
    })

    // Guarantee every node has at least one connection
    this.gegoShapeNodes.forEach((node, i) => {
      const hasConnection = this.gegoShapeConnections.some(([a, b]) => a === i || b === i)
      if (!hasConnection) {
        // Find closest node to connect to
        let closest = -1
        let minDist = Infinity
        for (let j = 0; j < this.gegoShapeNodes.length; j++) {
          if (i === j) continue
          const dx = node.x - this.gegoShapeNodes[j].x
          const dy = node.y - this.gegoShapeNodes[j].y
          const dz = node.z - this.gegoShapeNodes[j].z
          const dist = dx * dx + dy * dy + dz * dz
          if (dist < minDist) {
            minDist = dist
            closest = j
          }
        }
        if (closest !== -1) {
          this.gegoShapeConnections.push([i, closest])
        }
      }
    })

    this.canvasDrawer.restoreLayoutTransform()
  }
}
