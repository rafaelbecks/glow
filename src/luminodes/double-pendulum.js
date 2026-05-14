// Double pendulum — chaotic planar motion with optional tip trace (several side-by-side)
import { SETTINGS, UTILS } from '../settings.js'

function add4 (a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]]
}

function scale4 (v, s) {
  return [v[0] * s, v[1] * s, v[2] * s, v[3] * s]
}

function derivatives (t1, t2, w1, w2, L1, L2, m1, m2, g, damping) {
  const d = t1 - t2
  const cosD = Math.cos(d)
  const sinD = Math.sin(d)

  const den = 2 * m1 + m2 - m2 * Math.cos(2 * d)
  if (Math.abs(den) < 1e-9) {
    return [w1, w2, 0, 0]
  }

  const num1 =
    -g * (2 * m1 + m2) * Math.sin(t1) -
    m2 * g * Math.sin(t1 - 2 * t2) -
    2 *
      sinD *
      m2 *
      (w2 * w2 * L2 + w1 * w1 * L1 * cosD)
  const a1 = num1 / (L1 * den) - damping * w1

  const num2 =
    2 *
      sinD *
      (w1 * w1 * L1 * (m1 + m2) +
        g * (m1 + m2) * Math.cos(t1) +
        w2 * w2 * L2 * m2 * cosD)
  const a2 = num2 / (L2 * den) - damping * w2

  return [w1, w2, a1, a2]
}

function rk4Step (state, h, L1, L2, m1, m2, g, damping) {
  const [t1, t2, w1, w2] = state
  const k1 = derivatives(t1, t2, w1, w2, L1, L2, m1, m2, g, damping)
  const k2 = derivatives(
    t1 + 0.5 * h * k1[0],
    t2 + 0.5 * h * k1[1],
    w1 + 0.5 * h * k1[2],
    w2 + 0.5 * h * k1[3],
    L1,
    L2,
    m1,
    m2,
    g,
    damping
  )
  const k3 = derivatives(
    t1 + 0.5 * h * k2[0],
    t2 + 0.5 * h * k2[1],
    w1 + 0.5 * h * k2[2],
    w2 + 0.5 * h * k2[3],
    L1,
    L2,
    m1,
    m2,
    g,
    damping
  )
  const k4 = derivatives(
    t1 + h * k3[0],
    t2 + h * k3[1],
    w1 + h * k3[2],
    w2 + h * k3[3],
    L1,
    L2,
    m1,
    m2,
    g,
    damping
  )
  const k = add4(
    add4(k1, scale4(k2, 2)),
    add4(scale4(k3, 2), k4)
  )
  const hh = h / 6
  return [
    t1 + hh * k[0],
    t2 + hh * k[1],
    w1 + hh * k[2],
    w2 + hh * k[3]
  ]
}

function tipPosition (t1, t2, L1, L2) {
  const x1 = L1 * Math.sin(t1)
  const y1 = L1 * Math.cos(t1)
  const x2 = x1 + L2 * Math.sin(t2)
  const y2 = y1 + L2 * Math.cos(t2)
  return { x1, y1, x2, y2 }
}

function launchSign (direction, pendulumIndex) {
  const d = direction || 'right'
  if (d === 'left') return -1
  if (d === 'right') return 1
  if (d === 'alternate') return pendulumIndex % 2 === 0 ? -1 : 1
  return 1
}

// Slider max for LAUNCH_STRENGTH (keep aligned with luminode-configs.js)
const STRENGTH_SLIDER_MAX = 1000
// Impulse mode: map full slider to ~0–14 rad/s on ω₁ (same ballpark as early kick builds)
const IMPULSE_OMEGA_MAX = 14

export class DoublePendulumLuminode {
  constructor (canvasDrawer) {
    this.canvasDrawer = canvasDrawer
    this.ctx = canvasDrawer.getContext()
    this.dimensions = canvasDrawer.getDimensions()
    this.lastDrawT = null
    this.states = null
    this._releaseFromRest = undefined
  }

  ensureStates (phys, count) {
    const strengthMax =
      phys.LAUNCH_STRENGTH_MAX > 0
        ? phys.LAUNCH_STRENGTH_MAX
        : STRENGTH_SLIDER_MAX
    const release = phys.RELEASE_FROM_REST === true

    if (
      this.states &&
      this.states.length === count &&
      this._releaseFromRest === release
    ) {
      return
    }

    this._releaseFromRest = release
    this.states = []
    const strength = Math.max(0, phys.LAUNCH_STRENGTH ?? 0)
    const twist = phys.REST_TWIST ?? 0.08
    const gap = phys.PENDULUM_PHASE_GAP ?? 0
    const maxPull = 1.58
    const pullPerUnit = maxPull / strengthMax
    const omegaK = IMPULSE_OMEGA_MAX / strengthMax

    for (let i = 0; i < count; i++) {
      const side = launchSign(phys.START_DIRECTION, i)
      let t1
      let t2
      let w1
      let w2
      if (release) {
        const pullRad = Math.min(maxPull, strength * pullPerUnit)
        t1 = side * pullRad
        t2 = t1 + twist + i * gap
        w1 = 0
        w2 = 0
      } else {
        const lean = 0.028 * side
        t1 = lean
        t2 = t1 + twist + i * gap
        w1 = side * strength * omegaK
        w2 = side * strength * omegaK * 0.58
      }
      this.states.push({
        s: [t1, t2, w1, w2],
        trace: []
      })
    }
  }

  integrate (dt, m) {
    const L1 = m.L1
    const L2 = m.L2
    const m1 = m.M1
    const m2 = m.M2
    const g = m.G
    const damping = m.DAMPING
    const maxDt = Math.max(1e-4, m.MAX_STEP_DT)

    const hang = m.RELEASE_FROM_REST === true
    const speed = hang
      ? (m.MOTION_SPEED_HANG ?? m.MOTION_SPEED ?? m.SIM_SPEED ?? 5)
      : (m.MOTION_SPEED ?? m.SIM_SPEED ?? 1)
    let rem = dt * speed
    let iters = 0
    while (rem > 1e-10 && iters < 8000) {
      iters++
      const h = Math.min(rem, maxDt)
      for (const st of this.states) {
        st.s = rk4Step(st.s, h, L1, L2, m1, m2, g, damping)
      }
      rem -= h
    }
  }

  pushTrace (m) {
    const maxPts = Math.max(8, Math.floor(m.TRACE_MAX_POINTS))
    for (const st of this.states) {
      const [t1, t2] = st.s
      const { x2, y2 } = tipPosition(t1, t2, m.L1, m.L2)
      st.trace.push({ x: x2, y: y2 })
      while (st.trace.length > maxPts) st.trace.shift()
    }
  }

  draw (t, notes, useColor = false, layout = { x: 0, y: 0, rotation: 0 }) {
    if (notes.length === 0) {
      this.lastDrawT = null
      this.states = null
      return
    }

    this.dimensions = this.canvasDrawer.getDimensions()
    const m = SETTINGS.MODULES.DOUBLE_PENDULUM
    const maxPend = Math.max(
      1,
      Math.min(8, Math.round(m.MAX_PENDULUM_COUNT ?? 5))
    )
    const count = Math.max(
      1,
      Math.min(maxPend, Math.round(m.PENDULUM_COUNT ?? 1))
    )
    const armLen = m.ARM_LENGTH ?? m.L1 ?? 95
    const armRatio =
      m.ARM_RATIO ??
      (typeof m.L1 === 'number' &&
      m.L1 > 0 &&
      typeof m.L2 === 'number'
        ? m.L2 / m.L1
        : 1)
    const phys = {
      ...m,
      L1: armLen,
      L2: armLen * armRatio
    }

    const release = m.RELEASE_FROM_REST === true
    if (this._releaseFromRest !== undefined && this._releaseFromRest !== release) {
      this.states = null
    }

    this.ensureStates(phys, count)

    let dt = 0.016
    if (this.lastDrawT != null) {
      dt = Math.min(0.05, Math.max(0.001, t - this.lastDrawT))
    }
    this.lastDrawT = t

    this.integrate(dt, phys)
    if (m.SHOW_TRACE) this.pushTrace(phys)

    const spacing = m.HORIZONTAL_SPACING
    const scale = m.SCALE
    const armW = m.ARM_LINE_WIDTH
    const traceW = m.TRACE_LINE_WIDTH
    const shadowBlur = m.SHADOW_BLUR
    const sorted = [...notes].sort((a, b) => (a.midi || 0) - (b.midi || 0))

    this.canvasDrawer.applyLayoutTransform(layout)

    const prevComposite = this.ctx.globalCompositeOperation
    if (useColor && m.COLOR_BLEND) {
      this.ctx.globalCompositeOperation = 'screen'
    }

    for (let i = 0; i < count; i++) {
      const ox = (i - (count - 1) / 2) * spacing
      const st = this.states[i]
      const [t1, t2] = st.s
      const { x1, y1, x2, y2 } = tipPosition(t1, t2, phys.L1, phys.L2)

      const note = sorted[i % sorted.length]
      const midi = note?.midi ?? 60
      const strokeColor = useColor
        ? UTILS.pitchToColor(midi)
        : 'rgba(255, 255, 255, 0.78)'
      const shadowColor = useColor ? strokeColor : 'rgba(255, 255, 255, 0.45)'

      this.ctx.save()
      this.ctx.translate(ox, 0)
      this.ctx.scale(scale, scale)

      if (m.SHOW_TRACE && st.trace.length > 1) {
        this.ctx.beginPath()
        this.ctx.moveTo(st.trace[0].x, st.trace[0].y)
        for (let k = 1; k < st.trace.length; k++) {
          this.ctx.lineTo(st.trace[k].x, st.trace[k].y)
        }
        this.ctx.strokeStyle = useColor
          ? strokeColor
          : `rgba(255, 255, 255, ${m.TRACE_OPACITY_BW})`
        this.ctx.lineWidth = traceW / scale
        this.ctx.shadowBlur = shadowBlur / scale
        this.ctx.shadowColor = shadowColor
        this.ctx.stroke()
      }

      if (m.SHOW_ARMS) {
        this.ctx.beginPath()
        this.ctx.moveTo(0, 0)
        this.ctx.lineTo(x1, y1)
        this.ctx.lineTo(x2, y2)
        this.ctx.strokeStyle = useColor ? strokeColor : 'rgba(255,255,255,0.92)'
        this.ctx.lineWidth = armW / scale
        this.ctx.shadowBlur = shadowBlur / scale
        this.ctx.shadowColor = shadowColor
        this.ctx.stroke()
      }

      if (m.SHOW_JOINTS) {
        const jr = m.JOINT_RADIUS / scale
        this.ctx.fillStyle = useColor ? strokeColor : 'rgba(255,255,255,0.95)'
        this.ctx.shadowBlur = shadowBlur / scale
        this.ctx.shadowColor = shadowColor
        ;[
          [0, 0],
          [x1, y1],
          [x2, y2]
        ].forEach(([jx, jy]) => {
          this.ctx.beginPath()
          this.ctx.arc(jx, jy, jr, 0, Math.PI * 2)
          this.ctx.fill()
        })
      }

      this.ctx.restore()
    }

    this.ctx.globalCompositeOperation = prevComposite
    this.canvasDrawer.restoreLayoutTransform()
  }
}
