import { TRACK_BLEND_MODES } from '../track-blend-modes.js'
import { getLuminodeDisplayName } from '../luminodes/index.js'

export class LuminodeMixerUI {
  constructor ({ container, trackManager, onChange } = {}) {
    this.container = container
    this.trackManager = trackManager
    this.onChange = onChange
    this.stripsEl = container?.querySelector('.luminode-mixer-strips')
    this.dragId = null
    this.suppressRender = false

    this.trackManager?.on('trackUpdated', ({ trackId, track }) => {
      if (this.suppressRender) return
      const active = document.activeElement
      if (
        active &&
        this.stripsEl?.contains(active) &&
        (active.matches('input, select') || active.closest('label'))
      ) {
        this.syncStripChrome(trackId, track)
        return
      }
      this.render()
    })
    this.trackManager?.on('tracksReordered', () => this.render())
    this.trackManager?.on('tracksReset', () => this.render())
    this.trackManager?.on('luminodeChanged', () => this.render())

    this.render()
  }

  syncStripChrome (trackId, track) {
    const strip = this.stripsEl?.querySelector(
      `.mixer-strip[data-track-id="${trackId}"]`
    )
    if (!strip || !track) return
    strip.classList.toggle('is-muted', Boolean(track.muted))
    strip.classList.toggle('is-solo', Boolean(track.solo))
    const muteBtn = strip.querySelector('[data-action="mute"]')
    const soloBtn = strip.querySelector('[data-action="solo"]')
    muteBtn?.classList.toggle('active', Boolean(track.muted))
    soloBtn?.classList.toggle('active', Boolean(track.solo))
  }

  render () {
    if (this.suppressRender) return
    if (!this.stripsEl || !this.trackManager) return
    const tracks = this.trackManager.getTracksByLayerOrder()
    this.stripsEl.innerHTML = ''

    tracks.forEach((track) => {
      this.stripsEl.appendChild(this.createStrip(track))
    })
  }

  createStrip (track) {
    const strip = document.createElement('div')
    strip.className = 'mixer-strip'
    strip.dataset.trackId = String(track.id)
    if (track.muted) strip.classList.add('is-muted')
    if (track.solo) strip.classList.add('is-solo')

    const luminodeLabel = track.luminode
      ? getLuminodeDisplayName(track.luminode)
      : '—'
    const opacity =
      typeof track.opacity === 'number' ? track.opacity : 1

    strip.innerHTML = `
      <div class="mixer-strip-handle" title="Drag to reorder" draggable="false">⋮⋮</div>
      <div class="mixer-strip-meta">
        <div class="mixer-strip-name">${escapeHtml(track.name || `Track ${track.id}`)}</div>
        <div class="mixer-strip-luminode" title="${escapeHtml(luminodeLabel)}">${escapeHtml(luminodeLabel)}</div>
      </div>
      <label class="mixer-strip-opacity">
        <output>${formatOpacity(opacity)}</output>
        <input
          type="range"
          class="mixer-fader"
          min="0"
          max="1"
          step="0.01"
          value="${opacity}"
          orient="vertical"
          data-action="opacity"
          aria-label="Opacity"
        />
        <span>Op</span>
      </label>
      <div class="mixer-strip-ms">
        <button type="button" class="mixer-mute-btn mute-btn${track.muted ? ' active' : ''}" data-action="mute" title="Mute">M</button>
        <button type="button" class="mixer-solo-btn solo-btn${track.solo ? ' active' : ''}" data-action="solo" title="Solo">S</button>
      </div>
      <label class="mixer-strip-blend">
        <select data-action="blend" title="Blend mode">
          ${TRACK_BLEND_MODES.map(
            (mode) =>
              `<option value="${mode}"${(track.blendMode || 'source-over') === mode ? ' selected' : ''}>${shortBlend(mode)}</option>`
          ).join('')}
        </select>
      </label>
    `

    strip.querySelector('[data-action="mute"]').addEventListener('click', () => {
      this.trackManager.toggleMute(track.id)
      this.onChange?.()
    })
    strip.querySelector('[data-action="solo"]').addEventListener('click', () => {
      this.trackManager.toggleSolo(track.id)
      this.onChange?.()
    })

    const opacityInput = strip.querySelector('[data-action="opacity"]')
    const opacityOut = strip.querySelector('.mixer-strip-opacity output')
    setFaderFill(opacityInput, opacity)
    opacityInput.addEventListener('input', () => {
      const value = Number(opacityInput.value)
      setFaderFill(opacityInput, value)
      this.trackManager.setTrackOpacity(track.id, value)
      if (opacityOut) opacityOut.textContent = formatOpacity(value)
      this.onChange?.()
    })

    strip.querySelector('[data-action="blend"]').addEventListener('change', (ev) => {
      this.trackManager.setTrackBlendMode(track.id, ev.target.value)
      this.onChange?.()
    })

    this.bindStripDrag(strip, track.id)
    return strip
  }

  bindStripDrag (strip, trackId) {
    const handle = strip.querySelector('.mixer-strip-handle')
    if (!handle) return

    handle.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return
      ev.preventDefault()
      this.dragId = trackId
      this.suppressRender = true
      strip.classList.add('is-dragging')
      handle.setPointerCapture(ev.pointerId)

      const onMove = (moveEv) => {
        const el = document.elementFromPoint(moveEv.clientX, moveEv.clientY)
        const over = el?.closest?.('.mixer-strip')
        if (!over || over === strip || !this.stripsEl) return
        const rect = over.getBoundingClientRect()
        const before = moveEv.clientX < rect.left + rect.width / 2
        if (before) {
          this.stripsEl.insertBefore(strip, over)
        } else {
          this.stripsEl.insertBefore(strip, over.nextSibling)
        }
      }

      const onEnd = () => {
        strip.classList.remove('is-dragging')
        this.dragId = null
        const order = [...this.stripsEl.querySelectorAll('.mixer-strip')].map(
          (el) => Number(el.dataset.trackId)
        )
        this.suppressRender = false
        this.trackManager.reorderTracks(order)
        this.onChange?.()
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onEnd)
        window.removeEventListener('pointercancel', onEnd)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onEnd)
      window.addEventListener('pointercancel', onEnd)
    })
  }
}

function formatOpacity (value) {
  const n = typeof value === 'number' ? value : 1
  return n.toFixed(2)
}

function setFaderFill (input, value) {
  if (!input) return
  const n = typeof value === 'number' ? value : Number(input.value)
  const pct = `${Math.min(1, Math.max(0, Number.isNaN(n) ? 1 : n)) * 100}%`
  input.style.setProperty('--fader-fill', pct)
}

function shortBlend (mode) {
  const map = {
    'source-over': 'normal',
    'color-dodge': 'dodge',
    'color-burn': 'burn',
    'hard-light': 'hard',
    'soft-light': 'soft'
  }
  return map[mode] || mode
}

function escapeHtml (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
