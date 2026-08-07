/**
 * Register / unregister user luminodes into the live GLOW registries.
 */
import { LUMINODE_REGISTRY } from '../luminodes/index.js'
import { LUMINODE_CONFIGS } from '../luminode-configs.js'
import { SETTINGS } from '../settings.js'
import { USER_GROUP, isUserLuminodeId } from './model.js'
import { compileLuminodeSource } from './runtime.js'
import {
  DEFAULT_MODULE_SETTINGS,
  DEFAULT_CONFIG_SCHEMA,
  inferConfigSchema,
  deepClone
} from './settings-helpers.js'

/**
 * @param {object} doc - user luminode document
 * @param {object} [hooks] - { onRegistered(id, Class), midiManager, trackManager, visualizer }
 */
export function registerUserLuminode (doc, hooks = {}) {
  const settingsKey = doc.settingsKey || doc.id.toUpperCase()
  const moduleSettings = deepClone(doc.moduleSettings || DEFAULT_MODULE_SETTINGS)
  const configSchema = Array.isArray(doc.configSchema) && doc.configSchema.length
    ? deepClone(doc.configSchema)
    : inferConfigSchema(moduleSettings, DEFAULT_CONFIG_SCHEMA)

  const compiled = compileLuminodeSource(doc.source, { module: moduleSettings })
  if (!compiled.ok) {
    return { ok: false, error: compiled.error }
  }

  const { Class } = compiled

  LUMINODE_REGISTRY[doc.id] = {
    class: Class,
    displayName: doc.name,
    settingsKey,
    isUser: true,
    forkedFrom: doc.forkedFrom || null
  }

  LUMINODE_CONFIGS[doc.id] = {
    group: USER_GROUP,
    config: configSchema
  }

  SETTINGS.MODULES[settingsKey] = moduleSettings

  // Recompile with MODULE pointing at the live SETTINGS bag so tweaks apply
  const liveCompiled = compileLuminodeSource(doc.source, {
    module: SETTINGS.MODULES[settingsKey]
  })
  if (liveCompiled.ok) {
    LUMINODE_REGISTRY[doc.id].class = liveCompiled.Class
    syncConsumers(doc.id, liveCompiled.Class, hooks)
    return { ok: true, Class: liveCompiled.Class }
  }

  syncConsumers(doc.id, Class, hooks)
  return { ok: true, Class }
}

export function unregisterUserLuminode (id, hooks = {}) {
  if (!isUserLuminodeId(id)) return
  const settingsKey = LUMINODE_REGISTRY[id]?.settingsKey
  delete LUMINODE_REGISTRY[id]
  delete LUMINODE_CONFIGS[id]
  if (settingsKey && SETTINGS.MODULES[settingsKey]) {
    delete SETTINGS.MODULES[settingsKey]
  }

  if (hooks.visualizer?.luminodeFactory) {
    delete hooks.visualizer.luminodeFactory[id]
  }
  if (hooks.trackManager) {
    hooks.trackManager.availableLuminodes = Object.keys(LUMINODE_REGISTRY)
  }
  if (hooks.midiManager?.activeNotes) {
    delete hooks.midiManager.activeNotes[id]
  }
}

function syncConsumers (id, Class, hooks) {
  if (hooks.visualizer) {
    hooks.visualizer.luminodeFactory = hooks.visualizer.luminodeFactory || {}
    hooks.visualizer.luminodeFactory[id] = Class
  }
  if (hooks.trackManager) {
    hooks.trackManager.availableLuminodes = Object.keys(LUMINODE_REGISTRY)
  }
  if (hooks.midiManager) {
    if (!hooks.midiManager.activeNotes[id]) {
      hooks.midiManager.activeNotes[id] = []
    }
  }
  if (typeof hooks.onRegistered === 'function') {
    hooks.onRegistered(id, Class)
  }
}

/**
 * Load all saved user luminodes into the runtime registries.
 */
export function bootstrapUserLuminodes (hooks = {}) {
  return import('./storage.js').then(({ loadAllUserLuminodes }) => {
    const docs = loadAllUserLuminodes()
    const results = []
    docs.forEach((doc) => {
      const result = registerUserLuminode(doc, hooks)
      results.push({ id: doc.id, ...result })
      if (!result.ok) {
        console.warn(`Skipped user luminode ${doc.id}:`, result.error)
      }
    })
    return results
  })
}
