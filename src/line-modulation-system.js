/**
 * GLOW — Line Modulation System
 * ------------------------------------------------------------
 * Transversal geometry deformation applied after luminodes
 * generate line vertices (via a Canvas context proxy).
 *
 * Effects (composable): oscillation + Perlin noise.
 * Audio reactivity is done via the Modulation tab targeting
 * oscillation/noise amounts — not a separate deform audio path.
 * Disabled by default so existing scenes are unchanged.
 */

/** Modulation targets exposed in the Modulation tab (dotted keys). */
export const LINE_MODULATION_PARAMS = [
  {
    key: 'lineModulation.enabled',
    label: 'Line · Enabled',
    type: 'checkbox'
  },
  {
    key: 'lineModulation.oscillationAmount',
    label: 'Line · Osc Amount',
    type: 'slider',
    min: 0,
    max: 80,
    step: 0.5
  },
  {
    key: 'lineModulation.oscillationFrequency',
    label: 'Line · Osc Frequency',
    type: 'slider',
    min: 0.01,
    max: 2,
    step: 0.01
  },
  {
    key: 'lineModulation.oscillationSpeed',
    label: 'Line · Osc Speed',
    type: 'slider',
    min: 0,
    max: 5,
    step: 0.01
  },
  {
    key: 'lineModulation.oscillationPhase',
    label: 'Line · Osc Phase',
    type: 'slider',
    min: 0,
    max: Math.PI * 2,
    step: 0.01
  },
  {
    key: 'lineModulation.noiseAmount',
    label: 'Line · Noise Amount',
    type: 'slider',
    min: 0,
    max: 80,
    step: 0.5
  },
  {
    key: 'lineModulation.noiseScale',
    label: 'Line · Noise Scale',
    type: 'slider',
    min: 0.001,
    max: 0.2,
    step: 0.001
  },
  {
    key: 'lineModulation.noiseSpeed',
    label: 'Line · Noise Speed',
    type: 'slider',
    min: 0,
    max: 5,
    step: 0.01
  }
]

export const OSCILLATION_WAVE_SHAPES = ['sine', 'square', 'triangle', 'saw']

export const OSCILLATION_WAVE_SHAPE_NAMES = {
  sine: 'Sine',
  square: 'Square',
  triangle: 'Triangle',
  saw: 'Sawtooth'
}

export function getLineModulationParam (key) {
  return LINE_MODULATION_PARAMS.find((param) => param.key === key)
}

/** Waveform in [-1, 1] for a given phase in radians. Matches LFO shapes. */
export function oscillationWaveform (shape, phase) {
  const normalizedPhase =
    ((phase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)

  switch (shape) {
    case 'square':
      return normalizedPhase < Math.PI ? 1 : -1
    case 'triangle':
      if (normalizedPhase < Math.PI) {
        return (normalizedPhase / Math.PI) * 2 - 1
      }
      return 1 - ((normalizedPhase - Math.PI) / Math.PI) * 2
    case 'saw':
      return (normalizedPhase / (Math.PI * 2)) * 2 - 1
    case 'sine':
    default:
      return Math.sin(normalizedPhase)
  }
}

// --- Compact classic Perlin (permutation table + fade) ---

const PERLIN_PERM = new Uint8Array(512)
;(() => {
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  let seed = 1337
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647
    const j = seed % (i + 1)
    const tmp = p[i]
    p[i] = p[j]
    p[j] = tmp
  }
  for (let i = 0; i < 512; i++) PERLIN_PERM[i] = p[i & 255]
})()

function fade (t) {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function lerp (a, b, t) {
  return a + t * (b - a)
}

function grad3 (hash, x, y, z) {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

/** Classic 3D Perlin noise in roughly [-1, 1]. */
export function perlin3 (x, y, z) {
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  const Z = Math.floor(z) & 255
  const xf = x - Math.floor(x)
  const yf = y - Math.floor(y)
  const zf = z - Math.floor(z)
  const u = fade(xf)
  const v = fade(yf)
  const w = fade(zf)
  const p = PERLIN_PERM
  const A = p[X] + Y
  const AA = p[A] + Z
  const AB = p[A + 1] + Z
  const B = p[X + 1] + Y
  const BA = p[B] + Z
  const BB = p[B + 1] + Z
  return lerp(
    lerp(
      lerp(grad3(p[AA], xf, yf, zf), grad3(p[BA], xf - 1, yf, zf), u),
      lerp(grad3(p[AB], xf, yf - 1, zf), grad3(p[BB], xf - 1, yf - 1, zf), u),
      v
    ),
    lerp(
      lerp(
        grad3(p[AA + 1], xf, yf, zf - 1),
        grad3(p[BA + 1], xf - 1, yf, zf - 1),
        u
      ),
      lerp(
        grad3(p[AB + 1], xf, yf - 1, zf - 1),
        grad3(p[BB + 1], xf - 1, yf - 1, zf - 1),
        u
      ),
      v
    ),
    w
  )
}

function deepMergeSection (base, patch) {
  if (!patch || typeof patch !== 'object') return { ...base }
  return { ...base, ...patch }
}

export class LineModulationSystem {
  constructor () {
    this.trackConfigs = new Map()
    this._out = { x: 0, y: 0 }
    this.initializeDefaultConfigs()
  }

  getDefaultConfig () {
    return {
      enabled: false,
      oscillation: {
        enabled: true,
        amount: 0,
        frequency: 0.08,
        speed: 1,
        phase: 0,
        wave: 'sine'
      },
      noise: {
        enabled: true,
        amount: 0,
        scale: 0.02,
        speed: 0.5,
        seed: 0
      }
    }
  }

  initializeDefaultConfigs () {
    const defaults = this.getDefaultConfig()
    for (let i = 1; i <= 4; i++) {
      this.trackConfigs.set(i, structuredClone(defaults))
    }
  }

  getTrackConfig (trackId) {
    return this.trackConfigs.get(trackId) || this.getDefaultConfig()
  }

  updateTrackConfig (trackId, updates = {}) {
    const current = this.getTrackConfig(trackId)
    // Ignore legacy `audio` section from older .glow files
    const next = {
      enabled:
        updates.enabled !== undefined ? updates.enabled : current.enabled,
      oscillation: deepMergeSection(current.oscillation, updates.oscillation),
      noise: deepMergeSection(current.noise, updates.noise)
    }
    if (!OSCILLATION_WAVE_SHAPES.includes(next.oscillation.wave)) {
      next.oscillation.wave = 'sine'
    }
    this.trackConfigs.set(trackId, next)
    return next
  }

  resetTrackConfig (trackId) {
    this.trackConfigs.set(trackId, structuredClone(this.getDefaultConfig()))
    return this.getTrackConfig(trackId)
  }

  /**
   * Resolve dotted modulation keys onto a mutable config copy.
   * Keys: lineModulation.enabled | lineModulation.oscillationAmount | …
   */
  applyFlatModulation (config, key, value) {
    if (!key || !key.startsWith('lineModulation.')) return config
    const prop = key.slice('lineModulation.'.length)
    if (prop === 'enabled') {
      config.enabled = value
      return config
    }
    if (prop === 'oscillationAmount') config.oscillation.amount = value
    else if (prop === 'oscillationFrequency') config.oscillation.frequency = value
    else if (prop === 'oscillationSpeed') config.oscillation.speed = value
    else if (prop === 'oscillationPhase') config.oscillation.phase = value
    else if (prop === 'noiseAmount') config.noise.amount = value
    else if (prop === 'noiseScale') config.noise.scale = value
    else if (prop === 'noiseSpeed') config.noise.speed = value
    return config
  }

  cloneConfig (config) {
    return {
      enabled: config.enabled,
      oscillation: { ...config.oscillation },
      noise: { ...config.noise }
    }
  }

  /**
   * Apply composable line effects to a single vertex.
   * Mutates / returns reusable { x, y }. Prefer in-place for hot path.
   */
  applyPoint (x, y, pathState, config, t, out = this._out) {
    if (!config || !config.enabled) {
      out.x = x
      out.y = y
      return out
    }

    let nx = 0
    let ny = 0
    if (pathState.hasPrev) {
      const dx = x - pathState.prevX
      const dy = y - pathState.prevY
      const len = Math.hypot(dx, dy)
      if (len > 1e-6) {
        nx = -dy / len
        ny = dx / len
      }
    }
    if (nx === 0 && ny === 0) {
      // No tangent yet — displace along unit circle from origin
      const r = Math.hypot(x, y)
      if (r > 1e-6) {
        nx = x / r
        ny = y / r
      } else {
        nx = 0
        ny = 1
      }
    }

    let offset = 0
    const index = pathState.index | 0
    const osc = config.oscillation
    if (osc && osc.enabled && osc.amount) {
      const phase = index * osc.frequency + osc.phase + t * osc.speed
      offset += oscillationWaveform(osc.wave || 'sine', phase) * osc.amount
    }

    const noise = config.noise
    if (noise && noise.enabled && noise.amount) {
      const s = noise.scale || 0.02
      const seed = noise.seed || 0
      const n = perlin3(
        x * s + seed,
        y * s + seed * 0.37,
        t * (noise.speed || 0) + seed
      )
      offset += n * noise.amount
    }

    out.x = x + nx * offset
    out.y = y + ny * offset
    return out
  }

  /**
   * Apply line modulation to an array of polylines
   * [[{x,y}, ...], ...] — optional API for non-canvas consumers.
   * Mutates points in place when possible.
   */
  applyLine (lines, config, t = 0) {
    if (!config?.enabled || !lines) return lines
    const pathState = { index: 0, prevX: 0, prevY: 0, hasPrev: false }
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]
      pathState.index = 0
      pathState.hasPrev = false
      if (!line) continue
      for (let i = 0; i < line.length; i++) {
        const pt = line[i]
        const transformed = this.applyPoint(
          pt.x,
          pt.y,
          pathState,
          config,
          t,
          this._out
        )
        pathState.prevX = pt.x
        pathState.prevY = pt.y
        pathState.hasPrev = true
        pathState.index++
        pt.x = transformed.x
        pt.y = transformed.y
      }
    }
    return lines
  }
}
