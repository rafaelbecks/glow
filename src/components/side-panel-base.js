// Base side panel functionality - core panel management, tabs, and callbacks

export class SidePanelBase {
  constructor (
    trackManager,
    tabletManager,
    uiManager = null,
    midiManager = null,
    options = {}
  ) {
    this.trackManager = trackManager
    this.tabletManager = tabletManager
    this.uiManager = uiManager
    this.midiManager = midiManager
    this.options = options
    this.isVisible = false
    this.panel = null
    this.callbacks = {}
    this.activeTab = this.options.detached ? 'controls' : 'tracks'

    this.initializePanel()
    this.setupEventListeners()
  }

  getPanelMarkup () {
    if (this.options.detached) {
      return `
      <div class="side-panel-header">
        <div class="panel-tabs">
          <button class="tab-btn active" data-tab="controls">
            <ion-icon name="options-outline"></ion-icon>
            <span>Controls</span>
          </button>
          <button class="tab-btn" data-tab="mixer">
            <ion-icon name="layers-outline"></ion-icon>
            <span>Mixer</span>
          </button>
        </div>
      </div>
      <div class="side-panel-content">
        <div id="controlsTab" class="tab-content active">
          <div class="detached-controls-stack">
            <section class="detached-section" data-section="tracks">
              <header class="detached-section-header">
                <h3 class="detached-section-title">Tracks</h3>
                <button type="button" class="detached-section-toggle" title="Hide Tracks" aria-label="Hide Tracks">
                  <ion-icon name="eye-outline"></ion-icon>
                </button>
              </header>
              <div id="tracksContainer" class="tracks-container"></div>
            </section>
            <section class="detached-section" data-section="modulation">
              <header class="detached-section-header">
                <h3 class="detached-section-title">Modulation</h3>
                <button type="button" class="detached-section-toggle" title="Hide Modulation" aria-label="Hide Modulation">
                  <ion-icon name="eye-outline"></ion-icon>
                </button>
              </header>
              <div id="modulationControlsContainer"></div>
            </section>
            <section class="detached-section" data-section="canvas">
              <header class="detached-section-header">
                <h3 class="detached-section-title">Canvas</h3>
                <button type="button" class="detached-section-toggle" title="Hide Canvas" aria-label="Hide Canvas">
                  <ion-icon name="eye-outline"></ion-icon>
                </button>
              </header>
              <div id="canvasControlsContainer"></div>
            </section>
            <section class="detached-section" data-section="external">
              <header class="detached-section-header">
                <h3 class="detached-section-title">External</h3>
                <button type="button" class="detached-section-toggle" title="Hide External" aria-label="Hide External">
                  <ion-icon name="eye-outline"></ion-icon>
                </button>
              </header>
              <div id="externalControlsContainer"></div>
            </section>
          </div>
        </div>
        <div id="mixerTab" class="tab-content">
          <div id="detachedMixerHost"></div>
        </div>
      </div>
    `
    }

    return `
      <div class="side-panel-header">
        <div class="panel-tabs">
          <button class="tab-btn active" data-tab="tracks">
            <ion-icon name="cube-outline"></ion-icon>
            <span>Tracks</span>
          </button>
          <button class="tab-btn" data-tab="modulation">
            <ion-icon name="pulse-outline"></ion-icon>
            <span>Modulation</span>
          </button>
          <button class="tab-btn" data-tab="canvas">
            <ion-icon name="color-palette-outline"></ion-icon>
            <span>Canvas</span>
          </button>
          <button class="tab-btn" data-tab="external" title="External Systems">
            <ion-icon name="hardware-chip-outline"></ion-icon>
            <span>External</span>
          </button>
        </div>
      </div>
      <div class="side-panel-content">
        <div id="tracksTab" class="tab-content active">
          <div id="tracksContainer" class="tracks-container"></div>
        </div>
        <div id="modulationTab" class="tab-content">
          <div id="modulationControlsContainer"></div>
        </div>
        <div id="canvasTab" class="tab-content">
          <div id="canvasControlsContainer"></div>
        </div>
        <div id="externalTab" class="tab-content">
          <div id="externalControlsContainer"></div>
        </div>
      </div>
    `
  }

  initializePanel () {
    this.panel = document.createElement('div')
    this.panel.id = 'sidePanel'
    this.panel.className = 'side-panel'
    this.panel.innerHTML = this.getPanelMarkup()

    document.body.appendChild(this.panel)

    if (this.options.detached) {
      this.panel.classList.add('detached')
    }

    this.hide()
  }

  setupEventListeners () {
    if (!this.options.detached) {
      document.addEventListener('click', (e) => {
        if (
          this.isVisible &&
          !this.panel.contains(e.target) &&
          !e.target.closest('.panel-toggle-btn') &&
          !e.target.closest(
            '.luminode-picker-dialog, .save-dialog, .file-picker-dialog, .create-set-dialog, .info-modal, .glow-confirm-dialog'
          )
        ) {
          this.hide()
        }
      })
    }

    this.panel.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    const tabBtns = this.panel.querySelectorAll('.tab-btn')
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const tab = e.currentTarget.dataset.tab
        await this.switchTab(tab)
      })
    })

    this.setupDetachedSectionToggles()

    this.trackManager.on('trackUpdated', (data) => {
      this.triggerCallback('trackUpdated', data)
    })

    this.trackManager.on('midiDeviceAdded', (data) => {
      this.triggerCallback('midiDeviceAdded', data)
    })

    this.trackManager.on('midiDeviceRemoved', (data) => {
      this.triggerCallback('midiDeviceRemoved', data)
    })

    this.trackManager.on('tracksReset', () => {
      this.triggerCallback('tracksReset')
    })

    this.trackManager.on('trajectoryUpdated', (data) => {
      this.triggerCallback('trajectoryUpdated', data)
    })

    this.trackManager.on('lineModulationUpdated', (data) => {
      this.triggerCallback('lineModulationUpdated', data)
    })
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

  setupDetachedSectionToggles () {
    if (!this.options.detached) return
    this.panel.querySelectorAll('.detached-section-toggle').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const section = btn.closest('.detached-section')
        if (section) this.toggleDetachedSection(section)
      })
    })
    this.syncDetachedSectionToggles()
  }

  toggleDetachedSection (section) {
    const collapsed = section.classList.contains('is-collapsed')
    if (!collapsed) {
      const visible = this.panel.querySelectorAll(
        '.detached-section:not(.is-collapsed)'
      )
      if (visible.length <= 1) return
      section.classList.add('is-collapsed')
    } else {
      section.classList.remove('is-collapsed')
    }
    this.syncDetachedSectionToggles()
  }

  syncDetachedSectionToggles () {
    const sections = [...this.panel.querySelectorAll('.detached-section')]
    const visibleCount = sections.filter(
      (section) => !section.classList.contains('is-collapsed')
    ).length

    sections.forEach((section) => {
      const collapsed = section.classList.contains('is-collapsed')
      const btn = section.querySelector('.detached-section-toggle')
      const icon = btn?.querySelector('ion-icon')
      const raw = section.dataset.section || 'section'
      const label = raw.charAt(0).toUpperCase() + raw.slice(1)
      if (icon) {
        icon.setAttribute('name', collapsed ? 'eye-off-outline' : 'eye-outline')
      }
      if (btn) {
        const title = collapsed ? `Show ${label}` : `Hide ${label}`
        btn.title = title
        btn.setAttribute('aria-label', title)
        btn.disabled = !collapsed && visibleCount <= 1
      }
    })
  }

  async switchTab (tabName) {
    const tabBtns = this.panel.querySelectorAll('.tab-btn')
    tabBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === tabName)
    })

    const tabContents = this.panel.querySelectorAll('.tab-content')
    tabContents.forEach((content) => {
      content.classList.toggle('active', content.id === `${tabName}Tab`)
    })

    this.activeTab = tabName
    this.triggerCallback('tabSwitched', { tab: tabName })
  }

  show () {
    this.panel.classList.add('visible')
    this.isVisible = true
    this.triggerCallback('panelShown')
  }

  hide () {
    this.panel.classList.remove('visible')
    this.isVisible = false
    if (this.uiManager) {
      this.uiManager.setPanelToggleActive(false)
    }
    this.triggerCallback('panelHidden')
  }

  toggle () {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  isPanelVisible () {
    return this.isVisible
  }

  getPanel () {
    return this.panel
  }
}
