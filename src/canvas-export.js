import { SETTINGS } from './settings.js'
import { getC2S } from './lib/canvas2svg-c2s.js'

export function glowSnapshotName (ext) {
  return `glow-snapshot-${Date.now()}.${ext}`
}

function downloadObjectUrl (url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  a.click()
}

function patchLuminodeContexts (trackLuminodes, ctx) {
  for (const lum of trackLuminodes.values()) {
    if (lum && typeof lum === 'object' && 'ctx' in lum) lum.ctx = ctx
  }
}

function pngLayers (visualizer) {
  const list = [...visualizer.getGlassOverlaySources()]
  const glass = visualizer.glassOverlayCanvas
  if (
    SETTINGS.CANVAS.GLASS_OVERLAY_ENABLED &&
    glass &&
    glass.style.display !== 'none'
  ) {
    list.push(glass)
  }
  return list
}

function compositePngBlob (layers, w, h, scale) {
  const rw = Math.max(1, Math.round(w * scale))
  const rh = Math.max(1, Math.round(h * scale))
  const c = document.createElement('canvas')
  c.width = rw
  c.height = rh
  const x = c.getContext('2d')
  for (const el of layers) {
    if (!el || el.width < 1) continue
    if (el instanceof HTMLCanvasElement && el.style?.display === 'none') {
      continue
    }
    x.drawImage(el, 0, 0, rw, rh)
  }
  return new Promise((resolve) => {
    c.toBlob((b) => resolve(b), 'image/png')
  })
}

export async function downloadPngSnapshot (visualizer, scale = 1) {
  const w = window.innerWidth
  const h = window.innerHeight
  const blob = await compositePngBlob(pngLayers(visualizer), w, h, scale)
  if (!blob) return
  const url = URL.createObjectURL(blob)
  try {
    downloadObjectUrl(url, glowSnapshotName('png'))
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function downloadSvgSnapshot (visualizer) {
  const C2S = getC2S()
  if (!C2S) {
    console.warn('C2S (canvas2svg) unavailable')
    return
  }
  const drawer = visualizer.canvasDrawer
  const w = drawer.width
  const h = drawer.height
  const c2s = new C2S(w, h)
  const prev = drawer.ctx
  drawer.ctx = c2s
  patchLuminodeContexts(visualizer.trackLuminodes, c2s)
  try {
    const t = performance.now() / 1000
    const activeNotes = visualizer.midiManager.getActiveNotesForTracks()
    const restoreCanvasMod = visualizer.applyModulationToCanvas()
    drawer.clear()
    drawer.drawGrid()
    visualizer.drawLuminodes(t, activeNotes)
    if (restoreCanvasMod) restoreCanvasMod()
    const svg =
      typeof c2s.getSerializedSvg === 'function'
        ? c2s.getSerializedSvg(true)
        : ''
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    try {
      downloadObjectUrl(url, glowSnapshotName('svg'))
    } finally {
      URL.revokeObjectURL(url)
    }
  } finally {
    drawer.ctx = prev
    patchLuminodeContexts(visualizer.trackLuminodes, prev)
  }
}
