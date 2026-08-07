/**
 * Compile luminode source into a class constructor.
 * Tradeoff: uses new Function with a GLOW runtime scope injected — simple, no bundler,
 * errors stay isolated to the compile call / draw try-catch. Not a security sandbox;
 * appropriate for a local creative tool where the user authors their own code.
 *
 * Built-in luminodes import helpers (rotation-utils, shaders, pattern data). Those
 * imports are stripped for the editor; the same bindings are provided here as globals.
 */
import { SETTINGS, UTILS } from '../settings.js'
import { getEulerRotation, isRotationEnabled } from '../rotation-utils.js'
import {
  ORIZURU_SVG_DATA,
  ORIZURU_UNFOLDED_OBJ,
  ORIZURU_FOLDED_OBJ,
  ORIZURU_FACE_DATA
} from '../luminodes/orizuru-patterns.js'
import {
  DE_JONG_VERTEX_SHADER,
  DE_JONG_FRAGMENT_SHADER
} from '../luminodes/shaders/de-jong-shaders.js'

/** Bindings available to edited luminode source (no imports required). */
export const LUMINODE_RUNTIME_SCOPE = {
  SETTINGS,
  UTILS,
  getEulerRotation,
  isRotationEnabled,
  ORIZURU_SVG_DATA,
  ORIZURU_UNFOLDED_OBJ,
  ORIZURU_FOLDED_OBJ,
  ORIZURU_FACE_DATA,
  DE_JONG_VERTEX_SHADER,
  DE_JONG_FRAGMENT_SHADER
}

/**
 * Strip ES module syntax so the body can run inside new Function.
 * Expects a class definition; returns that class.
 */
export function prepareSource (source) {
  if (!source || typeof source !== 'string') {
    throw new Error('Source is empty')
  }

  return source
    // Multiline + single-line imports
    .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
    .replace(/^\s*import\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
    .replace(/^\s*export\s+\{[\s\S]*?\}\s*;?\s*$/gm, '')
    .replace(/\bexport\s+default\s+/g, '')
    .replace(/\bexport\s+class\s+/g, 'class ')
    .replace(/\bexport\s+function\s+/g, 'function ')
    .replace(/\bexport\s+const\s+/g, 'const ')
    .replace(/\bexport\s+let\s+/g, 'let ')
    .replace(/\bexport\s+var\s+/g, 'var ')
    .trim()
}

function findClassName (code) {
  if (/\bclass\s+Luminode\b/.test(code)) return 'Luminode'
  const matches = [...code.matchAll(/\bclass\s+([A-Za-z_][A-Za-z0-9_]*)/g)]
  if (matches.length === 0) {
    throw new Error('No class found — define `class Luminode { ... }`')
  }
  // Prefer *Luminode suffix when present
  const preferred = matches.find((m) => /Luminode$/.test(m[1]))
  return (preferred || matches[matches.length - 1])[1]
}

/**
 * @param {string} source
 * @param {{ module?: object }} [options] - MODULE bag injected for this luminode
 * @returns {{ ok: true, Class: Function, className: string } | { ok: false, error: Error }}
 */
export function compileLuminodeSource (source, options = {}) {
  try {
    const code = prepareSource(source)
    if (!code) throw new Error('Source is empty after stripping imports')

    const className = findClassName(code)
    const moduleBag = options.module && typeof options.module === 'object'
      ? options.module
      : {}

    const scope = {
      ...LUMINODE_RUNTIME_SCOPE,
      MODULE: moduleBag
    }
    const keys = Object.keys(scope)
    const values = keys.map((k) => scope[k])

    // eslint-disable-next-line no-new-func
    const factory = new Function(
      ...keys,
      `${code}\n; if (typeof ${className} === 'undefined') throw new Error('Class ${className} was not defined'); return ${className};`
    )
    const Class = factory(...values)

    if (typeof Class !== 'function') {
      throw new Error('Compiled result is not a constructor')
    }

    return { ok: true, Class, className }
  } catch (error) {
    return { ok: false, error }
  }
}

/**
 * Fetch built-in luminode source and prepare it for the editor.
 */
export async function loadBuiltinSource (url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load source (${res.status})`)
  const raw = await res.text()
  return prepareSourceForEditor(raw)
}

export function prepareSourceForEditor (raw) {
  const body = prepareSource(raw)
  const header = `// Built-in luminode source (editable copy).
// GLOW injects: MODULE (this luminode’s settings), SETTINGS, UTILS,
// getEulerRotation, isRotationEnabled, and luminode-specific helpers.
// Imports were removed. Prefer MODULE.* over SETTINGS.MODULES.*.
`
  return `${header}\n${body}\n`
}
