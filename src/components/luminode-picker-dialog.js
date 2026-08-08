import { CanvasDrawer } from '../canvas-drawer.js'
import { getLuminodesByGroup } from '../luminode-configs.js'
import {
  LUMINODE_REGISTRY,
  getLuminodeClass,
  getLuminodeDisplayName,
  getLuminodeSettingsKey
} from '../luminodes/index.js'
import { SETTINGS } from '../settings.js'
import { isUserLuminodeId } from '../luminode-center/model.js'
import { deleteUserLuminode } from '../luminode-center/storage.js'
import { unregisterUserLuminode } from '../luminode-center/registry.js'
import { getConfirmDialog } from './confirm-dialog.js'

const PREVIEW_SIZE = 140
const DEFAULT_PREVIEW = {
  virtualSize: 440,
  scale: PREVIEW_SIZE / 440,
  strokeBoost: 2.4
}

// These luminodes size geometry from canvas width/height; a 140px canvas
// collapses them into sparse or oversized shapes. Draw at a virtual size instead.
const PREVIEW_BY_LUMINODE = {
  noiseValley: { virtualSize: 720, scale: PREVIEW_SIZE / 720, strokeBoost: 1.6 },
  syncHelix2D: { virtualSize: 900, scale: PREVIEW_SIZE / 900, strokeBoost: 1.4 }
}

const SAMPLE_NOTES = [
  { midi: 60, velocity: 0.75 },
  { midi: 64, velocity: 0.65 },
  { midi: 67, velocity: 0.55 }
]

const GROUP_ORDER = [
  'Classic Patterns',
  '3D Geometry',
  'Art-Inspired',
  'Natural Patterns'
]

export class LuminodePickerDialog {
  constructor () {
    this.dialog = document.getElementById('luminodePickerDialog')
    this.body = this.dialog
      ? this.dialog.querySelector('#luminodePickerBody')
      : null
    this.callbacks = {}
    this.isVisible = false
    this.trackId = null
    this.selectedLuminode = null
    this.previews = new Map()
    this.hoverKey = null
    this.rafId = null
    this.startTime = 0
    this.collapsedGroups = new Set()
  }

  on (event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(callback)
  }

  triggerCallback (event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach((callback) => callback(data))
    }
  }

  setupEventListeners () {
    if (!this.dialog) return

    const closeBtn = this.dialog.querySelector('#luminodePickerClose')
    const cancelBtn = this.dialog.querySelector('#luminodePickerCancel')
    const centerBtn = this.dialog.querySelector('#luminodePickerOpenCenter')

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide())
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.hide())
    }
    if (centerBtn) {
      centerBtn.addEventListener('click', () => {
        this.triggerCallback('openLuminodeLab', {
          trackId: this.trackId,
          luminode: null
        })
        this.hide()
      })
    }

    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) this.hide()
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) this.hide()
    })
  }

  getPreviewConfig (key) {
    return PREVIEW_BY_LUMINODE[key] || DEFAULT_PREVIEW
  }

  show (trackId, currentLuminode = null) {
    if (!this.dialog) return

    this.trackId = trackId
    this.selectedLuminode = currentLuminode || null
    this.renderGrid()
    this.dialog.classList.add('show')
    this.isVisible = true
    this.startTime = performance.now()
    this.startAnimationLoop()

    const keys = [...this.previews.keys()]
    let i = 0
    const paintChunk = () => {
      if (!this.isVisible) return
      const end = Math.min(i + 4, keys.length)
      for (; i < end; i++) {
        this.drawPreview(keys[i], 0.8, false)
      }
      if (i < keys.length) {
        requestAnimationFrame(paintChunk)
      }
    }
    requestAnimationFrame(paintChunk)
  }

  hide () {
    if (!this.isVisible) return

    this.stopAnimationLoop()
    this.disposePreviews()
    this.dialog.classList.remove('show')
    this.isVisible = false
    this.trackId = null
    this.hoverKey = null
  }

  renderGrid () {
    if (!this.body) return

    this.disposePreviews()
    this.body.innerHTML = ''

    const grouped = getLuminodesByGroup()
    const groups = [
      ...GROUP_ORDER.filter((g) => grouped[g]),
      ...Object.keys(grouped).filter((g) => !GROUP_ORDER.includes(g))
    ]

    groups.forEach((groupName) => {
      const section = document.createElement('section')
      section.className = 'luminode-picker-category'
      section.dataset.group = groupName

      const isCollapsed = this.collapsedGroups.has(groupName)
      if (isCollapsed) section.classList.add('collapsed')

      const heading = document.createElement('button')
      heading.type = 'button'
      heading.className = 'luminode-picker-category-title'
      heading.setAttribute('aria-expanded', String(!isCollapsed))
      heading.innerHTML = `
        <span class="luminode-picker-category-chevron" aria-hidden="true"></span>
        <span class="luminode-picker-category-label">${groupName}</span>
      `
      heading.addEventListener('click', () => {
        this.toggleCategory(section, groupName, heading)
      })
      section.appendChild(heading)

      const grid = document.createElement('div')
      grid.className = 'luminode-picker-grid'

      grouped[groupName].forEach((key) => {
        if (!LUMINODE_REGISTRY[key]) return
        grid.appendChild(this.createCard(key))
      })

      section.appendChild(grid)
      this.body.appendChild(section)
    })
  }

  toggleCategory (section, groupName, heading) {
    const collapsed = section.classList.toggle('collapsed')
    heading.setAttribute('aria-expanded', String(!collapsed))
    if (collapsed) {
      this.collapsedGroups.add(groupName)
    } else {
      this.collapsedGroups.delete(groupName)
      // Paint any thumbs that were skipped while collapsed
      section.querySelectorAll('.luminode-picker-card').forEach((card) => {
        const key = card.dataset.luminode
        if (key) this.drawPreview(key, 0.8, false)
      })
    }
  }

  createCard (key) {
    const displayName = getLuminodeDisplayName(key)
    const card = document.createElement('div')
    card.className = 'luminode-picker-card'
    card.dataset.luminode = key
    card.setAttribute('role', 'button')
    card.tabIndex = 0
    if (key === this.selectedLuminode) {
      card.classList.add('selected')
    }

    const thumb = document.createElement('div')
    thumb.className = 'luminode-picker-thumb'

    const canvas = document.createElement('canvas')
    canvas.width = PREVIEW_SIZE
    canvas.height = PREVIEW_SIZE
    canvas.className = 'luminode-picker-canvas'
    thumb.appendChild(canvas)

    const nameRow = document.createElement('div')
    nameRow.className = 'luminode-picker-card-name'

    const label = document.createElement('span')
    label.className = 'luminode-picker-card-label'
    label.textContent = displayName
    nameRow.appendChild(label)

    if (isUserLuminodeId(key)) {
      const delBtn = document.createElement('button')
      delBtn.type = 'button'
      delBtn.className = 'luminode-picker-card-delete'
      delBtn.title = 'Delete luminode'
      delBtn.setAttribute('aria-label', `Delete ${displayName}`)
      delBtn.innerHTML = '<ion-icon name="trash-outline"></ion-icon>'
      delBtn.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        this.requestDeleteUserLuminode(key, displayName)
      })
      nameRow.appendChild(delBtn)
    }

    card.appendChild(thumb)
    card.appendChild(nameRow)

    card.addEventListener('mouseenter', () => {
      this.ensurePreview(key, canvas)
      this.hoverKey = key
    })
    card.addEventListener('mouseleave', () => {
      if (this.hoverKey === key) this.hoverKey = null
      this.drawPreview(key, (performance.now() - this.startTime) / 1000, false)
    })
    card.addEventListener('click', () => {
      this.selectLuminode(key)
    })
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        this.selectLuminode(key)
      }
    })

    this.previews.set(key, { canvas, drawer: null, instance: null })
    return card
  }

  async requestDeleteUserLuminode (key, displayName) {
    const ok = await getConfirmDialog().confirm({
      title: 'Delete luminode',
      message: `Delete user luminode “${displayName}”? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      danger: true
    })
    if (!ok) return

    deleteUserLuminode(key)
    unregisterUserLuminode(key, this.deleteHooks || {})
    this.triggerCallback('userLuminodeDeleted', { luminode: key })

    if (this.selectedLuminode === key) {
      this.selectedLuminode = null
    }
    if (this.hoverKey === key) this.hoverKey = null
    this.renderGrid()

    const keys = [...this.previews.keys()]
    let i = 0
    const paintChunk = () => {
      if (!this.isVisible) return
      const end = Math.min(i + 4, keys.length)
      for (; i < end; i++) {
        this.drawPreview(keys[i], 0.8, false)
      }
      if (i < keys.length) requestAnimationFrame(paintChunk)
    }
    requestAnimationFrame(paintChunk)
  }

  setDeleteHooks (hooks) {
    this.deleteHooks = hooks || {}
  }

  ensurePreview (key, canvas) {
    const preview = this.previews.get(key)
    if (!preview || preview.instance) return preview

    try {
      const targetCanvas = canvas || preview.canvas
      const { virtualSize } = this.getPreviewConfig(key)
      const drawer = new CanvasDrawer(targetCanvas)
      // Luminodes read dimensions from the drawer, not the bitmap size
      drawer.width = virtualSize
      drawer.height = virtualSize
      const LuminodeClass = getLuminodeClass(key)
      if (!LuminodeClass) return null

      preview.drawer = drawer
      preview.instance = new LuminodeClass(drawer)
      return preview
    } catch (err) {
      console.warn(`Preview init failed for ${key}:`, err)
      return null
    }
  }

  drawPreview (key, t, animate) {
    this.ensurePreview(key)
    const preview = this.previews.get(key)
    if (!preview?.instance) return

    const { drawer, instance } = preview
    const ctx = drawer.getContext()
    const { virtualSize, scale, strokeBoost } = this.getPreviewConfig(key)

    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)

    ctx.save()
    ctx.translate(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2)
    ctx.scale(scale, scale)
    ctx.translate(-virtualSize / 2, -virtualSize / 2)

    const stroke = ctx.stroke.bind(ctx)
    ctx.stroke = function thickerStroke () {
      const prev = this.lineWidth
      this.lineWidth = Math.max(prev * strokeBoost, 2.5)
      stroke()
      this.lineWidth = prev
    }

    try {
      this.drawLuminode(instance, key, t, animate)
    } catch (_) {}

    ctx.stroke = stroke
    ctx.restore()

    const fade = ctx.createRadialGradient(
      PREVIEW_SIZE / 2,
      PREVIEW_SIZE / 2,
      PREVIEW_SIZE * 0.35,
      PREVIEW_SIZE / 2,
      PREVIEW_SIZE / 2,
      PREVIEW_SIZE * 0.55
    )
    fade.addColorStop(0, 'rgba(0,0,0,0)')
    fade.addColorStop(1, 'rgba(0,0,0,0.55)')
    ctx.fillStyle = fade
    ctx.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)
  }

  drawLuminode (instance, key, t, animate) {
    const time = animate ? t : 0.8
    const layout = { x: 0, y: 0, rotation: 0 }
    const notes = SAMPLE_NOTES

    switch (key) {
      case 'sotoGrid':
        instance.draw(time, notes, false, layout)
        break
      case 'sotoGridRotated':
        instance.draw(time, notes, true, layout)
        break
      case 'lissajous':
        instance.draw(
          time,
          notes.map((n) => n.midi),
          layout
        )
        break
      case 'triangle':
        instance.draw(time, notes, 'triangle', 1, 300, layout)
        break
      default: {
        const settingsKey = getLuminodeSettingsKey(key)
        const moduleSettings = settingsKey
          ? SETTINGS.MODULES[settingsKey]
          : null

        if (moduleSettings?.hasOwnProperty('USE_COLOR')) {
          instance.draw(time, notes, true, layout)
        } else if (moduleSettings?.hasOwnProperty('COLOR_MODE')) {
          const colorMode =
            typeof moduleSettings.COLOR_MODE === 'number'
              ? moduleSettings.COLOR_MODE
              : parseInt(moduleSettings.COLOR_MODE, 10) || 0
          instance.draw(time, notes, colorMode, layout)
        } else {
          instance.draw(time, notes, layout)
        }
        break
      }
    }
  }

  startAnimationLoop () {
    this.stopAnimationLoop()
    const tick = (now) => {
      if (!this.isVisible) return
      const t = (now - this.startTime) / 1000
      if (this.hoverKey) {
        this.drawPreview(this.hoverKey, t, true)
      }
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  stopAnimationLoop () {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  disposePreviews () {
    this.previews.forEach((preview) => {
      try {
        if (preview.instance?.gl) {
          const gl = preview.instance.gl
          const ext = gl.getExtension('WEBGL_lose_context')
          if (ext) ext.loseContext()
        }
      } catch (_) {}
    })
    this.previews.clear()
  }

  selectLuminode (key) {
    this.triggerCallback('luminodeSelected', {
      trackId: this.trackId,
      luminode: key
    })
    this.hide()
  }
}
