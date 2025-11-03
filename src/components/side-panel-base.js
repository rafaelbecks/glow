// Base side panel functionality - core panel management, tabs, and callbacks
import { TabletControls } from './tablet-controls.js'

export class SidePanelBase {
  constructor (trackManager, tabletManager, uiManager = null, midiManager = null) {
    this.trackManager = trackManager
    this.tabletManager = tabletManager
    this.uiManager = uiManager
    this.midiManager = midiManager
    this.isVisible = false
    this.panel = null
    this.callbacks = {}
    this.activeTab = 'tracks' // Default to tracks tab

    // Initialize tablet controls component
    this.tabletControls = new TabletControls(tabletManager)

    this.initializePanel()
    this.setupEventListeners()
  }

  initializePanel () {
    // Create the side panel container
    this.panel = document.createElement('div')
    this.panel.id = 'sidePanel'
    this.panel.className = 'side-panel'

    // Create panel content with tabs
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
            <ion-icon name="color-filter-outline"></ion-icon>
            <span>TABLET</span>
          </button>
        </div>
        <button id="togglePanel" class="toggle-panel-btn">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>
      <div class="side-panel-content">
        <!-- Tracks Tab Content -->
        <div id="tracksTab" class="tab-content active">
          <div id="tracksContainer" class="tracks-container">
            <!-- Tracks will be dynamically generated -->
          </div>
        </div>
        
        <!-- Modulation Tab Content -->
        <div id="modulationTab" class="tab-content">
          <div id="modulationControlsContainer">
            <!-- Modulation controls will be dynamically generated -->
          </div>
        </div>
        
        <!-- Tablet Tab Content -->
        <div id="tabletTab" class="tab-content">
          <div id="tabletControlsContainer">
            <!-- Tablet controls will be dynamically generated -->
          </div>
        </div>
        
        <!-- Canvas Tab Content -->
        <div id="canvasTab" class="tab-content">
          <div id="canvasControlsContainer">
            <!-- Canvas and color controls will be dynamically generated -->
          </div>
        </div>
      </div>
    `

    // Add to DOM
    document.body.appendChild(this.panel)

    // Initially hidden
    this.hide()
  }

  setupEventListeners () {
    // Toggle panel visibility
    const toggleBtn = this.panel.querySelector('#togglePanel')
    toggleBtn.addEventListener('click', () => {
      this.toggle()
    })

    // Click outside to close panel
    document.addEventListener('click', (e) => {
      if (this.isVisible && !this.panel.contains(e.target) && !e.target.closest('.panel-toggle-btn')) {
        this.hide()
      }
    })

    // Prevent panel clicks from closing the panel
    this.panel.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    // Tab switching
    const tabBtns = this.panel.querySelectorAll('.tab-btn')
    tabBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tab = e.currentTarget.dataset.tab
        await this.switchTab(tab)
      })
    })

    // Track manager events
    this.trackManager.on('trackUpdated', (data) => {
      this.triggerCallback('trackUpdated', data)
    })

    this.trackManager.on('midiDeviceAdded', (data) => {
      console.log(`SidePanel: MIDI device added - ${data.device.name}`)
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

    // Setup tablet controls event listeners
    this.setupTabletControlsEventListeners()
  }

  // Callback system
  on (event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(callback)
  }

  triggerCallback (event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data))
    }
  }

  // Setup tablet controls event listeners
  setupTabletControlsEventListeners () {
    // Forward tablet control events to the main callback system
    this.tabletControls.on('connectTablet', (data) => {
      this.triggerCallback('connectTablet', data)
    })
    this.tabletControls.on('clearTablet', (data) => {
      this.triggerCallback('clearTablet', data)
    })
    this.tabletControls.on('tabletWidthChange', (data) => {
      this.triggerCallback('tabletWidthChange', data)
    })
    this.tabletControls.on('colorModeChange', (data) => {
      this.triggerCallback('colorModeChange', data)
    })
    this.tabletControls.on('geometricModeChange', (data) => {
      this.triggerCallback('geometricModeChange', data)
    })
    this.tabletControls.on('shapeDetectionThresholdChange', (data) => {
      this.triggerCallback('shapeDetectionThresholdChange', data)
    })

    // Geometric pencil mode events
    this.tabletControls.on('geometricPencilChange', (data) => {
      this.triggerCallback('geometricPencilChange', data)
    })

    this.tabletControls.on('polygonSidesChange', (data) => {
      this.triggerCallback('polygonSidesChange', data)
    })

    this.tabletControls.on('fadeDurationChange', (data) => {
      this.triggerCallback('fadeDurationChange', data)
    })

    // MIDI output events
    this.tabletControls.on('midiOutputChange', (data) => {
      this.triggerCallback('midiOutputChange', data)
    })

    this.tabletControls.on('midiOutputDeviceChange', (data) => {
      this.triggerCallback('midiOutputDeviceChange', data)
    })

    this.tabletControls.on('octaveRangeChange', (data) => {
      this.triggerCallback('octaveRangeChange', data)
    })
  }

  // Tab switching
  async switchTab (tabName) {
    // Update active tab button
    const tabBtns = this.panel.querySelectorAll('.tab-btn')
    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName)
    })

    // Update active tab content
    const tabContents = this.panel.querySelectorAll('.tab-content')
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}Tab`)
    })

    this.activeTab = tabName

    // Delegate to specific tab handlers
    this.triggerCallback('tabSwitched', { tab: tabName })
  }

  // Panel visibility
  show () {
    this.panel.classList.add('visible')
    this.isVisible = true
    this.triggerCallback('panelShown')
  }

  hide () {
    this.panel.classList.remove('visible')
    this.isVisible = false
    // Update UI state
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

  // Tablet-related methods (delegated to TabletControls component)
  async renderTabletControls () {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      tabletControlsContainer.innerHTML = this.tabletControls.createTabletControlsHTML()
      this.tabletControls.setupEventListeners(tabletControlsContainer)

      // Populate MIDI output devices when tablet controls are rendered
      await this.populateMidiOutputDevices()
    }
  }

  // Populate MIDI output devices
  async populateMidiOutputDevices () {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer && this.midiManager) {
      // Get output devices from MIDI manager
      const devices = await this.midiManager.getAvailableOutputDevices()
      this.tabletControls.updateMidiOutputDevices(devices, tabletControlsContainer)
    }
  }

  // Tablet update methods (delegated to TabletControls)
  updateTabletWidth (value) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updateTabletWidth(value, tabletControlsContainer)
    }
  }

  updateColorMode (enabled) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updateColorMode(enabled, tabletControlsContainer)
    }
  }

  updateGeometricMode (enabled) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updateGeometricMode(enabled, tabletControlsContainer)
    }
  }

  updateShapeDetectionThreshold (value) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updateShapeDetectionThreshold(value, tabletControlsContainer)
    }
  }

  updateGeometricPencil (enabled) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updateGeometricPencil(enabled, tabletControlsContainer)
    }
  }

  updatePolygonSides (sides) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updatePolygonSides(sides, tabletControlsContainer)
    }
  }

  updatePolygonSize (size) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updatePolygonSize(size, tabletControlsContainer)
    }
  }

  updateFadeDuration (duration) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updateFadeDuration(duration, tabletControlsContainer)
    }
  }

  updateMidiOutput (enabled) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updateMidiOutput(enabled, tabletControlsContainer)
    }
  }

  updateMidiOutputDevices (devices) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updateMidiOutputDevices(devices, tabletControlsContainer)
    }
  }

  updateMidiOutputDevice (deviceId) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updateMidiOutputDevice(deviceId, tabletControlsContainer)
    }
  }

  updateOctaveRange (range) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updateOctaveRange(range, tabletControlsContainer)
    }
  }

  // Public API
  isPanelVisible () {
    return this.isVisible
  }

  getPanel () {
    return this.panel
  }
}
