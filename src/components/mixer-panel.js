import { LuminodeMixerUI } from './luminode-mixer-ui.js'
import { EffectChainUI } from './effect-chain-ui.js'

const STORAGE_KEY = 'glow-mixer-panel'
const DEFAULT_HEIGHT = 260
const MIN_HEIGHT = 120
const MIN_VIEWER = 160

export class MixerPanel {
  constructor ({ trackManager, effectLayerManager } = {}) {
    this.trackManager = trackManager
    this.effectLayerManager = effectLayerManager
    this.expandedHeight = DEFAULT_HEIGHT
    this.luminodeMixerUI = null
    this.effectChainUI = null
    this.panel = null
    this.onChange = null
    this.onRequestClose = null
    this.onToggleEffect = null
    this._outsideCloseBound = false
    this._onOutsidePointerDown = (ev) => this.handleOutsidePointerDown(ev)

    this.mount()
    this.restoreSize()
    this.bindResize()

    this.luminodeMixerUI = new LuminodeMixerUI({
      container: this.panel.querySelector('#luminodeMixer'),
      trackManager: this.trackManager,
      onChange: () => this.onChange?.()
    })

    this.effectChainUI = new EffectChainUI({
      container: this.panel.querySelector('#effectChain'),
      effectLayerManager: this.effectLayerManager,
      trackManager: this.trackManager,
      onChange: () => this.onChange?.(),
      onToggleEffect: (data) => this.onToggleEffect?.(data)
    })
  }

  mount () {
    let panel = document.getElementById('mixer-panel')
    if (!panel) {
      panel = document.createElement('section')
      panel.id = 'mixer-panel'
      panel.innerHTML = `
        <div id="mixer-resize-handle" class="mixer-resize-handle" title="Resize mixer"></div>
        <div id="mixer-content" class="mixer-content">
          <div id="luminodeMixer" class="mixer-section mixer-section--luminodes">
            <div class="luminode-mixer-strips"></div>
          </div>
          <div id="effectChain" class="mixer-section mixer-section--effects">
            <div class="effect-chain-stage">
              <svg class="effect-chain-wires" aria-hidden="true"></svg>
              <div class="effect-chain-nodes"></div>
            </div>
          </div>
        </div>
      `
      document.body.appendChild(panel)
    } else {
      panel.querySelector('.mixer-panel-header')?.remove()
      panel.querySelectorAll('.mixer-section-label').forEach((el) => el.remove())
    }
    this.panel = panel
    document.documentElement.style.setProperty(
      '--mixer-height',
      `${DEFAULT_HEIGHT}px`
    )
  }

  bindResize () {
    const handle = this.panel.querySelector('#mixer-resize-handle')
    if (!handle) return

    handle.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return
      ev.preventDefault()
      handle.setPointerCapture(ev.pointerId)
      handle.classList.add('is-dragging')

      const startY = ev.clientY
      const startHeight = this.readHeight()
      const prevCursor = document.body.style.cursor
      const prevSelect = document.body.style.userSelect
      document.body.style.cursor = 'ns-resize'
      document.body.style.userSelect = 'none'

      const onMove = (moveEv) => {
        const delta = startY - moveEv.clientY
        const next = this.clampHeight(startHeight + delta)
        this.setHeight(next)
      }

      const onEnd = () => {
        handle.classList.remove('is-dragging')
        document.body.style.cursor = prevCursor
        document.body.style.userSelect = prevSelect
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onEnd)
        window.removeEventListener('pointercancel', onEnd)
        this.expandedHeight = this.readHeight()
        this.persistSize()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onEnd)
      window.addEventListener('pointercancel', onEnd)
    })
  }

  isOpen () {
    return this.panel?.style.display === 'flex'
  }

  handleOutsidePointerDown (ev) {
    if (!this.isOpen()) return
    if (ev.button != null && ev.button !== 0) return
    const target = ev.target
    if (!(target instanceof Element)) return
    if (this.panel.contains(target)) return
    if (target.closest('#mixerButton')) return
    this.onRequestClose?.()
  }

  bindOutsideClose () {
    if (this._outsideCloseBound) return
    document.addEventListener('pointerdown', this._onOutsidePointerDown, true)
    this._outsideCloseBound = true
  }

  unbindOutsideClose () {
    if (!this._outsideCloseBound) return
    document.removeEventListener(
      'pointerdown',
      this._onOutsidePointerDown,
      true
    )
    this._outsideCloseBound = false
  }

  show () {
    this.panel.style.display = 'flex'
    this.bindOutsideClose()
    this.effectChainUI?.render()
    this.effectChainUI?.redrawWires()
  }

  hide () {
    this.unbindOutsideClose()
    this.panel.style.display = 'none'
  }

  refresh () {
    this.luminodeMixerUI?.render()
    this.effectChainUI?.render()
  }

  readHeight () {
    const measured = this.panel.getBoundingClientRect().height
    if (measured > 0) return measured
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--mixer-height')
      .trim()
    return parseFloat(raw) || DEFAULT_HEIGHT
  }

  setHeight (px) {
    document.documentElement.style.setProperty(
      '--mixer-height',
      `${Math.round(px)}px`
    )
  }

  clampHeight (px) {
    const max = Math.max(
      MIN_HEIGHT + 80,
      window.innerHeight - MIN_VIEWER
    )
    return Math.min(max, Math.max(MIN_HEIGHT, px))
  }

  persistSize () {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ height: this.expandedHeight })
      )
    } catch {
      // ignore
    }
  }

  restoreSize () {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
      if (typeof saved.height === 'number') {
        this.expandedHeight = this.clampHeight(saved.height)
      }
      this.setHeight(this.clampHeight(this.expandedHeight))
    } catch {
      this.setHeight(DEFAULT_HEIGHT)
    }
  }
}
