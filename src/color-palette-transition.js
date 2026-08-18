/**
 * Keeps target palettes separate from the temporary colors shown while
 * transitioning. This ensures project saves always contain the selected target.
 */

function hexToRgb (hex) {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex || '')
  if (!match) return [255, 255, 255]
  return [
    parseInt(match[1], 16),
    parseInt(match[2], 16),
    parseInt(match[3], 16)
  ]
}

function rgbToHex (rgb) {
  return `#${rgb
    .map((channel) =>
      Math.round(Math.max(0, Math.min(255, channel)))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

function interpolateColor (from, to, amount) {
  const a = hexToRgb(from)
  const b = hexToRgb(to)
  return rgbToHex([
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount
  ])
}

export class ColorPaletteTransition {
  constructor () {
    this.transitions = new Map()
  }

  getPalette (key, targetPalette) {
    return this.transitions.get(key)?.display || targetPalette
  }

  transitionTo (
    key,
    fromPalette,
    targetPalette,
    { enabled = false, duration = 1, easing = 'linear', applyEasing } = {}
  ) {
    this.cancel(key)

    if (!enabled || duration <= 0) return

    const target = [...targetPalette]
    const from = target.map(
      (color, index) =>
        fromPalette[index] || fromPalette[fromPalette.length - 1] || color
    )
    const transition = {
      from,
      target,
      display: [...from],
      startedAt: performance.now(),
      durationMs: duration * 1000,
      easing,
      applyEasing,
      frame: null
    }
    this.transitions.set(key, transition)

    const update = (now) => {
      if (this.transitions.get(key) !== transition) return
      const progress = Math.min(
        1,
        (now - transition.startedAt) / transition.durationMs
      )
      const eased =
        typeof transition.applyEasing === 'function'
          ? transition.applyEasing(progress, transition.easing)
          : progress

      for (let i = 0; i < transition.target.length; i++) {
        transition.display[i] = interpolateColor(
          transition.from[i],
          transition.target[i],
          eased
        )
      }

      if (progress >= 1) {
        this.transitions.delete(key)
        return
      }
      transition.frame = window.requestAnimationFrame(update)
    }

    transition.frame = window.requestAnimationFrame(update)
  }

  cancel (key) {
    const transition = this.transitions.get(key)
    if (transition?.frame != null) {
      window.cancelAnimationFrame(transition.frame)
    }
    this.transitions.delete(key)
  }

  reset () {
    for (const key of this.transitions.keys()) this.cancel(key)
  }
}

export const colorPaletteTransition = new ColorPaletteTransition()
