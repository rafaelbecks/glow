/**
 * GLOW — Line Modulation System
 * ------------------------------------------------------------
 * Transversal geometry deformation applied after luminodes
 * generate line vertices (via a Canvas context proxy).
 *
 * Effects (composable): oscillation, Perlin noise, audio-driven
 * displacement. Disabled by default so existing scenes are unchanged.
 */

import { getAudioModulationEngine } from './audio-modulation-engine.js'

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
  },
  {
    key: 'lineModulation.audioAmount',
    label: 'Line · Audio Amount',
    type: 'slider',
    min: 0,
    max: 80,
    step: 0.5
  }
]

export function getLineModulationParam (key) {
  return LINE_MODULATION_PARAMS.find((param) => param.key === key)
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
    this.audioEngine = getAudioModulationEngine()
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
        phase: 0
      },
      noise: {
        enabled: true,
        amount: 0,
        scale: 0.02,
        speed: 0.5,
        seed: 0
      },
      audio: {
        enabled: false,
        amount: 0,
        audioSourceType: 'input',
        audioDeviceId: null,
        audioDeviceLabel: null,
        audioTrackId: null,
        audioFeature: 'rms',
        audioChannel: 0,
        audioChannelMode: 'mono',
        audioSmoothing: 0.7,
        audioFreqMin: 20,
        audioFreqMax: 20000
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
    const next = {
      ...current,
      ...updates,
      oscillation: deepMergeSection(current.oscillation, updates.oscillation),
      noise: deepMergeSection(current.noise, updates.noise),
      audio: deepMergeSection(current.audio, updates.audio)
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
    else if (prop === 'audioAmount') config.audio.amount = value
    return config
  }

  cloneConfig (config) {
    return {
      enabled: config.enabled,
      oscillation: { ...config.oscillation },
      noise: { ...config.noise },
      audio: { ...config.audio }
    }
  }

  getAudioSources () {
    const sources = []
    for (const config of this.trackConfigs.values()) {
      const audio = config?.audio
      if (!config?.enabled || !audio?.enabled || !(audio.amount > 0)) continue
      sources.push({
        ...audio,
        type: 'audio',
        enabled: true
      })
    }
    return sources
  }

  /**
   * Sample audio level [0, 1] for the track's line-audio config.
   * Reuses AudioModulationEngine (same path as audio modulators).
   */
  getAudioLevel (config) {
    const audio = config?.audio
    if (!audio || !audio.enabled || !(audio.amount > 0)) return 0

    const sourceType = audio.audioSourceType || 'input'
    let audioDeviceId = audio.audioDeviceId
    let audioTrackId = audio.audioTrackId

    // Fall back to first available source so Amount works without a picker visit
    if (sourceType === 'input' && !audioDeviceId) {
      const devices = this.audioEngine.getDevices?.() || []
      audioDeviceId = devices[0]?.deviceId || null
      if (!audioDeviceId) return 0
    }
    if (sourceType === 'file' && !audioTrackId) {
      const tracks = this.audioEngine.getTracks?.() || []
      audioTrackId = tracks[0]?.id || null
      if (!audioTrackId) return 0
    }

    const modulatorLike = {
      type: 'audio',
      enabled: true,
      audioSourceType: sourceType,
      audioDeviceId,
      audioTrackId,
      audioFeature: audio.audioFeature || 'rms',
      audioChannel: audio.audioChannel || 0,
      audioChannelMode: audio.audioChannelMode || 'mono',
      audioSmoothing:
        audio.audioSmoothing !== undefined ? audio.audioSmoothing : 0.7,
      audioFreqMin: audio.audioFreqMin ?? 20,
      audioFreqMax: audio.audioFreqMax ?? 20000,
      multiplier: 1,
      depth: 1,
      offset: 0
    }
    return this.audioEngine.getNormalizedLevel(modulatorLike)
  }

  /**
   * Apply composable line effects to a single vertex.
   * Mutates / returns reusable { x, y }. Prefer in-place for hot path.
   *
   * @param {number} x
   * @param {number} y
   * @param {{ index: number, prevX: number, prevY: number, hasPrev: boolean }} pathState
   * @param {object} config
   * @param {number} t elapsed seconds
   * @param {number} audioLevel 0..1
   * @param {{ x: number, y: number }} [out]
   */
  applyPoint (x, y, pathState, config, t, audioLevel = 0, out = this._out) {
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
      offset +=
        Math.sin(index * osc.frequency + osc.phase + t * osc.speed) *
        osc.amount
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

    const audio = config.audio
    if (audio && audio.enabled && audio.amount && audioLevel) {
      offset += audioLevel * audio.amount
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
  applyLine (lines, config, t = 0, audioLevel = 0) {
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
          audioLevel,
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
