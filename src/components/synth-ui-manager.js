// Synth UI Manager - Controls for audio synthesis parameters
export class SynthUIManager {
  constructor (panel, synthManager, trackManager = null) {
    this.panel = panel
    this.synthManager = synthManager
    this.trackManager = trackManager
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

  // Create synth controls HTML
  createSynthControlsHTML () {
    const config = this.synthManager.getConfig()
    
    return `
      <div class="synth-config-container">
        <div class="synth-config-group">
          <label>
            <ion-icon name="volume-high-outline"></ion-icon>
            Audio Output
          </label>
          <label class="checkbox-container">
            <input id="synthEnabled" type="checkbox" ${this.synthManager.isEnabled ? 'checked' : ''}/>
            <span class="checkmark"></span>
            Enable Audio Synthesis
          </label>
          <div class="setting-description">
            Generate sound from drawing data points
          </div>
          
          <div class="assignment-group" style="margin-top: 12px;">
            <label>
              <ion-icon name="headset-outline"></ion-icon>
              Audio Device
            </label>
            <select id="audioOutputDevice" class="synth-select">
              <option value="">Default Output</option>
            </select>
          </div>
          
          <div class="range-container" style="margin-top: 12px;">
            <span style="font-size: 8px; color: #888; min-width: 60px;">Master Volume:</span>
            <input id="masterVolume" type="range" min="0" max="1" step="0.01" value="0.5"/>
            <span class="range-value">50%</span>
          </div>
          
          <div class="assignment-group" style="margin-top: 12px;">
            <label>
              <ion-icon name="headset-outline"></ion-icon>
              Audio Device
            </label>
            <select id="audioOutputDevice" class="synth-select">
              <option value="">Default Output</option>
            </select>
          </div>
          
          <button id="testAudio" class="synth-action-btn" style="margin-top: 8px;">
            <ion-icon name="musical-note-outline"></ion-icon>
            Test Audio
          </button>
          
          <button id="showDebugInfo" class="synth-action-btn" style="margin-top: 4px;">
            <ion-icon name="bug-outline"></ion-icon>
            Show Debug Info
          </button>
        </div>
        
        <div class="synth-config-group">
          <label>
            <ion-icon name="resize-outline"></ion-icon>
            X-Axis Range (Frequency Mapping)
          </label>
          <div class="range-container">
            <span style="font-size: 8px; color: #888; min-width: 30px;">Min:</span>
            <input id="xRangeMin" type="range" min="0" max="1" step="0.01" value="${config.xRange.min}"/>
            <span class="range-value">${config.xRange.min.toFixed(2)}</span>
          </div>
          <div class="range-container">
            <span style="font-size: 8px; color: #888; min-width: 30px;">Max:</span>
            <input id="xRangeMax" type="range" min="0" max="1" step="0.01" value="${config.xRange.max}"/>
            <span class="range-value">${config.xRange.max.toFixed(2)}</span>
          </div>
          <div class="setting-description">
            Canvas X position range mapped to audio frequency spectrum
          </div>
        </div>
        
        <div class="synth-config-group">
          <label>
            <ion-icon name="musical-notes-outline"></ion-icon>
            Frequency Range (Hz)
          </label>
          <div class="range-container">
            <span style="font-size: 8px; color: #888; min-width: 30px;">Min:</span>
            <input id="frequencyMin" type="range" min="20" max="500" step="10" value="${config.frequencyMin}"/>
            <span class="range-value">${config.frequencyMin} Hz</span>
          </div>
          <div class="range-container">
            <span style="font-size: 8px; color: #888; min-width: 30px;">Max:</span>
            <input id="frequencyMax" type="range" min="500" max="5000" step="50" value="${config.frequencyMax}"/>
            <span class="range-value">${config.frequencyMax} Hz</span>
          </div>
          <div class="setting-description">
            Audio frequency range for X-axis mapping
          </div>
        </div>
        
        <div class="synth-config-group">
          <label>
            <ion-icon name="time-outline"></ion-icon>
            Envelope
          </label>
          <div class="range-container">
            <span style="font-size: 8px; color: #888; min-width: 50px;">Attack (s):</span>
            <input id="attack" type="range" min="0" max="0.5" step="0.01" value="${config.attack}"/>
            <span class="range-value">${config.attack.toFixed(2)}s</span>
          </div>
          <div class="range-container">
            <span style="font-size: 8px; color: #888; min-width: 50px;">Release (s):</span>
            <input id="release" type="range" min="0" max="1" step="0.01" value="${config.release}"/>
            <span class="range-value">${config.release.toFixed(2)}s</span>
          </div>
          <div class="setting-description">
            Attack and release times for audio envelope
          </div>
        </div>
        
        <div class="synth-config-group">
          <label>
            <ion-icon name="musical-notes-outline"></ion-icon>
            Per-Track Volume
          </label>
          <div id="trackVolumesContainer" class="track-volumes-container">
            <!-- Track volume controls will be dynamically generated -->
          </div>
          <div class="setting-description">
            Volume control for each active track with luminodes
          </div>
        </div>
        
        <div class="synth-config-group">
          <label>
            <ion-icon name="trash-outline"></ion-icon>
            Actions
          </label>
          <button id="clearSynthData" class="synth-action-btn">
            <ion-icon name="trash-outline"></ion-icon>
            Clear All Data
          </button>
        </div>
      </div>
    `
  }

  // Render track volume controls
  renderTrackVolumes () {
    const container = this.panel.querySelector('#trackVolumesContainer')
    if (!container || !this.trackManager) return

    const tracks = this.trackManager.getTracks()
    
    // Filter to tracks that:
    // 1. Have a luminode assigned
    // 2. Have a MIDI device selected
    // 3. Are not muted (or are soloed if any track is soloed)
    const hasSolo = tracks.some(track => track.solo)
    const tracksWithLuminodes = tracks.filter(track => {
      const hasLuminode = track.luminode !== null
      const hasMidiDevice = track.midiDevice !== null
      const isActive = hasSolo ? track.solo : !track.muted
      
      return hasLuminode && hasMidiDevice && isActive
    })

    if (tracksWithLuminodes.length === 0) {
      container.innerHTML = '<div style="color: #888; font-size: 10px; padding: 8px; text-align: center;">No active tracks with luminodes</div>'
      return
    }

    let html = ''
    tracksWithLuminodes.forEach(track => {
      const volume = this.synthManager.getTrackVolume(track.id) || 0.5
      html += `
        <div class="track-volume-item" data-track-id="${track.id}">
          <div class="track-volume-label">
            <span>${track.name}</span>
            <span class="track-volume-value">${(volume * 100).toFixed(0)}%</span>
          </div>
          <div class="range-container">
            <input type="range" 
                   class="track-volume-slider" 
                   data-track-id="${track.id}"
                   min="0" 
                   max="1" 
                   step="0.01" 
                   value="${volume}"/>
          </div>
        </div>
      `
    })
    
    container.innerHTML = html

    // Setup event listeners for track volume sliders
    container.querySelectorAll('.track-volume-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const trackId = parseInt(e.target.dataset.trackId)
        const volume = parseFloat(e.target.value)
        this.synthManager.setTrackVolume(trackId, volume)
        
        // Update display
        const volumeValue = e.target.closest('.track-volume-item').querySelector('.track-volume-value')
        if (volumeValue) {
          volumeValue.textContent = `${(volume * 100).toFixed(0)}%`
        }
        
        this.triggerCallback('trackVolumeChange', { trackId, volume })
      })
    })
  }

  // Setup event listeners for synth controls
  setupEventListeners (container) {
    const synthEnabled = container.querySelector('#synthEnabled')
    const xRangeMin = container.querySelector('#xRangeMin')
    const xRangeMax = container.querySelector('#xRangeMax')
    const frequencyMin = container.querySelector('#frequencyMin')
    const frequencyMax = container.querySelector('#frequencyMax')
    const attack = container.querySelector('#attack')
    const release = container.querySelector('#release')
    const clearSynthData = container.querySelector('#clearSynthData')
    const masterVolume = container.querySelector('#masterVolume')
    const audioOutputDevice = container.querySelector('#audioOutputDevice')
    const testAudio = container.querySelector('#testAudio')
    const showDebugInfo = container.querySelector('#showDebugInfo')

    if (synthEnabled) {
      synthEnabled.addEventListener('change', async (e) => {
        const enabled = e.target.checked
        await this.synthManager.setEnabled(enabled)
        this.triggerCallback('synthEnabledChange', enabled)
      })
    }

    if (xRangeMin) {
      xRangeMin.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        this.updateRangeValue(value, container, 'xRangeMin')
        this.triggerCallback('xRangeMinChange', value)
      })
    }

    if (xRangeMax) {
      xRangeMax.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        this.updateRangeValue(value, container, 'xRangeMax')
        this.triggerCallback('xRangeMaxChange', value)
      })
    }

    if (frequencyMin) {
      frequencyMin.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        this.updateRangeValue(value, container, 'frequencyMin', ' Hz')
        this.triggerCallback('frequencyMinChange', value)
      })
    }

    if (frequencyMax) {
      frequencyMax.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        this.updateRangeValue(value, container, 'frequencyMax', ' Hz')
        this.triggerCallback('frequencyMaxChange', value)
      })
    }

    if (attack) {
      attack.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        this.updateRangeValue(value, container, 'attack', 's')
        this.triggerCallback('attackChange', value)
      })
    }

    if (release) {
      release.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        this.updateRangeValue(value, container, 'release', 's')
        this.triggerCallback('releaseChange', value)
      })
    }

    if (clearSynthData) {
      clearSynthData.addEventListener('click', () => {
        this.synthManager.clearAllData()
        this.triggerCallback('clearSynthData')
      })
    }

    if (masterVolume) {
      masterVolume.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        this.synthManager.setMasterVolume(value)
        const volumeValue = e.target.parentElement.querySelector('.range-value')
        if (volumeValue) {
          volumeValue.textContent = `${Math.round(value * 100)}%`
        }
        this.triggerCallback('masterVolumeChange', value)
      })
    }

    if (audioOutputDevice) {
      // Populate audio output devices
      this.populateAudioOutputDevices()
      
      audioOutputDevice.addEventListener('change', async (e) => {
        const sinkId = e.target.value
        await this.synthManager.setSinkId(sinkId || '')
        this.triggerCallback('audioOutputDeviceChange', sinkId)
      })
    }

    if (testAudio) {
      testAudio.addEventListener('click', () => {
        this.synthManager.playTestTone()
      })
    }

    if (showDebugInfo) {
      showDebugInfo.addEventListener('click', () => {
        const debugInfo = this.synthManager.getDebugInfo()
        console.log('=== SYNTH DEBUG INFO ===')
        console.log(debugInfo)
        alert('Debug info logged to console. Check browser console for details.')
      })
    }
  }

  // Populate audio output device dropdown
  async populateAudioOutputDevices () {
    const select = this.panel.querySelector('#audioOutputDevice')
    if (!select) return

    try {
      const devices = await this.synthManager.getAvailableSinks()
      
      // Clear existing options except default
      select.innerHTML = '<option value="">Default Output</option>'
      
      devices.forEach(device => {
        const option = document.createElement('option')
        option.value = device.id
        option.textContent = device.name
        select.appendChild(option)
      })
      
      if (devices.length === 0) {
        const option = document.createElement('option')
        option.value = ''
        option.textContent = 'No audio outputs available'
        option.disabled = true
        select.appendChild(option)
      }
    } catch (error) {
      console.error('Failed to populate audio output devices:', error)
    }
  }

  // Update range value display
  updateRangeValue (value, container, selector, suffix = '') {
    const input = container.querySelector(`#${selector}`)
    if (input) {
      const rangeValue = input.parentElement.querySelector('.range-value')
      if (rangeValue) {
        if (selector.includes('frequency')) {
          rangeValue.textContent = `${value}${suffix}`
        } else if (selector.includes('attack') || selector.includes('release')) {
          rangeValue.textContent = `${value.toFixed(2)}${suffix}`
        } else {
          rangeValue.textContent = `${value.toFixed(2)}${suffix}`
        }
      }
    }
  }

  // Render synth controls
  renderSynthControls () {
    const synthControlsContainer = this.panel.querySelector('#synthControlsContainer')
    if (synthControlsContainer) {
      synthControlsContainer.innerHTML = this.createSynthControlsHTML()
      this.setupEventListeners(synthControlsContainer)
      // Render track volumes after a short delay to ensure DOM is ready
      setTimeout(() => {
        this.renderTrackVolumes()
        // Refresh track volumes periodically to show active tracks
        this.trackVolumesInterval = setInterval(() => {
          this.renderTrackVolumes()
        }, 1000) // Update every second
      }, 100)
    }
  }

  // Clean up intervals
  cleanup () {
    if (this.trackVolumesInterval) {
      clearInterval(this.trackVolumesInterval)
      this.trackVolumesInterval = null
    }
  }
}

