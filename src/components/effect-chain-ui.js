export class EffectChainUI {
  constructor ({
    container,
    effectLayerManager,
    trackManager,
    onChange,
    onToggleEffect
  } = {}) {
    this.container = container
    this.effectLayerManager = effectLayerManager
    this.trackManager = trackManager
    this.onChange = onChange
    this.onToggleEffect = onToggleEffect
    this.nodesEl = container?.querySelector('.effect-chain-nodes')
    this.wiresEl = container?.querySelector('.effect-chain-wires')
    this.dragId = null
    this.suppressRender = false
    this.dragMoved = false

    this.effectLayerManager?.on('orderChanged', () => this.render())
    this.effectLayerManager?.on('enabledChanged', () => this.render())
    this.trackManager?.on('modulationUpdated', () => this.render())
    this.render()

    window.addEventListener('resize', () => this.redrawWires())
  }

  getModulators () {
    return this.trackManager?.getModulators?.() || []
  }

  render () {
    if (this.suppressRender) return
    if (!this.nodesEl || !this.effectLayerManager) return
    const order = this.effectLayerManager.getOrder()
    const modulators = this.getModulators()
    this.nodesEl.innerHTML = ''

    order.forEach((id) => {
      this.nodesEl.appendChild(this.createNode(id, modulators))
    })

    requestAnimationFrame(() => this.redrawWires())
  }

  createNode (id, modulators) {
    const meta = this.effectLayerManager.getMeta(id)
    const enabled = this.effectLayerManager.isEnabled(id)
    const locked = this.effectLayerManager.isLocked(id)
    const canToggle = this.effectLayerManager.canToggle(id)
    const modulated = this.effectLayerManager.isModulated(id, modulators)

    const node = document.createElement('div')
    node.className = 'effect-node'
    node.dataset.layerId = id
    if (locked) node.classList.add('is-locked')
    if (!enabled) node.classList.add('is-disabled')
    if (modulated) node.classList.add('is-modulated')

    const statusBits = []
    if (locked) statusBits.push('anchor')
    else statusBits.push(enabled ? 'on' : 'off')

    node.innerHTML = `
      <span class="effect-node-port effect-node-port--in"></span>
      <div class="effect-node-body">
        <div class="effect-node-head">
          <div class="effect-node-title">${escapeHtml(meta.label || id)}</div>
          ${
            modulated
              ? '<ion-icon class="effect-node-mod-icon" name="analytics-outline" title="Modulated"></ion-icon>'
              : ''
          }
        </div>
        <div class="effect-node-status">${statusBits.join(' · ')}</div>
        ${
          canToggle
            ? `<button type="button" class="effect-node-toggle${enabled ? ' is-on' : ''}" data-action="toggle" title="${enabled ? 'Disable' : 'Enable'}">${enabled ? 'on' : 'off'}</button>`
            : ''
        }
      </div>
      <span class="effect-node-port effect-node-port--out"></span>
    `

    if (canToggle) {
      node.querySelector('[data-action="toggle"]')?.addEventListener('click', (ev) => {
        ev.preventDefault()
        ev.stopPropagation()
        const next = this.effectLayerManager.toggleEnabled(id)
        if (next == null) return
        this.onToggleEffect?.({
          id,
          setting: meta.enableKey,
          value: next
        })
        this.onChange?.()
      })
    }

    if (!locked) {
      this.bindNodeDrag(node, id)
    }

    return node
  }

  bindNodeDrag (node, id) {
    node.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return
      if (ev.target.closest('button, input, select, a, ion-icon')) return
      ev.preventDefault()
      this.dragId = id
      this.dragMoved = false
      this.suppressRender = true
      node.classList.add('is-dragging')
      node.setPointerCapture(ev.pointerId)

      const startX = ev.clientX
      const startY = ev.clientY

      const onMove = (moveEv) => {
        if (
          Math.abs(moveEv.clientX - startX) > 3 ||
          Math.abs(moveEv.clientY - startY) > 3
        ) {
          this.dragMoved = true
        }
        const el = document.elementFromPoint(moveEv.clientX, moveEv.clientY)
        const over = el?.closest?.('.effect-node')
        if (!over || over === node || !this.nodesEl) return
        const rect = over.getBoundingClientRect()
        const before = moveEv.clientX < rect.left + rect.width / 2
        if (before) {
          this.nodesEl.insertBefore(node, over)
        } else {
          this.nodesEl.insertBefore(node, over.nextSibling)
        }
        this.redrawWires()
      }

      const onEnd = () => {
        node.classList.remove('is-dragging')
        this.dragId = null
        const order = [...this.nodesEl.querySelectorAll('.effect-node')].map(
          (el) => el.dataset.layerId
        )
        this.suppressRender = false
        if (this.dragMoved) {
          this.effectLayerManager.setOrder(order)
          this.onChange?.()
        }
        this.dragMoved = false
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onEnd)
        window.removeEventListener('pointercancel', onEnd)
        this.redrawWires()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onEnd)
      window.addEventListener('pointercancel', onEnd)
    })
  }

  redrawWires () {
    if (!this.wiresEl || !this.nodesEl) return
    const stage = this.nodesEl.parentElement
    if (!stage) return

    const stageRect = stage.getBoundingClientRect()
    this.wiresEl.setAttribute('width', String(stageRect.width))
    this.wiresEl.setAttribute('height', String(stageRect.height))
    this.wiresEl.style.width = `${stageRect.width}px`
    this.wiresEl.style.height = `${stageRect.height}px`

    const nodes = [...this.nodesEl.querySelectorAll('.effect-node')]
    const paths = []
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i].querySelector('.effect-node-port--out')
      const b = nodes[i + 1].querySelector('.effect-node-port--in')
      if (!a || !b) continue
      const ar = a.getBoundingClientRect()
      const br = b.getBoundingClientRect()
      const x1 = ar.left + ar.width / 2 - stageRect.left
      const y1 = ar.top + ar.height / 2 - stageRect.top
      const x2 = br.left + br.width / 2 - stageRect.left
      const y2 = br.top + br.height / 2 - stageRect.top
      const cx = (x1 + x2) / 2
      paths.push(
        `<path class="effect-chain-wire" d="M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}" />`
      )
    }
    this.wiresEl.innerHTML = paths.join('')
  }
}

function escapeHtml (str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
