// Side panel UI component for track management
import { getLuminodeConfig, hasLuminodeConfig } from './luminode-configs.js'

export class SidePanel {
  constructor (trackManager) {
    this.trackManager = trackManager
    this.isVisible = false
    this.panel = null
    this.callbacks = {}
    this.settings = null

    this.initializePanel()
    this.setupEventListeners()
  }

  initializePanel () {
    // Create the side panel container
    this.panel = document.createElement('div')
    this.panel.id = 'sidePanel'
    this.panel.className = 'side-panel'

    // Create panel content
    this.panel.innerHTML = `
      <div class="side-panel-header">
        <h3>TRACKS</h3>
        <button id="togglePanel" class="toggle-panel-btn">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>
      <div class="side-panel-content">
        <div id="tracksContainer" class="tracks-container">
          <!-- Tracks will be dynamically generated -->
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

  // Panel visibility
  show () {
    this.panel.classList.add('visible')
    this.isVisible = true
    this.renderTracks()
  }

  hide () {
    this.panel.classList.remove('visible')
    this.isVisible = false
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
    
    return `
      <div class="config-header" data-track-id="${trackId}">
        <h4>${this.normalizeLuminodeName(luminode)} Config</h4>
      </div>
      <div class="config-controls" id="config-controls-${trackId}" style="display: none;">
        ${config.map(param => this.createConfigControl(param, trackId)).join('')}
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

  // Public API
  isPanelVisible () {
    return this.isVisible
  }
}
