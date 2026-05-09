// Moiré circles — overlapping concentric ring packs with kinetic centers
import { SETTINGS, UTILS } from '../settings.js'

export class MoireCirclesLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
  }

  getCircleCount (notes, m) {
    if (m.CIRCLE_COUNT_FROM_NOTES) {
      return Math.max(1, Math.min(16, notes.length))
    }
    return Math.max(1, Math.min(16, m.FIXED_CIRCLE_COUNT))
  }

  getCenter (i, n, t, m) {
    const rate = t * m.MOTION_RATE
    const fr = m.FORMATION_RADIUS
    const amp = m.MOTION_AMPLITUDE
    const base = -Math.PI / 2 + (Math.PI * 2 * i) / n
    const mode = m.MOTION_MODE || 'orbit'

    switch (mode) {
      case 'orbit': {
        const groupRot = rate * 0.35
        const bx = fr * Math.cos(base + groupRot * 0.15)
        const by = fr * Math.sin(base + groupRot * 0.15)
        const ox = amp * Math.sin(rate * (0.8 + i * 0.07) + base * 2)
        const oy = amp * Math.cos(rate * (1.0 + i * 0.09) + base)
        return { x: bx + ox, y: by + oy }
      }
      case 'lissajous': {
        const fi = base
        const ax = 1 + (i % 3)
        const ay = 2 + ((i + 1) % 3)
        return {
          x: fr * Math.cos(base) + amp * Math.sin(rate * ax * 0.4 + fi),
          y: fr * Math.sin(base) + amp * Math.cos(rate * ay * 0.4 + fi * 1.3)
        }
      }
      case 'breathe': {
        const s = 1 + 0.35 * Math.sin(rate * 0.6)
        return {
          x: s * fr * Math.cos(base + rate * 0.12),
          y: s * fr * Math.sin(base + rate * 0.12)
        }
      }
      case 'drift': {
        return {
          x: fr * Math.cos(base) + amp * Math.sin(rate * 0.15) * Math.cos(base),
          y: fr * Math.sin(base) + amp * Math.cos(rate * 0.12) * Math.sin(base)
        }
      }
      case 'choreo': {
        const pulse = 0.5 + 0.5 * Math.sin(rate * 0.9)
        const r = fr * (0.45 + 0.55 * pulse)
        return {
          x: r * Math.cos(base + rate * 0.25 + Math.sin(rate * 0.4 + i) * 0.3),
          y: r * Math.sin(base + rate * 0.25 + Math.cos(rate * 0.35 + i) * 0.3)
        }
      }
      default:
        return { x: fr * Math.cos(base), y: fr * Math.sin(base) }
    }
  }

  drawRingPack (cx, cy, maxR, spacing, lineWidth, phase, strokeStyle, shadowBlur, shadowColor) {
    const ctx = this.ctx
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = strokeStyle
    ctx.shadowBlur = shadowBlur
    ctx.shadowColor = shadowColor || strokeStyle

    const start = ((phase % spacing) + spacing) % spacing
    for (let r = start; r <= maxR; r += spacing) {
      if (r < 0.5) continue
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  strokeForCircle (useColor, notes, circleIndex, velocityFactor) {
    if (!useColor) {
      const alpha = 0.55 + velocityFactor * 0.35
      return {
        stroke: `rgba(255, 255, 255, ${alpha})`,
        shadow: 'rgba(255, 255, 255, 0.45)'
      }
    }
    const note = notes[circleIndex % notes.length]
    const midi = note?.midi ?? 60
    const c = UTILS.pitchToColor(midi)
    return { stroke: c, shadow: c }
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) return

    this.dimensions = this.canvasDrawer.getDimensions()
    const m = SETTINGS.MODULES.MOIRE_CIRCLES
    const scale = Math.max(0.1, m.SCALE ?? 1)

    const n = this.getCircleCount(notes, m)
    const spacing = m.STRIPE_SPACING * scale
    const maxR = m.MAX_RADIUS * scale
    const lineWidth = m.LINE_WIDTH
    const shadowBlur = m.SHADOW_BLUR * scale
    const phaseSkew = m.RING_PHASE_SKEW * scale
    const motionM = {
      ...m,
      FORMATION_RADIUS: m.FORMATION_RADIUS * scale,
      MOTION_AMPLITUDE: m.MOTION_AMPLITUDE * scale
    }

    this.canvasDrawer.applyLayoutTransform(layout)

    const prevComposite = this.ctx.globalCompositeOperation
    if (useColor && m.COLOR_BLEND) {
      this.ctx.globalCompositeOperation = 'screen'
    }

    const sorted = [...notes].sort((a, b) => (a.midi || 0) - (b.midi || 0))

    for (let i = 0; i < n; i++) {
      const { x, y } = this.getCenter(i, n, t, motionM)
      const phase = i * phaseSkew
      const noteForColor = sorted[i % sorted.length]
      const vf = noteForColor?.velocity ?? 0.7
      const { stroke, shadow } = this.strokeForCircle(useColor, sorted, i, vf)

      this.drawRingPack(x, y, maxR, spacing, lineWidth, phase, stroke, shadowBlur, shadow)
    }

    this.ctx.globalCompositeOperation = prevComposite
    this.canvasDrawer.restoreLayoutTransform()
  }
}
