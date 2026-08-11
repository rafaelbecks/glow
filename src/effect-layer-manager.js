import { SETTINGS } from './settings.js'

export const EFFECT_LAYER_IDS = [
  'shaderBackground',
  'luminodes',
  'chromaticAberration',
  'glassOverlay',
  'noise',
  'dither',
  'crt'
]

export const DEFAULT_EFFECT_LAYER_ORDER = [...EFFECT_LAYER_IDS]

export const EFFECT_LAYER_META = {
  shaderBackground: {
    label: 'Shader BG',
    locked: false,
    enableKey: 'SHADER_BACKGROUND_ENABLED',
    modulation: {
      configKeyPrefixes: ['SHADER_BACKGROUND_']
    }
  },
  luminodes: {
    label: 'Luminodes',
    locked: true,
    enableKey: null,
    modulation: null
  },
  chromaticAberration: {
    label: 'Chromatic',
    locked: false,
    enableKey: 'CHROMATIC_ABERRATION_ENABLED',
    modulation: {
      configKeyPrefixes: ['CHROMATIC_ABERRATION_']
    }
  },
  glassOverlay: {
    label: 'Glass / Rain',
    locked: false,
    enableKey: 'GLASS_OVERLAY_ENABLED',
    modulation: {
      shaderOverlays: ['rain'],
      configKeyPrefixes: ['SHADER_OVERLAY_RAIN_', 'GLASS_OVERLAY_']
    }
  },
  noise: {
    label: 'Noise',
    locked: false,
    enableKey: 'NOISE_OVERLAY',
    modulation: {
      configKeyPrefixes: ['NOISE_']
    }
  },
  dither: {
    label: 'Dither',
    locked: false,
    enableKey: 'DITHER_OVERLAY',
    modulation: {
      canvasFilters: ['dither'],
      configKeyPrefixes: ['DITHER_']
    }
  },
  crt: {
    label: 'CRT',
    locked: false,
    enableKey: 'CRT_MODE',
    modulation: {
      configKeyPrefixes: ['CRT_']
    }
  }
}

const LUMINODES_Z = 1
const Z_BELOW_BASE = 0
/** Effects stacked above luminodes; keep below interactive UI (z≥10). */
const Z_ABOVE_BASE = 3
const Z_ABOVE_MAX = 9

export class EffectLayerManager {
  constructor (options = {}) {
    this.order = [...DEFAULT_EFFECT_LAYER_ORDER]
    this.callbacks = {}
    this.resolveElement = options.resolveElement || defaultResolveElement
  }

  on (event, callback) {
    if (!this.callbacks[event]) this.callbacks[event] = []
    this.callbacks[event].push(callback)
  }

  trigger (event, data) {
    ;(this.callbacks[event] || []).forEach((cb) => cb(data))
  }

  getOrder () {
    return [...this.order]
  }

  getDefaultOrder () {
    return [...DEFAULT_EFFECT_LAYER_ORDER]
  }

  isLocked (id) {
    return EFFECT_LAYER_META[id]?.locked === true
  }

  getMeta (id) {
    return (
      EFFECT_LAYER_META[id] || { label: id, locked: false, enableKey: null }
    )
  }

  isEnabled (id) {
    const meta = this.getMeta(id)
    if (!meta.enableKey) return true
    return Boolean(SETTINGS.CANVAS[meta.enableKey])
  }

  canToggle (id) {
    const meta = this.getMeta(id)
    return Boolean(meta.enableKey) && !this.isLocked(id)
  }

  toggleEnabled (id) {
    if (!this.canToggle(id)) return null
    const meta = this.getMeta(id)
    const next = !Boolean(SETTINGS.CANVAS[meta.enableKey])
    SETTINGS.CANVAS[meta.enableKey] = next
    this.trigger('enabledChanged', {
      id,
      enabled: next,
      setting: meta.enableKey,
      value: next
    })
    return next
  }

  isModulated (id, modulators = []) {
    const spec = this.getMeta(id)?.modulation
    if (!spec || !Array.isArray(modulators) || modulators.length === 0) {
      return false
    }

    return modulators.some((m) => {
      if (!m || !m.enabled) return false
      if (
        spec.canvasFilters?.length &&
        m.targetDestination === 'canvasFilter' &&
        spec.canvasFilters.includes(m.targetCanvasFilter)
      ) {
        return true
      }
      if (
        spec.shaderOverlays?.length &&
        m.targetDestination === 'shaderOverlay' &&
        spec.shaderOverlays.includes(m.targetShaderOverlay)
      ) {
        return true
      }
      const key = m.targetConfigKey
      if (
        key &&
        spec.configKeyPrefixes?.some((prefix) => key.startsWith(prefix))
      ) {
        return true
      }
      return false
    })
  }

  normalizeOrder (order) {
    const incoming = Array.isArray(order) ? order.filter(Boolean) : []
    const seen = new Set()
    const next = []

    for (const id of incoming) {
      if (!EFFECT_LAYER_IDS.includes(id) || seen.has(id)) continue
      seen.add(id)
      next.push(id)
    }

    for (const id of DEFAULT_EFFECT_LAYER_ORDER) {
      if (!seen.has(id)) next.push(id)
    }

    if (!next.includes('luminodes')) {
      next.splice(Math.min(1, next.length), 0, 'luminodes')
    }

    return next
  }

  setOrder (order, { silent = false } = {}) {
    this.order = this.normalizeOrder(order)
    this.applyOrder()
    if (!silent) {
      this.trigger('orderChanged', { order: this.getOrder() })
    }
  }

  /**
   * Move a non-locked layer to a new index in the full order list.
   * Luminodes stays in the list but cannot be the dragged id.
   */
  moveLayer (id, toIndex) {
    if (this.isLocked(id) || !EFFECT_LAYER_IDS.includes(id)) return
    const next = this.getOrder()
    const from = next.indexOf(id)
    if (from < 0) return
    next.splice(from, 1)
    const insertAt = Math.max(0, Math.min(toIndex, next.length))
    next.splice(insertAt, 0, id)
    this.setOrder(next)
  }

  applyOrder () {
    const order = this.getOrder()
    const anchor = order.indexOf('luminodes')

    const luminodesEl = this.resolveElement('luminodes')
    if (luminodesEl) {
      luminodesEl.style.zIndex = String(LUMINODES_Z)
    }

    order.forEach((id, index) => {
      if (id === 'luminodes') return
      const z = this.zIndexFor(index, anchor)
      this.applyZToLayer(id, z)
    })
  }

  zIndexFor (index, anchor) {
    if (anchor < 0) return Z_ABOVE_BASE + index
    if (index < anchor) return Z_BELOW_BASE + index
    const above = Z_ABOVE_BASE + (index - anchor - 1)
    // CRT and other pointer-events:none overlays may sit above UI visually;
    // keep non-CRT layers under the UI chrome band (z≥10).
    return Math.min(above, Z_ABOVE_MAX)
  }

  applyZToLayer (id, z) {
    // CRT is intentionally above most chrome; it has pointer-events: none.
    const value = String(id === 'crt' ? Math.max(z, 100) : z)
    if (id === 'shaderBackground') {
      const fluid = document.getElementById('fluidBackgroundCanvas')
      const procedural = document.getElementById('proceduralBackgroundCanvas')
      if (fluid) fluid.style.zIndex = value
      if (procedural) procedural.style.zIndex = value
      return
    }
    const el = this.resolveElement(id)
    if (el) el.style.zIndex = value
  }
}

function defaultResolveElement (id) {
  switch (id) {
    case 'shaderBackground':
      return (
        document.getElementById('fluidBackgroundCanvas') ||
        document.getElementById('proceduralBackgroundCanvas')
      )
    case 'luminodes':
      return document.getElementById('canvas')
    case 'chromaticAberration':
      return document.getElementById('chromaticAberrationOverlay')
    case 'glassOverlay':
      return document.getElementById('glassOverlayCanvas')
    case 'noise':
      return document.getElementById('noiseOverlay')
    case 'dither':
      return document.getElementById('ditherOverlay')
    case 'crt':
      return document.querySelector('.crt-overlay')
    default:
      return null
  }
}
