/**
 * Minimal Luminode template for the Luminode Center.
 * MODULE / SETTINGS / UTILS are injected at compile time — no imports needed.
 */
export const LUMINODE_TEMPLATE = `// Minimal Luminode — a pulsing circle driven by time and MIDI notes.
// GLOW provides: MODULE (your settings), SETTINGS, UTILS, getEulerRotation, …
// Prefer MODULE.* for luminode params (see Settings tab).
//
// draw(t, notes, layout)
//   t      — seconds
//   notes  — [{ midi, velocity, timestamp }, ...]
//   layout — { x, y, rotation }

class Luminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
  }

  draw (t, notes, layout = { x: 0, y: 0, rotation: 0 }) {
    this.dimensions = this.canvasDrawer.getDimensions()
    this.canvasDrawer.applyLayoutTransform(layout)

    const ctx = this.ctx
    const lineWidth = MODULE.LINE_WIDTH ?? 1.5
    const pulse = 50 + Math.sin(t * 2.2) * 18

    if (!notes || notes.length === 0) {
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
      ctx.lineWidth = lineWidth
      ctx.arc(0, 0, pulse, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      notes.forEach(({ midi, velocity }, i) => {
        const r = pulse * (0.45 + velocity * 0.7) + i * 12
        ctx.beginPath()
        ctx.strokeStyle = UTILS.pitchToColor(midi)
        ctx.lineWidth = lineWidth
        ctx.arc(0, 0, r, 0, Math.PI * 2)
        ctx.stroke()
      })
    }

    this.canvasDrawer.restoreLayoutTransform()
  }
}
`

export const TEMPLATE_DISPLAY_NAME = 'New Luminode'
