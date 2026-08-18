/**
 * GLOW — Line Modulation Context Proxy
 * ------------------------------------------------------------
 * Wraps a CanvasRenderingContext2D so moveTo / lineTo / curve
 * vertices are deformed by LineModulationSystem before stroking.
 * Luminodes keep drawing as usual; geometry is intercepted once.
 */

/**
 * @param {CanvasRenderingContext2D} realCtx
 * @param {{
 *   system: import('./line-modulation-system.js').LineModulationSystem,
 *   config: object,
 *   t: number,
 *   audioLevel?: number
 * }} options
 */
export function createLineModulationContext (realCtx, options) {
  const { system, config, t } = options
  const audioLevel = options.audioLevel || 0

  if (!config?.enabled) return realCtx

  const pathState = {
    index: 0,
    prevX: 0,
    prevY: 0,
    hasPrev: false
  }
  const out = { x: 0, y: 0 }

  const transform = (x, y) => {
    system.applyPoint(x, y, pathState, config, t, audioLevel, out)
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
