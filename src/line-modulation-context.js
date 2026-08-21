/**
 * GLOW — Line Modulation Context Proxy
 * ------------------------------------------------------------
 * Wraps a CanvasRenderingContext2D so moveTo / lineTo / curve /
 * arc / rect vertices are deformed by LineModulationSystem before
 * stroking. Luminodes keep drawing as usual; geometry is intercepted once.
 */

/**
 * @param {CanvasRenderingContext2D} realCtx
 * @param {{
 *   system: import('./line-modulation-system.js').LineModulationSystem,
 *   config: object,
 *   t: number
 * }} options
 */
export function createLineModulationContext (realCtx, options) {
  const { system, config, t } = options

  if (!config?.enabled) return realCtx

  const pathState = {
    index: 0,
    prevX: 0,
    prevY: 0,
    hasPrev: false
  }
  const out = { x: 0, y: 0 }

  const transform = (x, y) => {
    system.applyPoint(x, y, pathState, config, t, out)
    pathState.prevX = x
    pathState.prevY = y
    pathState.hasPrev = true
    pathState.index++
    return out
  }

  const resetPath = () => {
    pathState.index = 0
    pathState.hasPrev = false
  }

  const emitVertex = (target, x, y, asMove) => {
    const p = transform(x, y)
    if (asMove) target.moveTo(p.x, p.y)
    else target.lineTo(p.x, p.y)
  }

  /** Approximate arc as line segments so deformation can act along the curve. */
  const emitArc = (
    target,
    cx,
    cy,
    radius,
    startAngle,
    endAngle,
    counterclockwise = false
  ) => {
    const r = Math.abs(radius)
    if (!(r > 0) || !Number.isFinite(cx) || !Number.isFinite(cy)) return

    let delta = endAngle - startAngle
    if (counterclockwise) {
      if (delta >= 0) delta -= Math.PI * 2
    } else if (delta <= 0) {
      delta += Math.PI * 2
    }

    const absDelta = Math.abs(delta)
    const segments = Math.max(
      8,
      Math.min(96, Math.ceil((r * absDelta) / 6))
    )

    for (let i = 0; i <= segments; i++) {
      const a = startAngle + (delta * i) / segments
      const x = cx + r * Math.cos(a)
      const y = cy + r * Math.sin(a)
      if (i === 0) {
        // Match native arc(): empty path → moveTo; otherwise line into arc start
        emitVertex(target, x, y, !pathState.hasPrev)
      } else {
        emitVertex(target, x, y, false)
      }
    }
  }

  /** Approximate rect as subdivided edges for deformation along each side. */
  const emitRect = (target, x, y, w, h, segmentsPerEdge = 8) => {
    const corners = [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h]
    ]
    const steps = Math.max(1, Math.floor(segmentsPerEdge))

    emitVertex(target, corners[0][0], corners[0][1], !pathState.hasPrev)

    for (let c = 0; c < 4; c++) {
      const [x0, y0] = corners[c]
      const [x1, y1] = corners[(c + 1) % 4]
      for (let s = 1; s <= steps; s++) {
        const u = s / steps
        emitVertex(
          target,
          x0 + (x1 - x0) * u,
          y0 + (y1 - y0) * u,
          false
        )
      }
    }
  }

  return new Proxy(realCtx, {
    get (target, prop, receiver) {
      if (prop === 'beginPath') {
        return (...args) => {
          resetPath()
          return target.beginPath(...args)
        }
      }

      if (prop === 'moveTo') {
        return (x, y) => {
          // New subpath — restart index but still displace the vertex
          pathState.index = 0
          pathState.hasPrev = false
          const p = transform(x, y)
          return target.moveTo(p.x, p.y)
        }
      }

      if (prop === 'lineTo') {
        return (x, y) => {
          const p = transform(x, y)
          return target.lineTo(p.x, p.y)
        }
      }

      if (prop === 'quadraticCurveTo') {
        return (cpx, cpy, x, y) => {
          const cp = transform(cpx, cpy)
          const cpx2 = cp.x
          const cpy2 = cp.y
          const p = transform(x, y)
          return target.quadraticCurveTo(cpx2, cpy2, p.x, p.y)
        }
      }

      if (prop === 'bezierCurveTo') {
        return (cp1x, cp1y, cp2x, cp2y, x, y) => {
          const a = transform(cp1x, cp1y)
          const ax = a.x
          const ay = a.y
          const b = transform(cp2x, cp2y)
          const bx = b.x
          const by = b.y
          const p = transform(x, y)
          return target.bezierCurveTo(ax, ay, bx, by, p.x, p.y)
        }
      }

      if (prop === 'arc') {
        return (cx, cy, radius, startAngle, endAngle, counterclockwise) => {
          emitArc(
            target,
            cx,
            cy,
            radius,
            startAngle,
            endAngle,
            Boolean(counterclockwise)
          )
        }
      }

      if (prop === 'rect') {
        return (x, y, w, h) => {
          emitRect(target, x, y, w, h)
        }
      }

      if (prop === 'closePath') {
        return (...args) => {
          // Keep hasPrev so a following lineTo still has a tangent
          return target.closePath(...args)
        }
      }

      const value = Reflect.get(target, prop, target)
      if (typeof value === 'function') {
        return value.bind(target)
      }
      return value
    },

    set (target, prop, value) {
      target[prop] = value
      return true
    }
  })
}
