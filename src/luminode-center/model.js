/**
 * User luminode data model and helpers.
 * Shape is designed so a .luminode file can be this JSON (+ source + settings).
 */

export const LUMINODE_FORMAT = 'luminode'
export const LUMINODE_FORMAT_VERSION = 1
export const USER_GROUP = 'User'

export function createUserLuminode ({
  id,
  name,
  source,
  forkedFrom = null,
  moduleSettings = null,
  configSchema = null,
  createdAt = null,
  updatedAt = null
} = {}) {
  const now = new Date().toISOString()
  const resolvedId = id || generateUserId(name)
  return {
    format: LUMINODE_FORMAT,
    version: LUMINODE_FORMAT_VERSION,
    id: resolvedId,
    name: name || 'Untitled',
    source: source || '',
    forkedFrom,
    settingsKey: toSettingsKey(resolvedId),
    moduleSettings: moduleSettings && typeof moduleSettings === 'object'
      ? moduleSettings
      : { LINE_WIDTH: 1.5 },
    configSchema: Array.isArray(configSchema) ? configSchema : null,
    createdAt: createdAt || now,
    updatedAt: updatedAt || now
  }
}

export function generateUserId (name = 'luminode') {
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24) || 'luminode'
  const suffix = Math.random().toString(36).slice(2, 8)
  return `user_${slug}_${suffix}`
}

export function toSettingsKey (id) {
  return String(id).toUpperCase().replace(/[^A-Z0-9]/g, '_')
}

export function isUserLuminodeId (id) {
  return typeof id === 'string' && id.startsWith('user_')
}

/** Map registry keys → source files under src/luminodes/ */
export const BUILTIN_SOURCE_FILES = {
  lissajous: 'lissajous.js',
  harmonograph: 'harmonograph.js',
  sphere: 'sphere.js',
  gegoNet: 'gego-net.js',
  gegoShape: 'gego-shape.js',
  sotoGrid: 'soto-grid.js',
  sotoGridRotated: 'soto-grid.js',
  whitneyLines: 'whitney-lines.js',
  sinewave: 'sinewave.js',
  triangle: 'triangle.js',
  noiseValley: 'noise-valley.js',
  catenoid: 'catenoid.js',
  lineCylinder: 'cylinder.js',
  clavilux: 'clavilux.js',
  diamond: 'diamond.js',
  cube: 'cube.js',
  trefoil: 'trefoil.js',
  sphericalLens: 'spherical-lens.js',
  epitrochoid: 'epitrochoid.js',
  syncHelix2D: 'sync-helix-2d.js',
  ramiel: 'ramiel.js',
  windmill: 'windmill.js',
  orizuru: 'orizuru.js',
  deJong: 'de-jong.js',
  squareTunnel: 'square-tunnel.js',
  moireCircles: 'moire-circles.js',
  doublePendulum: 'double-pendulum.js'
}

export function getBuiltinSourceUrl (key) {
  const file = BUILTIN_SOURCE_FILES[key]
  if (!file) return null
  return new URL(`../luminodes/${file}`, import.meta.url).href
}
