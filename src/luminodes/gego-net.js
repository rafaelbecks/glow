// Gego net drawing module
import { SETTINGS } from '../settings.js'

export class GegoNetLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.gegoNodes = []
    this.gegoConnections = []
    this.lastChordSig = ''
  }

  draw (t, notes, layout = { x: 0, y: 0, rotation: 0 }) {
    if (!notes || notes.length === 0) return

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions()

    const chordSig = notes.map(n => n.midi).sort().join('-')
    const velocityAvg = notes.reduce((acc, n) => acc + n.velocity, 0) / notes.length

    const nodeCount = SETTINGS.MODULES.GEGO_NET.BASE_NODES + notes.length * SETTINGS.MODULES.GEGO_NET.NODES_PER_NOTE
    const deformAmount = 2 + velocityAvg * 4
    const scaleFactor = 1 + velocityAvg * 1.2

    if (chordSig !== this.lastChordSig) {
      this.gegoNodes = []
      this.gegoConnections = []

      for (let i = 0; i < nodeCount; i++) {
        this.gegoNodes.push({
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
          z: Math.random() * 0.8 + 0.2,
          offset: Math.random() * 10
        })
      }

      for (let i = 0; i < this.gegoNodes.length; i++) {
        const connections = []
        for (let j = 0; j < this.gegoNodes.length; j++) {
          if (i === j) continue
          const a = this.gegoNodes[i]
          const b = this.gegoNodes[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dz = a.z - b.z
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
          if (dist < SETTINGS.MODULES.GEGO_NET.CONNECTION_DISTANCE) {
            connections.push({ j, dist })
          }
        }

        // Sort by distance, keep only closest
        connections.sort((a, b) => a.dist - b.dist)
        connections.slice(0, SETTINGS.MODULES.GEGO_NET.MAX_CONNECTIONS).forEach(({ j }) => {
          this.gegoConnections.push([i, j])
        })
      }

      this.lastChordSig = chordSig
    }

    const angle = t * 0.2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    this.canvasDrawer.applyLayoutTransform(layout)
    this.ctx.lineWidth = 0.2

    this.gegoConnections.forEach(([i, j]) => {
      const a = this.gegoNodes[i]
      const b = this.gegoNodes[j]

      const ax = a.x * 100
      const ay = a.y * 100 + Math.sin(t + a.offset) * deformAmount
      const az = a.z

      const bx = b.x * 100
      const by = b.y * 100 + Math.sin(t + b.offset) * deformAmount
      const bz = b.z

      const axr = ax * cos - az * sin
      const azr = ax * sin + az * cos

      const bxr = bx * cos - bz * sin
      const bzr = bx * sin + bz * cos

      const opacity = 0.25 * (2 - azr - bzr)
      this.ctx.strokeStyle = `hsla(0, 0%, 100%, ${opacity})`
      this.ctx.shadowColor = `rgba(255, 255, 255, ${opacity})`

      this.ctx.beginPath()
      this.ctx.moveTo(axr * azr * scaleFactor, ay * azr * scaleFactor)
      this.ctx.lineTo(bxr * bzr * scaleFactor, by * bzr * scaleFactor)
      this.ctx.stroke()
    })

    this.canvasDrawer.restoreLayoutTransform()
  }
}
