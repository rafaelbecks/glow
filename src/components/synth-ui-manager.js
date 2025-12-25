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
            <ion-icon name="information-circle-outline"></ion-icon>
            Wavetable Synthesis
          </label>
          <div class="setting-description" style="margin-top: 8px;">
            Drawing data points create the waveform shape (wavetable).<br/>
            MIDI notes determine the playback pitch/frequency.<br/>
            Each luminode type has its characteristic waveform.
          </div>
        </div>
        
        <div class="synth-config-group">
          <label>
            <ion-icon name="filter-outline"></ion-icon>
            MS20 Filter
          </label>
          <label class="checkbox-container">
            <input id="filterEnabled" type="checkbox" ${config.filterEnabled ? 'checked' : ''}/>
            <span class="checkmark"></span>
            Enable Filter
          </label>
          <div class="range-container">
            <span style="font-size: 8px; color: #888; min-width: 60px;">Cutoff:</span>
            <input id="filterCutoff" type="range" min="20" max="20000" step="10" value="${config.filterCutoff}"/>
            <span class="range-value">${config.filterCutoff} Hz</span>
          </div>
          <div class="range-container">
            <span style="font-size: 8px; color: #888; min-width: 60px;">Resonance:</span>
            <input id="filterResonance" type="range" min="0" max="10" step="0.1" value="${config.filterResonance}"/>
            <span class="range-value">${config.filterResonance.toFixed(1)}</span>
          </div>
          <div class="setting-description">
            MS20-style low pass filter with resonance (max ${config.maxPolyphony} voices per track)
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
      const trackIdStr = String(track.id)
      const volume = this.synthManager.getTrackVolume(trackIdStr) || this.synthManager.getTrackVolume(track.id) || 0.5
      html += `
        <div class="range-container">
          <span style="font-size: 8px; color: #888; min-width: 60px;">${track.name}:</span>
          <input type="range" 
                 id="trackVolume-${track.id}"
                 class="track-volume-slider" 
                 data-track-id="${track.id}"
                 min="0" 
                 max="1" 
                 step="0.01" 
                 value="${volume}"/>
          <span class="range-value" id="trackVolumeValue-${track.id}">${Math.round(volume * 100)}%</span>
        </div>
      `
    })
    
    container.innerHTML = html

    // Setup event listeners for track volume sliders
    container.querySelectorAll('.track-volume-slider').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const trackId = parseInt(e.target.dataset.trackId)
        const trackIdStr = String(trackId)
        const volume = parseFloat(e.target.value)
        
        // Set volume using string trackId for consistency
        this.synthManager.setTrackVolume(trackIdStr, volume)
        
        // Update display
        const volumeValue = document.getElementById(`trackVolumeValue-${trackId}`)
        if (volumeValue) {
          volumeValue.textContent = `${Math.round(volume * 100)}%`
        }
        
        this.triggerCallback('trackVolumeChange', { trackId, volume })
      })
    })
  }

  // Setup event listeners for synth controls
  setupEventListeners (container) {
    const synthEnabled = container.querySelector('#synthEnabled')
    const attack = container.querySelector('#attack')
    const release = container.querySelector('#release')
    const clearSynthData = container.querySelector('#clearSynthData')
    const masterVolume = container.querySelector('#masterVolume')
    const testAudio = container.querySelector('#testAudio')
    const showDebugInfo = container.querySelector('#showDebugInfo')

    if (synthEnabled) {
      synthEnabled.addEventListener('change', async (e) => {
        const enabled = e.target.checked
        await this.synthManager.setEnabled(enabled)
        this.triggerCallback('synthEnabledChange', enabled)
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

    if (filterEnabled) {
      filterEnabled.addEventListener('change', (e) => {
        const enabled = e.target.checked
        this.synthManager.updateConfig({ filterEnabled: enabled })
        this.synthManager.setFilterEnabled(enabled)
        this.triggerCallback('filterEnabledChange', enabled)
      })
    }

    if (filterCutoff) {
      filterCutoff.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        this.updateRangeValue(value, container, 'filterCutoff', ' Hz')
        this.synthManager.updateConfig({ filterCutoff: value })
        this.synthManager.setFilterCutoff(value)
        this.triggerCallback('filterCutoffChange', value)
      })
    }

    if (filterResonance) {
      filterResonance.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        this.updateRangeValue(value, container, 'filterResonance', '')
        this.synthManager.updateConfig({ filterResonance: value })
        this.synthManager.setFilterResonance(value)
        this.triggerCallback('filterResonanceChange', value)
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

