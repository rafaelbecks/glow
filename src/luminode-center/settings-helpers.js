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
      schema.push({ ...byKey.get(key), default: value })
      return
    }
    schema.push(inferParam(key, value))
  })

  return schema
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
    const abs = Math.abs(value) || 1
    const max = Math.max(abs * 4, 10)
    const min = value < 0 ? -max : 0
    const step = abs >= 10 ? 1 : abs >= 1 ? 0.1 : 0.01
    return { key, label, type: 'slider', min, max, step, default: value }
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
    min: 0.5,
    max: 8,
    step: 0.1,
    default: 1.5
  }
]
