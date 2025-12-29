// Track UI management - handles track rendering, event listeners, and updates
import { hasLuminodeConfig, getLuminodesByGroup } from '../luminode-configs.js'

function normalizeLuminodeNameUtil (name) {
  const nameMap = {
    lissajous: 'Lissajous',
    harmonograph: 'Harmonograph',
    sphere: 'Sphere',
    gegoNet: 'Gego Net',
    gegoShape: 'Gego Shape',
    sotoGrid: 'Soto Grid',
    sotoGridRotated: 'Soto Squares',
    whitneyLines: 'Whitney Lines',
    phyllotaxis: 'Phyllotaxis',
    moireCircles: 'Moire Circles',
    wovenNet: 'Woven Net',
    sinewave: 'Sine Wave',
    triangle: 'Triangle',
    polygons: 'Polygons',
    noiseValley: 'Noise Valley',
    catenoid: 'Catenoid',
    lineCylinder: 'Line Cylinder',
    clavilux: 'Clavilux',
    trefoil: 'Trefoil Knot',
    cube: 'Cube',
    diamond: 'Diamond',
    sphericalLens: 'Spherical Lens',
    epitrochoid: 'Epitrochoid',
    syncHelix2D: 'Sync Helix'
  }
  return nameMap[name] || name
}

// Export for reuse in other modules
export { normalizeLuminodeNameUtil as normalizeLuminodeName }

export class TrackUIManager {
  constructor (trackManager, panel, luminodeConfigManager = null) {
    this.trackManager = trackManager
    this.panel = panel
    this.luminodeConfigManager = luminodeConfigManager
    this.settings = null
  }

  // Set settings reference
  setSettings (settings) {
    this.settings = settings
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
                ${this.createGroupedLuminodeOptions(track.luminode)}
              </select>
            </div>
          </div>
          
          ${track.luminode !== 'triangle'
? `
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
          
          <!-- Trajectory Motion Controls -->
          <div class="assignment-row">
            <div class="assignment-group trajectory-controls">
              <label>
                <svg class="trajectory-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <style>.cls-1{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2px;}</style>
                  </defs>
                  <g data-name="Layer 2" id="Layer_2">
                    <g data-name="E449, Sine, sound, wave" id="E449_Sine_sound_wave">
                      <path class="cls-1" d="M3 12c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z"></path>
                      <path class="cls-1" d="M21 12c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z"></path>
                      <path class="cls-1" d="M12 3c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z"></path>
                      <path class="cls-1" d="M12 21c0-1.657 1.343-3 3-3s3 1.343 3 3-1.343 3-3 3-3-1.343-3-3z"></path>
                      <path class="cls-1" d="M6 6l12 12M18 6L6 18"></path>
                    </g>
                  </g>
                </svg>
                Trajectory Motion
              </label>
              <div class="trajectory-controls-grid">
                <div class="trajectory-control-row">
                  <div class="trajectory-control">
                    <label class="checkbox-container">
                      <input type="checkbox" 
                             class="trajectory-enable" 
                             data-track-id="${track.id}"
                             ${this.getTrajectoryConfig(track.id).enabled ? 'checked' : ''}>
                      <span class="checkmark"></span>
                      Enable Motion
                    </label>
                  </div>
                  <div class="trajectory-control">
                    <span class="trajectory-label">Type</span>
                    <select class="trajectory-type-select" data-track-id="${track.id}">
                      ${this.createTrajectoryTypeOptions(track.id)}
                    </select>
                  </div>
                </div>
                <div class="trajectory-control-row">
                  <div class="trajectory-control">
                    <span class="trajectory-label">Rate</span>
                    <div class="slider-container">
                      <input type="range" 
                             class="trajectory-slider" 
                             data-track-id="${track.id}" 
                             data-param="motionRate"
                             min="0.01" 
                             max="2.0" 
                             step="0.01" 
                             value="${this.getTrajectoryConfig(track.id).motionRate}">
                      <span class="slider-value">${this.getTrajectoryConfig(track.id).motionRate}</span>
                    </div>
                  </div>
                  <div class="trajectory-control">
                    <span class="trajectory-label">Amplitude</span>
                    <div class="slider-container">
                      <input type="range" 
                             class="trajectory-slider" 
                             data-track-id="${track.id}" 
                             data-param="amplitude"
                             min="0" 
                             max="200" 
                             step="1" 
                             value="${this.getTrajectoryConfig(track.id).amplitude}">
                      <span class="slider-value">${this.getTrajectoryConfig(track.id).amplitude}</span>
                    </div>
                  </div>
                </div>
                <div class="trajectory-control-row">
                  <div class="trajectory-control">
                    <span class="trajectory-label">Ratio A</span>
                    <div class="slider-container">
                      <input type="range" 
                             class="trajectory-slider" 
                             data-track-id="${track.id}" 
                             data-param="ratioA"
                             min="0.1" 
                             max="5.0" 
                             step="0.1" 
                             value="${this.getTrajectoryConfig(track.id).ratioA}">
                      <span class="slider-value">${this.getTrajectoryConfig(track.id).ratioA}</span>
                    </div>
                  </div>
                  <div class="trajectory-control">
                    <span class="trajectory-label">Ratio B</span>
                    <div class="slider-container">
                      <input type="range" 
                             class="trajectory-slider" 
                             data-track-id="${track.id}" 
                             data-param="ratioB"
                             min="0.1" 
                             max="5.0" 
                             step="0.1" 
                             value="${this.getTrajectoryConfig(track.id).ratioB}">
                      <span class="slider-value">${this.getTrajectoryConfig(track.id).ratioB}</span>
                    </div>
                  </div>
                </div>
                <div class="trajectory-control-row">
                  <div class="trajectory-control">
                    <span class="trajectory-label">Ratio C</span>
                    <div class="slider-container">
                      <input type="range" 
                             class="trajectory-slider" 
                             data-track-id="${track.id}" 
                             data-param="ratioC"
                             min="0.1" 
                             max="5.0" 
                             step="0.1" 
                             value="${this.getTrajectoryConfig(track.id).ratioC}">
                      <span class="slider-value">${this.getTrajectoryConfig(track.id).ratioC}</span>
                    </div>
                  </div>
                </div>
                <div class="trajectory-control-row">
                  <div class="trajectory-control">
                    <label class="checkbox-container">
                      <input type="checkbox" 
                             class="trajectory-inversion" 
                             data-track-id="${track.id}"
                             ${this.getTrajectoryConfig(track.id).inversion ? 'checked' : ''}>
                      <span class="checkmark"></span>
                      Invert Motion
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          `
: ''}
        </div>
        
        <!-- Luminode Configuration Section -->
        <div class="luminode-config" id="config-${track.id}" style="${track.luminode && hasLuminodeConfig(track.luminode) ? 'display: block;' : 'display: none;'}">
          ${this.luminodeConfigManager ? this.luminodeConfigManager.createLuminodeConfigHTML(track.luminode, track.id, this.settings || null) : ''}
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

      // Trajectory controls
      this.attachTrajectoryEventListeners(trackId)
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
    if (this.luminodeConfigManager) {
      this.luminodeConfigManager.updateLuminodeConfig(trackId, luminode)
    }
  }

  // Update trajectory UI controls
  updateTrajectoryUI (trackId, config) {
    const trackTile = this.panel.querySelector(`[data-track-id="${trackId}"]`)
    if (!trackTile) return

    // Update enable checkbox
    const enableCheckbox = trackTile.querySelector('.trajectory-enable')
    if (enableCheckbox) {
      enableCheckbox.checked = config.enabled
    }

    // Update type selection
    const typeSelect = trackTile.querySelector('.trajectory-type-select')
    if (typeSelect) {
      typeSelect.value = config.trajectoryType
    }

    // Update sliders
    const trajectorySliders = trackTile.querySelectorAll('.trajectory-slider')
    trajectorySliders.forEach(slider => {
      const param = slider.dataset.param
      if (config.hasOwnProperty(param)) {
        slider.value = config[param]
        const valueDisplay = slider.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = config[param]
        }
      }
    })
  }

  // Attach trajectory control event listeners
  attachTrajectoryEventListeners (trackId) {
    const trackTile = this.panel.querySelector(`[data-track-id="${trackId}"]`)
    if (!trackTile) return

    // Trajectory enable checkbox
    const enableCheckbox = trackTile.querySelector('.trajectory-enable')
    if (enableCheckbox) {
      enableCheckbox.addEventListener('change', (e) => {
        this.trackManager.updateTrajectoryConfig(trackId, { enabled: e.target.checked })
      })
    }

    // Trajectory type selection
    const typeSelect = trackTile.querySelector('.trajectory-type-select')
    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.trackManager.updateTrajectoryConfig(trackId, { trajectoryType: e.target.value })
      })
    }

    // Trajectory sliders
    const trajectorySliders = trackTile.querySelectorAll('.trajectory-slider')
    trajectorySliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const param = e.target.dataset.param
        const value = parseFloat(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')

        if (valueDisplay) {
          valueDisplay.textContent = value
        }

        this.trackManager.updateTrajectoryConfig(trackId, { [param]: value })
      })
    })

    // Trajectory inversion checkbox
    const inversionCheckbox = trackTile.querySelector('.trajectory-inversion')
    if (inversionCheckbox) {
      inversionCheckbox.addEventListener('change', (e) => {
        this.trackManager.updateTrajectoryConfig(trackId, { inversion: e.target.checked })
      })
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

  // Create grouped luminode options for dropdown
  createGroupedLuminodeOptions (selectedLuminode) {
    const groupedLuminodes = getLuminodesByGroup()
    let html = ''

    Object.entries(groupedLuminodes).forEach(([groupName, luminodes]) => {
      html += `<optgroup label="${groupName}">`
      luminodes.forEach(luminode => {
        const isSelected = selectedLuminode === luminode ? 'selected' : ''
        html += `<option value="${luminode}" ${isSelected}>
          ${this.normalizeLuminodeName(luminode)}
        </option>`
      })
      html += '</optgroup>'
    })

    return html
  }

  normalizeLuminodeName (name) {
    return normalizeLuminodeNameUtil(name)
  }

  getTrajectoryConfig (trackId) {
    return this.trackManager.getTrajectoryConfig(trackId)
  }

  createTrajectoryTypeOptions (trackId) {
    const currentType = this.getTrajectoryConfig(trackId).trajectoryType
    const typeNames = this.trackManager.getTrajectoryTypeNames()

    return Object.entries(typeNames).map(([value, label]) =>
      `<option value="${value}" ${currentType === value ? 'selected' : ''}>${label}</option>`
    ).join('')
  }
}
