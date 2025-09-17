// Tablet controls component for the side panel
export class TabletControls {
  constructor (tabletManager) {
    this.tabletManager = tabletManager
    this.callbacks = {}
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

  // Create tablet controls HTML
  createTabletControlsHTML () {
    return `
      <div class="tablet-config-container">
        <div class="tablet-config-group">
          <label>
            <ion-icon name="tablet-landscape-outline"></ion-icon>
            Connection
          </label>
          <div class="connection-mode-selector">
            <label class="radio-container">
              <input type="radio" name="connectionMode" value="webhid" checked>
              <span class="radio-mark"></span>
              WebHID (macOS/Linux)
            </label>
            <label class="radio-container">
              <input type="radio" name="connectionMode" value="websocket">
              <span class="radio-mark"></span>
              WebSocket (Windows)
            </label>
          </div>
          <button id="readTabletData" class="tablet-action-btn">
            <ion-icon name="link-outline"></ion-icon>
            Connect Tablet
          </button>
          <div id="websocketSettings" class="websocket-settings" style="display: none;">
            <div class="input-group">
              <label>Host:</label>
              <input id="websocketHost" type="text" value="localhost" placeholder="localhost">
            </div>
            <div class="input-group">
              <label>Port:</label>
              <input id="websocketPort" type="number" value="5678" placeholder="5678">
            </div>
            <div class="connection-status" id="connectionStatus">
              <span class="status-indicator"></span>
              <span class="status-text">Disconnected</span>
            </div>
          </div>
        </div>
        
        <div class="tablet-config-group">
          <label>
            <ion-icon name="resize-outline"></ion-icon>
            Line Width
          </label>
          <div class="range-container">
            <input id="tabletWidth" type="range" min="1" max="20" value="4"/>
            <span class="range-value">4</span>
          </div>
        </div>
        
        <div class="tablet-config-group">
          <label>
            <ion-icon name="trash-outline"></ion-icon>
            Actions
          </label>
          <button id="clearTablet" class="tablet-action-btn danger">
            <ion-icon name="trash-outline"></ion-icon>
            Clear Drawing
          </button>
        </div>
        
        
        <div class="tablet-config-group">
          <label>
            <ion-icon name="shapes-outline"></ion-icon>
            Geometric Pencil Mode
          </label>
          <label class="checkbox-container">
            <input id="geometricPencilToggle" type="checkbox"/>
            <span class="checkmark"></span>
            Enable Geometric Pencil
          </label>
          <div class="setting-description">
            Draw rotating polygons instead of strokes
          </div>
        </div>
        
        <div class="tablet-config-group" id="geometricPencilSettings" style="display: none;">
          <label>
            Polygon Sides
          </label>
          <div class="range-container">
            <input id="polygonSides" type="range" min="3" max="10" value="3"/>
            <span class="range-value">3</span>
          </div>
          <div class="setting-description">
            Number of sides for the polygon (3=triangle, 4=square, etc.)
          </div>
          
          <label>
            Fade Duration (seconds)
          </label>
          <div class="range-container">
            <input id="fadeDuration" type="range" min="1" max="10" step="0.5" value="3"/>
            <span class="range-value">3.0</span>
          </div>
          <div class="setting-description">
            How long shapes stay visible before fading out
          </div>
                  
        </div>
        
        <div class="tablet-config-group">
          <label>
            <ion-icon name="shapes-outline"></ion-icon>
            Shape Detection
          </label>
          <label class="checkbox-container">
            <input id="geometricModeToggle" type="checkbox"/>
            <span class="checkmark"></span>
            Enable Shape Detection
          </label>
          <div class="setting-description">
            Automatically convert strokes to lines
          </div>
        </div>
        
        <div class="tablet-config-group" id="geometricSettings" style="display: none;">
          <label>
            Detection Sensitivity
          </label>
          <div class="range-container">
            <input id="shapeDetectionThreshold" type="range" min="0.1" max="1.0" step="0.1" value="0.8"/>
            <span class="range-value">0.8</span>
          </div>
          <div class="setting-description">
            Higher values require more precise shapes (0.1 = loose, 1.0 = very strict)
          </div>
        </div>
        
        <div class="tablet-config-group">
          <label>
            <ion-icon name="musical-notes-outline"></ion-icon>
            MIDI Output
          </label>
          <label class="checkbox-container">
            <input id="midiOutputToggle" type="checkbox"/>
            <span class="checkmark"></span>
            Enable MIDI Output
          </label>
          <div class="setting-description">
            Send MIDI notes based on pencil position and pressure
          </div>
        </div>
        
        <div class="tablet-config-group" id="midiOutputSettings" style="display: none;">
          <div class="assignment-group">
            <label>
              <ion-icon name="musical-notes-outline"></ion-icon>
              MIDI Device
            </label>
            <select id="midiOutputDevice" class="midi-device-select">
              <option value="">Select Device</option>
            </select>
          </div>
          <div class="setting-description">
            Choose which MIDI device to send notes to
          </div>
          
          <label>
            Octave Range
          </label>
          <div class="range-container">
            <input id="octaveRange" type="range" min="1" max="4" value="3"/>
            <span class="range-value">3</span>
          </div>
          <div class="setting-description">
            Number of octaves to map X position to (1-4 octaves)
          </div>
        </div>
      </div>
    `
  }

  // Setup event listeners for tablet controls
  setupEventListeners (container) {
    const readTabletBtn = container.querySelector('#readTabletData')
    const clearTabletBtn = container.querySelector('#clearTablet')
    const tabletWidthSlider = container.querySelector('#tabletWidth')
    const geometricPencilToggle = container.querySelector('#geometricPencilToggle')
    const midiOutputToggle = container.querySelector('#midiOutputToggle')
    const midiOutputDevice = container.querySelector('#midiOutputDevice')
    const octaveRange = container.querySelector('#octaveRange')
    const geometricModeToggle = container.querySelector('#geometricModeToggle')
    const shapeDetectionThreshold = container.querySelector('#shapeDetectionThreshold')

    // WebSocket controls
    const connectionModeRadios = container.querySelectorAll('input[name="connectionMode"]')
    const websocketSettings = container.querySelector('#websocketSettings')
    const websocketHost = container.querySelector('#websocketHost')
    const websocketPort = container.querySelector('#websocketPort')
    const connectionStatus = container.querySelector('#connectionStatus')

    if (readTabletBtn) {
      readTabletBtn.addEventListener('click', () => {
        this.triggerCallback('connectTablet')
      })
    }

    if (clearTabletBtn) {
      clearTabletBtn.addEventListener('click', () => {
        this.triggerCallback('clearTablet')
      })
    }

    if (tabletWidthSlider) {
      tabletWidthSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        this.updateRangeValue(value, container)
        this.triggerCallback('tabletWidthChange', value)
      })
    }

    if (geometricPencilToggle) {
      geometricPencilToggle.addEventListener('change', (e) => {
        this.toggleGeometricPencilSettings(e.target.checked, container)
        this.triggerCallback('geometricPencilChange', e.target.checked)
      })
    }

    if (midiOutputToggle) {
      midiOutputToggle.addEventListener('change', (e) => {
        this.toggleMidiOutputSettings(e.target.checked, container)
        this.triggerCallback('midiOutputChange', e.target.checked)
      })
    }

    if (midiOutputDevice) {
      midiOutputDevice.addEventListener('change', (e) => {
        this.triggerCallback('midiOutputDeviceChange', e.target.value)
      })
    }

    if (octaveRange) {
      octaveRange.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        this.updateRangeValue(value, container, 'octaveRange')
        this.triggerCallback('octaveRangeChange', value)
      })
    }

    if (geometricModeToggle) {
      geometricModeToggle.addEventListener('change', (e) => {
        this.toggleGeometricSettings(e.target.checked, container)
        this.triggerCallback('geometricModeChange', e.target.checked)
      })
    }

    if (shapeDetectionThreshold) {
      shapeDetectionThreshold.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        this.updateRangeValue(value, container, 'shapeDetectionThreshold')
        this.triggerCallback('shapeDetectionThresholdChange', value)
      })
    }

    // WebSocket connection mode event listeners
    if (connectionModeRadios.length > 0) {
      connectionModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
          this.toggleWebSocketSettings(e.target.value === 'websocket', container)
          this.triggerCallback('connectionModeChange', e.target.value)
        })
      })
    }

    if (websocketHost) {
      websocketHost.addEventListener('input', (e) => {
        this.triggerCallback('websocketHostChange', e.target.value)
      })
    }

    if (websocketPort) {
      websocketPort.addEventListener('input', (e) => {
        this.triggerCallback('websocketPortChange', parseInt(e.target.value))
      })
    }
  }

  // Update range value display
  updateRangeValue (value, container, selector = null) {
    if (selector) {
      const rangeValue = container.querySelector(`#${selector}`).parentElement.querySelector('.range-value')
      if (rangeValue) {
        rangeValue.textContent = value.toFixed(1)
      }
    } else {
      const rangeValue = container.querySelector('.range-value')
      if (rangeValue) {
        rangeValue.textContent = value
      }
    }
  }

  // Set up event listeners for geometric pencil controls
  setupGeometricPencilEventListeners (container) {
    const polygonSides = container.querySelector('#polygonSides')
    const fadeDuration = container.querySelector('#fadeDuration')
    const polygonSize = container.querySelector('#polygonSize')

    if (polygonSides && !polygonSides.hasAttribute('data-listener-attached')) {
      polygonSides.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        this.updateRangeValue(value, container, 'polygonSides')
        this.triggerCallback('polygonSidesChange', value)
      })
      polygonSides.setAttribute('data-listener-attached', 'true')
    }

    if (fadeDuration && !fadeDuration.hasAttribute('data-listener-attached')) {
      fadeDuration.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        this.updateRangeValue(value, container, 'fadeDuration')
        this.triggerCallback('fadeDurationChange', value)
      })
      fadeDuration.setAttribute('data-listener-attached', 'true')
    }

    if (polygonSize && !polygonSize.hasAttribute('data-listener-attached')) {
      polygonSize.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        this.updateRangeValue(value, container, 'polygonSize')
        this.triggerCallback('polygonSizeChange', value)
      })
      polygonSize.setAttribute('data-listener-attached', 'true')
    }
  }

  // Toggle geometric pencil settings visibility
  toggleGeometricPencilSettings (enabled, container) {
    const geometricPencilSettings = container.querySelector('#geometricPencilSettings')
    if (geometricPencilSettings) {
      geometricPencilSettings.style.display = enabled ? 'block' : 'none'

      // Set up event listeners for geometric pencil controls when they become visible
      if (enabled) {
        this.setupGeometricPencilEventListeners(container)
      }
    }
  }

  // Toggle MIDI output settings visibility
  toggleMidiOutputSettings (enabled, container) {
    const midiOutputSettings = container.querySelector('#midiOutputSettings')
    if (midiOutputSettings) {
      midiOutputSettings.style.display = enabled ? 'block' : 'none'
    }
  }

  // Toggle geometric settings visibility
  toggleGeometricSettings (enabled, container) {
    const geometricSettings = container.querySelector('#geometricSettings')
    if (geometricSettings) {
      geometricSettings.style.display = enabled ? 'block' : 'none'
    }
  }

  // Toggle WebSocket settings visibility
  toggleWebSocketSettings (enabled, container) {
    const websocketSettings = container.querySelector('#websocketSettings')
    if (websocketSettings) {
      websocketSettings.style.display = enabled ? 'block' : 'none'
    }
  }

  // Update connection status display
  updateConnectionStatus (status, container) {
    const statusElement = container.querySelector('#connectionStatus')
    if (statusElement) {
      const indicator = statusElement.querySelector('.status-indicator')
      const text = statusElement.querySelector('.status-text')

      if (indicator && text) {
        // Remove existing status classes
        indicator.className = 'status-indicator'

        // Add new status class and update text
        switch (status) {
          case 'connected':
            indicator.classList.add('connected')
            text.textContent = 'Connected'
            break
          case 'connecting':
            indicator.classList.add('connecting')
            text.textContent = 'Connecting...'
            break
          case 'disconnected':
            indicator.classList.add('disconnected')
            text.textContent = 'Disconnected'
            break
          case 'error':
            indicator.classList.add('error')
            text.textContent = 'Connection Error'
            break
          default:
            indicator.classList.add('disconnected')
            text.textContent = 'Unknown'
        }
      }
    }
  }

  // Update WebSocket host
  updateWebSocketHost (host, container) {
    const input = container.querySelector('#websocketHost')
    if (input) {
      input.value = host
    }
  }

  // Update WebSocket port
  updateWebSocketPort (port, container) {
    const input = container.querySelector('#websocketPort')
    if (input) {
      input.value = port
    }
  }

  // Update connection mode
  updateConnectionMode (mode, container) {
    const radios = container.querySelectorAll('input[name="connectionMode"]')
    radios.forEach(radio => {
      radio.checked = radio.value === mode
    })
    this.toggleWebSocketSettings(mode === 'websocket', container)
  }

  // Update tablet width from external source
  updateTabletWidth (value, container) {
    const slider = container.querySelector('#tabletWidth')
    if (slider) {
      slider.value = value
      this.updateRangeValue(value, container)
    }
  }

  // Update geometric mode from external source
  updateGeometricMode (enabled, container) {
    const checkbox = container.querySelector('#geometricModeToggle')
    if (checkbox) {
      checkbox.checked = enabled
      this.toggleGeometricSettings(enabled, container)
    }
  }

  // Update geometric pencil mode from external source
  updateGeometricPencil (enabled, container) {
    const checkbox = container.querySelector('#geometricPencilToggle')
    if (checkbox) {
      checkbox.checked = enabled
      this.toggleGeometricPencilSettings(enabled, container)
    }
  }

  // Update polygon sides from external source
  updatePolygonSides (value, container) {
    const slider = container.querySelector('#polygonSides')
    if (slider) {
      slider.value = value
      this.updateRangeValue(value, container, 'polygonSides')
    }
  }

  // Update fade duration from external source
  updateFadeDuration (value, container) {
    const slider = container.querySelector('#fadeDuration')
    if (slider) {
      slider.value = value
      this.updateRangeValue(value, container, 'fadeDuration')
    }
  }

  // Update polygon size from external source
  updatePolygonSize (value, container) {
    const slider = container.querySelector('#polygonSize')
    if (slider) {
      slider.value = value
      this.updateRangeValue(value, container, 'polygonSize')
    }
  }

  // Update MIDI output mode from external source
  updateMidiOutput (enabled, container) {
    const checkbox = container.querySelector('#midiOutputToggle')
    if (checkbox) {
      checkbox.checked = enabled
      this.toggleMidiOutputSettings(enabled, container)
    }
  }

  // Update MIDI output device list
  updateMidiOutputDevices (devices, container) {
    const select = container.querySelector('#midiOutputDevice')
    if (select) {
      // Clear existing options except the first one
      select.innerHTML = '<option value="">Select MIDI Device</option>'

      // Add device options
      devices.forEach(device => {
        const option = document.createElement('option')
        option.value = device.id
        option.textContent = device.name
        select.appendChild(option)
      })
    }
  }

  // Update selected MIDI output device
  updateMidiOutputDevice (deviceId, container) {
    const select = container.querySelector('#midiOutputDevice')
    if (select) {
      select.value = deviceId
    }
  }

  // Update octave range from external source
  updateOctaveRange (value, container) {
    const slider = container.querySelector('#octaveRange')
    if (slider) {
      slider.value = value
      this.updateRangeValue(value, container, 'octaveRange')
    }
  }

  // Update shape detection threshold from external source
  updateShapeDetectionThreshold (value, container) {
    const slider = container.querySelector('#shapeDetectionThreshold')
    if (slider) {
      slider.value = value
      this.updateRangeValue(value, container, 'shapeDetectionThreshold')
    }
  }
}
