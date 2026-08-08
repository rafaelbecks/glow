/**
 * Settings helpers for Luminode Lab drafts.
 */
import { SETTINGS } from '../settings.js'
import { getLuminodeConfig } from '../luminode-configs.js'
import { getLuminodeSettingsKey } from '../luminodes/index.js'

export function deepClone (value) {
  return JSON.parse(JSON.stringify(value ?? null))
}

export function loadBuiltinModuleBundle (luminodeKey) {
  const settingsKey = getLuminodeSettingsKey(luminodeKey)
  const values = deepClone(SETTINGS.MODULES[settingsKey] || {})
  const schema = deepClone(getLuminodeConfig(luminodeKey) || [])
  return { settingsKey, values, schema }
}

/** Rewrite SETTINGS.MODULES.<KEY> → MODULE so drafts use the injected bag. */
export function rewriteModuleAccess (source, settingsKey) {
  if (!source || !settingsKey) return source || ''
  const re = new RegExp(`SETTINGS\\.MODULES\\.${settingsKey}\\b`, 'g')
  return source.replace(re, 'MODULE')
}

/**
 * Infer a basic Tweakpane schema from a flat/nested values object.
 */
export function inferConfigSchema (values, existingSchema = []) {
  const byKey = new Map((existingSchema || []).map((p) => [p.key, p]))
  const schema = []

  Object.entries(values || {}).forEach(([key, value]) => {
    if (byKey.has(key)) {
      const prev = byKey.get(key)
      const next = { ...prev, default: value }
      // Number you put in JSON is the slider maximum
      if (
        typeof value === 'number' &&
        (prev.type === 'slider' || prev.type === 'number')
      ) {
        Object.assign(next, numberSliderBounds(value))
      }
      schema.push(next)
      return
    }
    schema.push(inferParam(key, value))
  })

  return schema
}

/** Slider range: value is max (or min when negative). */
function numberSliderBounds (value) {
  const abs = Math.abs(value) || 1
  const step = abs >= 10 ? 1 : abs >= 1 ? 0.1 : 0.01
  if (value < 0) {
    return { min: value, max: 0, step }
  }
  return { min: 0, max: value === 0 ? 1 : value, step }
}

function inferParam (key, value) {
  const label = key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  if (typeof value === 'boolean') {
    return { key, label, type: 'checkbox', default: value }
  }

  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('x' in value || 'y' in value || 'z' in value)
  ) {
    return {
      key,
      label,
      type: 'rotation',
      default: {
        x: Number(value.x) || 0,
        y: Number(value.y) || 0,
        z: Number(value.z) || 0
      }
    }
  }

  if (typeof value === 'number') {
    return {
      key,
      label,
      type: 'slider',
      ...numberSliderBounds(value),
      default: value
    }
  }

  if (typeof value === 'string') {
    return { key, label, type: 'text', default: value }
  }

  return { key, label, type: 'json', default: value }
}

export const DEFAULT_MODULE_SETTINGS = {
  LINE_WIDTH: 1.5
}

export const DEFAULT_CONFIG_SCHEMA = [
  {
    key: 'LINE_WIDTH',
    label: 'Line Width',
    type: 'slider',
    min: 0,
    max: 1.5,
    step: 0.1,
    default: 1.5
  }
]
