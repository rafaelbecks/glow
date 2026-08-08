/**
 * CodeMirror hint helper for Luminode Lab.
 * Combines JS hints with MODULE settings keys and GLOW globals.
 */

const MATH_PROPS = Object.getOwnPropertyNames(Math).filter(
  (k) => typeof Math[k] === 'function' || typeof Math[k] === 'number'
)

const UTILS_PROPS = [
  'pitchToColor',
  'hexToRgba',
  'hslaToRgb',
  'rotate3D',
  'pitchColorFactor'
]

const GLOBAL_WORDS = [
  'MODULE',
  'SETTINGS',
  'UTILS',
  'getEulerRotation',
  'isRotationEnabled',
  'Math',
  'performance',
  'console',
  'Object',
  'Array',
  'JSON',
  'Number',
  'String',
  'Boolean',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'requestAnimationFrame',
  'cancelAnimationFrame'
]

const DRAWER_PROPS = [
  'getContext',
  'getDimensions',
  'applyLayoutTransform',
  'restoreLayoutTransform'
]

function uniqueSorted (list) {
  return [...new Set(list)].filter(Boolean).sort()
}

function wordListHint (cm, words) {
  const cursor = cm.getCursor()
  const token = cm.getTokenAt(cursor)
  let start = token.start
  let end = cursor.ch
  const word = token.string

  if (!/^[\w$]*$/.test(word)) {
    start = end = cursor.ch
  }

  const prefix = cm.getLine(cursor.line).slice(start, end)
  const list = words.filter((w) =>
    w.toLowerCase().startsWith(prefix.toLowerCase())
  )

  return {
    list,
    from: window.CodeMirror.Pos(cursor.line, start),
    to: window.CodeMirror.Pos(cursor.line, end)
  }
}

/**
 * @param {() => string[]} getModuleKeys
 */
export function createLuminodeHint (getModuleKeys) {
  return function luminodeHint (cm) {
    const CM = window.CodeMirror
    if (!CM) return

    const cursor = cm.getCursor()
    const line = cm.getLine(cursor.line)
    const before = line.slice(0, cursor.ch)

    const moduleMatch = /MODULE\.(\w*)$/.exec(before)
    if (moduleMatch) {
      const keys = typeof getModuleKeys === 'function' ? getModuleKeys() : []
      const prefix = moduleMatch[1] || ''
      const list = keys.filter((k) =>
        k.toLowerCase().startsWith(prefix.toLowerCase())
      )
      return {
        list: uniqueSorted(list),
        from: CM.Pos(cursor.line, cursor.ch - prefix.length),
        to: cursor
      }
    }

    const utilsMatch = /UTILS\.(\w*)$/.exec(before)
    if (utilsMatch) {
      const prefix = utilsMatch[1] || ''
      const list = UTILS_PROPS.filter((k) =>
        k.toLowerCase().startsWith(prefix.toLowerCase())
      )
      return {
        list: uniqueSorted(list),
        from: CM.Pos(cursor.line, cursor.ch - prefix.length),
        to: cursor
      }
    }

    const mathMatch = /Math\.(\w*)$/.exec(before)
    if (mathMatch) {
      const prefix = mathMatch[1] || ''
      const list = MATH_PROPS.filter((k) =>
        k.toLowerCase().startsWith(prefix.toLowerCase())
      )
      return {
        list: uniqueSorted(list),
        from: CM.Pos(cursor.line, cursor.ch - prefix.length),
        to: cursor
      }
    }

    const drawerMatch = /(?:canvasDrawer|this\.canvasDrawer)\.(\w*)$/.exec(before)
    if (drawerMatch) {
      const prefix = drawerMatch[1] || ''
      const list = DRAWER_PROPS.filter((k) =>
        k.toLowerCase().startsWith(prefix.toLowerCase())
      )
      return {
        list: uniqueSorted(list),
        from: CM.Pos(cursor.line, cursor.ch - prefix.length),
        to: cursor
      }
    }

    // Default: javascript hint + GLOW globals + MODULE keys as bare words
    let base = { list: [] }
    if (CM.hint?.javascript) {
      base = CM.hint.javascript(cm) || base
    } else if (CM.hint?.anyword) {
      base = CM.hint.anyword(cm) || base
    }

    const moduleKeys = typeof getModuleKeys === 'function' ? getModuleKeys() : []
    const extras = uniqueSorted([
      ...GLOBAL_WORDS,
      ...moduleKeys,
      ...MATH_PROPS.map((m) => `Math.${m}`),
      ...UTILS_PROPS.map((u) => `UTILS.${u}`)
    ])

    const fromExtra = wordListHint(cm, extras)
    const combined = uniqueSorted([
      ...(base.list || []).map((item) =>
        typeof item === 'string' ? item : item.text
      ),
      ...(fromExtra.list || [])
    ])

    return {
      list: combined,
      from: base.from || fromExtra.from,
      to: base.to || fromExtra.to
    }
  }
}

export function attachEditorHints (cm, getModuleKeys) {
  if (!cm || typeof window.CodeMirror === 'undefined') return
  if (!window.CodeMirror.showHint) return

  const hint = createLuminodeHint(getModuleKeys)

  cm.setOption('extraKeys', {
    ...(cm.getOption('extraKeys') || {}),
    'Ctrl-Space': 'autocomplete',
    'Cmd-Space': 'autocomplete'
  })

  cm.on('inputRead', (editor, change) => {
    if (change.origin !== '+input' && change.origin !== 'complete') return
    const text = change.text.join('')
    if (!text || /\s/.test(text)) return
    // Auto-trigger after `.` or identifier chars
    if (text === '.' || /[\w$]/.test(text)) {
      window.CodeMirror.showHint(editor, hint, {
        completeSingle: false,
        alignWithWord: true
      })
    }
  })

  cm.on('keydown', (editor, e) => {
    if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
      e.preventDefault()
      window.CodeMirror.showHint(editor, hint, { completeSingle: false })
    }
  })
}
