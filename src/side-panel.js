// Unified side panel UI component with tabs for track management and tablet configuration
import { getLuminodeConfig, hasLuminodeConfig } from './luminode-configs.js'
import { TabletControls } from './tablet-controls.js'
import { UTILS } from './settings.js'

export class SidePanel {
  constructor (trackManager, tabletManager, uiManager = null, midiManager = null) {
    this.trackManager = trackManager
    this.tabletManager = tabletManager
    this.uiManager = uiManager
    this.midiManager = midiManager
    this.isVisible = false
    this.panel = null
    this.callbacks = {}
    this.settings = null
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
      this.updateTrackUI(data.trackId, data.track)
    })

    this.trackManager.on('midiDeviceAdded', (data) => {
      console.log(`SidePanel: MIDI device added - ${data.device.name}`)
      this.updateMidiDeviceDropdowns()
    })

    this.trackManager.on('midiDeviceRemoved', (data) => {
      this.updateMidiDeviceDropdowns()
    })

    this.trackManager.on('tracksReset', () => {
      this.renderTracks()
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

    // If switching to tracks tab, render tracks
    if (tabName === 'tracks') {
      this.renderTracks()
    } else if (tabName === 'tablet') {
      await this.renderTabletControls()
    } else if (tabName === 'canvas') {
      this.renderCanvasControls()
    }
  }

  // Panel visibility
  show () {
    this.panel.classList.add('visible')
    this.isVisible = true
    this.renderTracks()
  }

  hide () {
    this.panel.classList.remove('visible')
    this.isVisible = false
    // Update UI state
    if (this.uiManager) {
      this.uiManager.setPanelToggleActive(false)
    }
  }

  toggle () {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  // Render all tracks
  renderTracks () {
    const tracksContainer = this.panel.querySelector('#tracksContainer')
    const tracks = this.trackManager.getTracks()

    tracksContainer.innerHTML = tracks.map(track => this.createTrackHTML(track)).join('')

    // Add event listeners to track elements
    this.attachTrackEventListeners()

    // Initialize configuration sections for existing tracks
    tracks.forEach(track => {
      if (track.luminode && hasLuminodeConfig(track.luminode)) {
        this.updateLuminodeConfig(track.id, track.luminode)
      }
    })
  }

  // Render tablet controls
  async renderTabletControls () {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      tabletControlsContainer.innerHTML = this.tabletControls.createTabletControlsHTML()
      this.tabletControls.setupEventListeners(tabletControlsContainer)
      
      // Populate MIDI output devices when tablet controls are rendered
      await this.populateMidiOutputDevices()
    }
  }

  // Render canvas and color controls
  renderCanvasControls () {
    const canvasControlsContainer = this.panel.querySelector('#canvasControlsContainer')
    if (canvasControlsContainer) {
      canvasControlsContainer.innerHTML = this.createCanvasControlsHTML()
      this.setupCanvasControlsEventListeners(canvasControlsContainer)
    }
  }

  createTrackHTML (track) {
    const midiDevices = this.trackManager.getAvailableMidiDevices()
    const luminodes = this.trackManager.getAvailableLuminodes()

    return `
      <div class="track-tile" data-track-id="${track.id}">
        <div class="track-header">
          <div class="track-info">
            <div class="track-number" style="background-color: ${this.getTrackColor(track.id)}">${track.id}</div>
            <div class="track-activity-indicator" id="activity-${track.id}"></div>
          </div>
          <div class="track-controls">
            <button class="mute-btn ${track.muted ? 'active' : ''}" data-action="mute" title="Mute">
              M
            </button>
            <button class="solo-btn ${track.solo ? 'active' : ''}" data-action="solo" title="Solo">
              S
            </button>
          </div>
        </div>
        
        <div class="track-assignments">
          <div class="assignment-row">
            <div class="assignment-group">
              <label>
                <ion-icon name="grid-outline"></ion-icon>
                MIDI Device
              </label>
              <select class="midi-device-select" data-track-id="${track.id}">
                <option value="">Select Device</option>
                ${midiDevices.map(device =>
                  `<option value="${device.id}" ${track.midiDevice === device.id ? 'selected' : ''}>
                    ${device.name}
                  </option>`
                ).join('')}
              </select>
            </div>
            
            <div class="assignment-group">
              <label>
                <svg class="luminode-icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <style>.cls-1{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:20px;}</style>
                  </defs>
                  <g data-name="Layer 2" id="Layer_2">
                    <g data-name="E449, Sine, sound, wave" id="E449_Sine_sound_wave">
                      <circle class="cls-1" cx="256" cy="256" r="246"></circle>
                      <line class="cls-1" x1="70.24" x2="441.76" y1="235.92" y2="235.92"></line>
                      <path class="cls-1" d="M100.37,150.57c77.81,0,77.81,210.86,155.63,210.86s77.82-210.86,155.63-210.86"></path>
                    </g>
                  </g>
                </svg>
                Luminode
              </label>
              <select class="luminode-select" data-track-id="${track.id}">
                <option value="">Select Luminode</option>
                ${luminodes.map(luminode =>
                  `<option value="${luminode}" ${track.luminode === luminode ? 'selected' : ''}>
                    ${this.normalizeLuminodeName(luminode)}
                  </option>`
                ).join('')}
              </select>
            </div>
          </div>
          
          ${track.luminode !== 'triangle' ? `
          <div class="assignment-row">
            <div class="assignment-group layout-controls">
              <label>
                <svg class="layout-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <style>.cls-1{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px;}</style>
                  </defs>
                  <g data-name="Layer 2" id="Layer_2">
                    <g data-name="E449, Sine, sound, wave" id="E449_Sine_sound_wave">
                      <rect class="cls-1" x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle class="cls-1" cx="9" cy="9" r="2"></circle>
                      <circle class="cls-1" cx="15" cy="15" r="2"></circle>
                      <line class="cls-1" x1="9" y1="9" x2="15" y2="15"></line>
                    </g>
                  </g>
                </svg>
                Layout
              </label>
              <div class="layout-controls-grid">
                <div class="layout-control-row">
                  <div class="layout-control">
                    <span class="layout-label">X</span>
                    <div class="slider-container">
                      <input type="range" 
                             class="layout-slider" 
                             data-track-id="${track.id}" 
                             data-axis="x"
                             min="-500" 
                             max="500" 
                             step="10" 
                             value="${track.layout.x}">
                      <span class="slider-value">${track.layout.x}</span>
                    </div>
                  </div>
                  <div class="layout-control">
                    <span class="layout-label">Y</span>
                    <div class="slider-container">
                      <input type="range" 
                             class="layout-slider" 
                             data-track-id="${track.id}" 
                             data-axis="y"
                             min="-500" 
                             max="500" 
                             step="10" 
                             value="${track.layout.y}">
                      <span class="slider-value">${track.layout.y}</span>
                    </div>
                  </div>
                </div>
                <div class="layout-control-row">
                  <div class="layout-control">
                    <span class="layout-label">R</span>
                    <div class="slider-container">
                      <input type="range" 
                             class="layout-slider" 
                             data-track-id="${track.id}" 
                             data-axis="rotation"
                             min="-180" 
                             max="180" 
                             step="5" 
                             value="${track.layout.rotation}">
                      <span class="slider-value">${track.layout.rotation}°</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          ` : ''}
        </div>
        
        <!-- Luminode Configuration Section -->
        <div class="luminode-config" id="config-${track.id}" style="display: none;">
          ${this.createLuminodeConfigHTML(track.luminode, track.id, this.settings || null)}
        </div>
      </div>
    `
  }

  attachTrackEventListeners () {
    const trackTiles = this.panel.querySelectorAll('.track-tile')

    trackTiles.forEach(tile => {
      const trackId = parseInt(tile.dataset.trackId)

      // Mute/Solo buttons
      const muteBtn = tile.querySelector('.mute-btn')
      const soloBtn = tile.querySelector('.solo-btn')

      muteBtn.addEventListener('click', () => {
        this.trackManager.toggleMute(trackId)
      })

      soloBtn.addEventListener('click', () => {
        this.trackManager.toggleSolo(trackId)
      })

      // MIDI device selection
      const midiSelect = tile.querySelector('.midi-device-select')
      midiSelect.addEventListener('change', (e) => {
        this.trackManager.setMidiDevice(trackId, e.target.value || null)
      })

      // Luminode selection
      const luminodeSelect = tile.querySelector('.luminode-select')
      luminodeSelect.addEventListener('change', (e) => {
        this.trackManager.setLuminode(trackId, e.target.value || null)
        this.updateLuminodeConfig(trackId, e.target.value)
        // Re-render the track to show/hide layout controls based on luminode
        this.renderTracks()
      })

      // Layout controls
      const layoutSliders = tile.querySelectorAll('.layout-slider')
      layoutSliders.forEach(slider => {
        slider.addEventListener('input', (e) => {
          const axis = e.target.dataset.axis
          const value = parseFloat(e.target.value)
          const valueDisplay = e.target.parentElement.querySelector('.slider-value')
          
          if (valueDisplay) {
            valueDisplay.textContent = axis === 'rotation' ? `${value}°` : value
          }
          
          this.trackManager.setLayout(trackId, { [axis]: value })
        })
      })

      // Configuration controls
      this.attachConfigEventListeners(trackId)
    })
  }

  updateTrackUI (trackId, track) {
    const trackTile = this.panel.querySelector(`[data-track-id="${trackId}"]`)
    if (!trackTile) return

    // Update mute/solo button states
    const muteBtn = trackTile.querySelector('.mute-btn')
    const soloBtn = trackTile.querySelector('.solo-btn')

    muteBtn.classList.toggle('active', track.muted)
    soloBtn.classList.toggle('active', track.solo)

    // Update dropdown selections
    const midiSelect = trackTile.querySelector('.midi-device-select')
    const luminodeSelect = trackTile.querySelector('.luminode-select')

    midiSelect.value = track.midiDevice || ''
    luminodeSelect.value = track.luminode || ''

    // Update layout controls (only if they exist - not for triangle luminode)
    const layoutSliders = trackTile.querySelectorAll('.layout-slider')
    layoutSliders.forEach(slider => {
      const axis = slider.dataset.axis
      const value = track.layout[axis] || 0
      slider.value = value
      const valueDisplay = slider.parentElement.querySelector('.slider-value')
      if (valueDisplay) {
        valueDisplay.textContent = axis === 'rotation' ? `${value}°` : value
      }
    })

    // Update luminode configuration
    this.updateLuminodeConfig(trackId, track.luminode)
  }

  // Update luminode configuration section
  updateLuminodeConfig (trackId, luminode) {
    const configElement = this.panel.querySelector(`#config-${trackId}`)
    if (!configElement) return

    if (luminode && hasLuminodeConfig(luminode)) {
      configElement.innerHTML = this.createLuminodeConfigHTML(luminode, trackId, this.settings || null)
      configElement.style.display = 'block'
      this.attachConfigEventListeners(trackId)
      this.attachConfigToggleListener(trackId)
    } else {
      configElement.style.display = 'none'
    }
  }

  // Attach event listeners to configuration controls
  attachConfigEventListeners (trackId) {
    const configElement = this.panel.querySelector(`#config-${trackId}`)
    if (!configElement) return

    // Slider controls
    const sliders = configElement.querySelectorAll('.config-slider')
    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        const param = e.target.dataset.param
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')
        
        if (valueDisplay) {
          valueDisplay.textContent = value
        }
        
        this.triggerCallback('luminodeConfigChange', {
          trackId,
          luminode: this.trackManager.getTrack(trackId).luminode,
          param,
          value
        })
      })
    })

    // Number controls
    const numberInputs = configElement.querySelectorAll('.config-number')
    numberInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        const param = e.target.dataset.param
        
        this.triggerCallback('luminodeConfigChange', {
          trackId,
          luminode: this.trackManager.getTrack(trackId).luminode,
          param,
          value
        })
      })
    })

    // Checkbox controls
    const checkboxInputs = configElement.querySelectorAll('.config-checkbox')
    checkboxInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const value = e.target.checked
        const param = e.target.dataset.param
        
        this.triggerCallback('luminodeConfigChange', {
          trackId,
          luminode: this.trackManager.getTrack(trackId).luminode,
          param,
          value
        })
      })
    })
  }

  // Attach config toggle listener
  attachConfigToggleListener (trackId) {
    const configHeader = this.panel.querySelector(`.config-header[data-track-id="${trackId}"]`)
    if (configHeader) {
      configHeader.addEventListener('click', () => {
        this.toggleConfigControls(trackId)
      })
    }
  }

  // Toggle configuration controls visibility
  toggleConfigControls (trackId) {
    const controlsElement = this.panel.querySelector(`#config-controls-${trackId}`)
    
    if (controlsElement) {
      const isVisible = controlsElement.style.display !== 'none'
      
      if (isVisible) {
        controlsElement.style.display = 'none'
      } else {
        controlsElement.style.display = 'block'
      }
    }
  }

  updateMidiDeviceDropdowns () {
    const tracks = this.trackManager.getTracks()
    const midiDevices = this.trackManager.getAvailableMidiDevices()

    console.log(`SidePanel: Updating dropdowns with ${midiDevices.length} devices:`, midiDevices.map(d => d.name))

    tracks.forEach(track => {
      const trackTile = this.panel.querySelector(`[data-track-id="${track.id}"]`)
      if (!trackTile) return

      const midiSelect = trackTile.querySelector('.midi-device-select')
      const currentValue = midiSelect.value

      // Update options
      midiSelect.innerHTML = `
        <option value="">Select Device</option>
        ${midiDevices.map(device =>
          `<option value="${device.id}">${device.name}</option>`
        ).join('')}
      `

      // Restore selection if still valid
      if (currentValue && midiDevices.find(d => d.id === currentValue)) {
        midiSelect.value = currentValue
      } else {
        midiSelect.value = ''
        this.trackManager.setMidiDevice(track.id, null)
      }
    })
  }

  // Update activity indicators
  updateActivityIndicators (activeNotes) {
    const tracks = this.trackManager.getTracks()

    tracks.forEach(track => {
      const indicator = this.panel.querySelector(`#activity-${track.id}`)
      if (indicator) {
        const hasActivity = track.luminode && activeNotes[track.luminode] && activeNotes[track.luminode].length > 0
        indicator.classList.toggle('active', hasActivity)
      }
    })
  }

  // Get track color from Soto palette
  getTrackColor (trackId) {
    const colors = [
      '#EF4136', // Red-orange
      '#005BBB', // Blue
      '#fca309', // Orange
      '#2E7D32' // Green
    ]
    return colors[(trackId - 1) % colors.length]
  }

  // Create luminode configuration HTML
  createLuminodeConfigHTML (luminode, trackId, settings = null) {
    if (!luminode || !hasLuminodeConfig(luminode)) {
      return ''
    }

    // Get configuration parameters for this luminode
    const configParams = getLuminodeConfig(luminode)
    
    // Get current values from settings or use defaults
    let currentValues = {}
    if (settings) {
      const settingsModule = settings.MODULES || settings
      const luminodeKey = this.getLuminodeSettingsKey(luminode)
      if (settingsModule[luminodeKey]) {
        currentValues = settingsModule[luminodeKey]
      }
    }
    
    // Create config objects with current values or defaults
    const config = configParams.map(param => ({
      ...param,
      value: currentValues[param.key] !== undefined ? currentValues[param.key] : param.default
    }))
    
    // Group controls into rows of 2
    const controlRows = []
    for (let i = 0; i < config.length; i += 2) {
      const rowControls = config.slice(i, i + 2)
      controlRows.push(rowControls)
    }

    return `
      <div class="config-header" data-track-id="${trackId}">
        <label>
          <svg class="config-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <style>.cls-1{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px;}</style>
            </defs>
            <g data-name="Layer 2" id="Layer_2">
              <g data-name="E449, Sine, sound, wave" id="E449_Sine_sound_wave">
                <circle class="cls-1" cx="12" cy="12" r="3"></circle>
                <path class="cls-1" d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-4.5L16 8l-2.5 2.5M8 16l-2.5 2.5L3 16m4.5-4.5L8 8l2.5-2.5"></path>
              </g>
            </g>
          </svg>
          ${this.normalizeLuminodeName(luminode)} Config
        </label>
      </div>
      <div class="config-controls" id="config-controls-${trackId}" style="display: block;">
        ${controlRows.map(rowControls => `
          <div class="config-control-row">
            ${rowControls.map(param => this.createConfigControl(param, trackId)).join('')}
            ${rowControls.length === 1 ? '<div class="config-control-spacer"></div>' : ''}
          </div>
        `).join('')}
      </div>
    `
  }

  // Create individual configuration control
  createConfigControl (param, trackId) {
    const controlId = `config-${trackId}-${param.key.toLowerCase()}`
    
    if (param.type === 'slider') {
      return `
        <div class="config-control">
          <label for="${controlId}">${param.label}</label>
          <div class="slider-container">
            <input type="range" 
                   id="${controlId}" 
                   min="${param.min}" 
                   max="${param.max}" 
                   step="${param.step}" 
                   value="${param.value}"
                   data-track-id="${trackId}"
                   data-param="${param.key}"
                   class="config-slider">
            <span class="slider-value">${param.value}</span>
          </div>
        </div>
      `
    } else if (param.type === 'number') {
      return `
        <div class="config-control">
          <label for="${controlId}">${param.label}</label>
          <input type="number" 
                 id="${controlId}" 
                 min="${param.min}" 
                 max="${param.max}" 
                 step="${param.step}" 
                 value="${param.value}"
                 data-track-id="${trackId}"
                 data-param="${param.key}"
                 class="config-number">
        </div>
      `
    } else if (param.type === 'checkbox') {
      return `
        <div class="config-control">
          <label class="checkbox-container">
            <input type="checkbox" 
                   id="${controlId}" 
                   ${param.value ? 'checked' : ''}
                   data-track-id="${trackId}"
                   data-param="${param.key}"
                   class="config-checkbox">
            <span class="checkmark"></span>
            ${param.label}
          </label>
        </div>
      `
    }
    
    return ''
  }

  // Normalize luminode names for display
  normalizeLuminodeName (name) {
    const nameMap = {
      lissajous: 'Lissajous',
      harmonograph: 'Harmonograph',
      sphere: 'Sphere',
      gegoNet: 'Gego Net',
      gegoShape: 'Gego Shape',
      sotoGrid: 'Soto Grid',
      sotoGridRotated: 'Soto Grid Rotated',
      whitneyLines: 'Whitney Lines',
      phyllotaxis: 'Phyllotaxis',
      moireCircles: 'Moire Circles',
      wovenNet: 'Woven Net',
      sinewave: 'Sine Wave',
      triangle: 'Triangle',
      polygons: 'Polygons'
    }
    return nameMap[name] || name
  }

  // Set settings reference
  setSettings (settings) {
    this.settings = settings
  }

  // Map luminode names to settings keys
  getLuminodeSettingsKey (luminode) {
    const luminodeMapping = {
      'lissajous': 'LISSAJOUS',
      'sphere': 'SPHERE',
      'harmonograph': 'HARMONOGRAPH',
      'gegoNet': 'GEGO_NET',
      'gegoShape': 'GEGO_SHAPE',
      'sotoGrid': 'SOTO_GRID',
      'sotoGridRotated': 'SOTO_GRID',
      'whitneyLines': 'WHITNEY_LINES',
      'phyllotaxis': 'PHYLLOTAXIS',
      'moireCircles': 'MOIRE_CIRCLES',
      'wovenNet': 'WOVEN_NET',
      'sinewave': 'SINEWAVE',
      'triangle': 'TRIANGLE',
      'polygons': 'POLYGONS'
    }
    return luminodeMapping[luminode] || luminode.toUpperCase()
  }

  // Tablet-related methods (delegated to TabletControls component)
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

  // Update geometric pencil mode settings
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

  updateFadeDuration (duration) {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer) {
      this.tabletControls.updateFadeDuration(duration, tabletControlsContainer)
    }
  }

  // Update MIDI output settings
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

  // Populate MIDI output devices
  async populateMidiOutputDevices () {
    const tabletControlsContainer = this.panel.querySelector('#tabletControlsContainer')
    if (tabletControlsContainer && this.midiManager) {
      // Get output devices from MIDI manager
      const devices = await this.midiManager.getAvailableOutputDevices()
      this.tabletControls.updateMidiOutputDevices(devices, tabletControlsContainer)
    }
  }

  // Create canvas and color controls HTML
  createCanvasControlsHTML () {
    const settings = this.settings || {}
    const canvasSettings = settings.CANVAS || { CLEAR_ALPHA: 0.1, BACKGROUND_COLOR: '#000' }
    const colorSettings = settings.COLORS || { 
      SOTO_PALETTE: ['#EF4136', '#005BBB', '#FCEE09', '#2E7D32', '#FFFFFF', '#4A148C', '#8B0000'],
      POLYGON_COLORS: ['#f93822', '#fcdc4d', '#00a6a6', '#90be6d', '#f94144', '#ff006e', '#8338ec']
    }
    
    // Get current pitch color factor from UTILS
    const currentPitchFactor = UTILS.pitchColorFactor || 30

    return `
      <div class="canvas-controls">
        <!-- Canvas Settings -->
        <div class="control-section">
          <h4>Canvas Settings</h4>
          
          <div class="control-group">
            <label for="clearAlpha">Clear Alpha (Ghostly Effect)</label>
            <div class="slider-container">
              <input type="range" 
                     id="clearAlpha" 
                     min="0" 
                     max="1" 
                     step="0.01" 
                     value="${canvasSettings.CLEAR_ALPHA}"
                     class="config-slider">
              <span class="slider-value">${canvasSettings.CLEAR_ALPHA}</span>
            </div>
          </div>
          
          <div class="control-group">
            <label for="backgroundColor">Background Color</label>
            <input type="color" 
                   id="backgroundColor" 
                   value="${canvasSettings.BACKGROUND_COLOR}"
                   class="color-picker">
          </div>
        </div>

        <!-- Color Palettes -->
        <div class="control-section">
          <h4>Color Palettes</h4>
          
          <div class="control-group">
            <label>Soto Palette</label>
            <div class="color-palette" id="sotoPalette">
              ${colorSettings.SOTO_PALETTE.map((color, index) => `
                <input type="color" 
                       class="palette-color" 
                       data-palette="soto" 
                       data-index="${index}"
                       value="${color}">
              `).join('')}
            </div>
            <div class="setting-info">
              <small>Used by: Soto Grid, Gego Net, Gego Shape, and other geometric luminodes</small>
            </div>
          </div>
          
          <div class="control-group">
            <label>Polygon Colors</label>
            <div class="color-palette" id="polygonPalette">
              ${colorSettings.POLYGON_COLORS.map((color, index) => `
                <input type="color" 
                       class="palette-color" 
                       data-palette="polygon" 
                       data-index="${index}"
                       value="${color}">
              `).join('')}
            </div>
            <div class="setting-info">
              <small>Used by: Polygons luminode for multi-layered shapes</small>
            </div>
          </div>
        </div>

        <!-- Pitch to Color Generator -->
        <div class="control-section">
          <h4>Pitch to Color Generator</h4>
          
          <div class="control-group">
            <label for="pitchColorFactor">Hue Factor</label>
            <div class="slider-container">
              <input type="range" 
                     id="pitchColorFactor" 
                     min="1" 
                     max="100" 
                     step="1" 
                     value="${currentPitchFactor}"
                     class="config-slider">
              <span class="slider-value">${currentPitchFactor}</span>
            </div>
            <div class="setting-info">
              <small>Affects: Sinewave, Triangle, Woven Net, Whitney Lines, Harmonograph, Lissajous, Moire Circles, Phyllotaxis</small>
            </div>
          </div>
          
          <div class="control-group">
            <label>C Scale Example</label>
            <div class="pitch-color-example" id="pitchColorExample">
              <!-- Generated pitch colors will appear here -->
            </div>
          </div>
        </div>
      </div>
    `
  }

  // Setup canvas controls event listeners
  setupCanvasControlsEventListeners (container) {
    // Clear alpha slider
    const clearAlphaSlider = container.querySelector('#clearAlpha')
    if (clearAlphaSlider) {
      clearAlphaSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = value
        }
        this.triggerCallback('canvasSettingChange', {
          setting: 'CLEAR_ALPHA',
          value
        })
      })
    }

    // Background color picker
    const backgroundColorPicker = container.querySelector('#backgroundColor')
    if (backgroundColorPicker) {
      backgroundColorPicker.addEventListener('change', (e) => {
        this.triggerCallback('canvasSettingChange', {
          setting: 'BACKGROUND_COLOR',
          value: e.target.value
        })
      })
    }

    // Palette color pickers
    const paletteColors = container.querySelectorAll('.palette-color')
    paletteColors.forEach(picker => {
      picker.addEventListener('change', (e) => {
        const palette = e.target.dataset.palette
        const index = parseInt(e.target.dataset.index)
        this.triggerCallback('colorPaletteChange', {
          palette,
          index,
          color: e.target.value
        })
      })
    })

    // Pitch color factor slider
    const pitchColorFactor = container.querySelector('#pitchColorFactor')
    if (pitchColorFactor) {
      pitchColorFactor.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = value
        }
        this.updatePitchColorExample(value)
        this.triggerCallback('pitchColorFactorChange', { value })
      })
    }

    // Initialize pitch color example
    this.updatePitchColorExample(30)
  }

  // Update pitch color example display
  updatePitchColorExample (factor) {
    const exampleContainer = document.querySelector('#pitchColorExample')
    if (!exampleContainer) return

    // C scale MIDI notes (C4 to C5)
    const cScaleNotes = [60, 62, 64, 65, 67, 69, 71, 72] // C, D, E, F, G, A, B, C
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']

    exampleContainer.innerHTML = cScaleNotes.map((note, index) => {
      const hue = (note % 14) * factor
      const color = `hsla(${hue}, 100%, 70%, 0.6)`
      return `
        <div class="pitch-color-item" style="background-color: ${color}">
          <span>${noteNames[index]}</span>
        </div>
      `
    }).join('')
  }

  // Public API
  isPanelVisible () {
    return this.isVisible
  }
}
