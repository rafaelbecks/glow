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
    this.activeTab = 'tracks'

    this.initializePanel()
    this.setupEventListeners()
  }

  initializePanel () {
    this.panel = document.createElement('div')
    this.panel.id = 'sidePanel'
    this.panel.className = 'side-panel'

    this.panel.innerHTML = `
      <div class="side-panel-header">
        <div class="panel-tabs">
          <button class="tab-btn active" data-tab="tracks">
            <ion-icon name="cube-outline"></ion-icon>
            <span>TRACKS</span>
          </button>
          <button class="tab-btn" data-tab="modulation">
            <ion-icon name="pulse-outline"></ion-icon>
            <span>MODULATION</span>
          </button>
          <button class="tab-btn" data-tab="canvas">
            <ion-icon name="color-palette-outline"></ion-icon>
            <span>CANVAS</span>
          </button>
          <button class="tab-btn" data-tab="tablet">
            <ion-icon name="pencil-outline"></ion-icon>
            <span>TABLET</span>
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
        <div id="tabletTab" class="tab-content">
          <div id="tabletControlsContainer"></div>
        </div>
      </div>
    `

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
          !e.target.closest('.panel-toggle-btn')
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
