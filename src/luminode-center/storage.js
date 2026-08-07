/**
 * Local-first persistence for user luminodes (localStorage).
 * Documents match the .luminode JSON shape for future import/export.
 */
import { createUserLuminode, LUMINODE_FORMAT } from './model.js'

const STORAGE_KEY = 'glow_user_luminodes'

export function loadAllUserLuminodes () {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && typeof item.source === 'string' && item.id)
      .map((item) =>
        createUserLuminode({
          id: item.id,
          name: item.name,
          source: item.source,
          forkedFrom: item.forkedFrom || null,
          moduleSettings: item.moduleSettings || null,
          configSchema: item.configSchema || null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        })
      )
  } catch (err) {
    console.warn('Failed to load user luminodes:', err)
    return []
  }
}

export function saveAllUserLuminodes (list) {
  const payload = list.map((item) => ({
    format: LUMINODE_FORMAT,
    version: item.version,
    id: item.id,
    name: item.name,
    source: item.source,
    forkedFrom: item.forkedFrom || null,
    settingsKey: item.settingsKey,
    moduleSettings: item.moduleSettings || {},
    configSchema: item.configSchema || null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function upsertUserLuminode (doc) {
  const list = loadAllUserLuminodes()
  const idx = list.findIndex((d) => d.id === doc.id)
  const next = {
    ...doc,
    updatedAt: new Date().toISOString()
  }
  if (idx >= 0) list[idx] = next
  else list.push(next)
  saveAllUserLuminodes(list)
  return next
}

export function deleteUserLuminode (id) {
  const list = loadAllUserLuminodes().filter((d) => d.id !== id)
  saveAllUserLuminodes(list)
  return list
}

export function getUserLuminode (id) {
  return loadAllUserLuminodes().find((d) => d.id === id) || null
}

/** Serialize one luminode for .luminode download */
export function toLuminodeFile (doc) {
  return JSON.stringify(
    {
      format: LUMINODE_FORMAT,
      version: doc.version || 1,
      id: doc.id,
      name: doc.name,
      source: doc.source,
      forkedFrom: doc.forkedFrom || null,
      settingsKey: doc.settingsKey,
      moduleSettings: doc.moduleSettings || {},
      configSchema: doc.configSchema || null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    },
    null,
    2
  )
}

export function parseLuminodeFile (text) {
  const data = JSON.parse(text)
  if (!data || typeof data.source !== 'string') {
    throw new Error('Invalid .luminode file')
  }
  return createUserLuminode({
    id: data.id,
    name: data.name || 'Imported',
    source: data.source,
    forkedFrom: data.forkedFrom || null,
    moduleSettings: data.moduleSettings || null,
    configSchema: data.configSchema || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  })
}

export function downloadLuminodeFile (doc) {
  const blob = new Blob([toLuminodeFile(doc)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = String(doc.name || 'luminode')
    .replace(/[^a-z0-9-_]+/gi, '_')
    .slice(0, 40)
  a.href = url
  a.download = `${safeName}.luminode`
  a.click()
  URL.revokeObjectURL(url)
}
