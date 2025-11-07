// Modulation controls UI management
import { getLuminodeConfig } from '../luminode-configs.js'

export class ModulationUIManager {
  constructor (trackManager, panel) {
    this.trackManager = trackManager
    this.panel = panel
  }

  // Render modulation controls
  renderModulationControls () {
    const modulationContainer = this.panel.querySelector('#modulationControlsContainer')
    if (modulationContainer) {
      modulationContainer.innerHTML = this.createModulationControlsHTML()
      this.setupModulationControlsEventListeners(modulationContainer)
    }
  }

  // Create modulation controls HTML
  createModulationControlsHTML () {
    const modulators = this.trackManager.getModulators()
    const tracks = this.trackManager.getTracks()
    const modulationSystem = this.trackManager.getModulationSystem()
    const waveformShapes = modulationSystem.getWaveformShapes()
    const waveformNames = modulationSystem.getWaveformShapeNames()

    // Sync modulators with track luminodes (auto-populate if missing)
    modulators.forEach(modulator => {
      const track = tracks.find(t => t.id === modulator.targetTrack)
      if (track && track.luminode && !modulator.targetLuminode) {
        this.trackManager.updateModulator(modulator.id, { targetLuminode: track.luminode })
      } else if (track && !track.luminode && modulator.targetLuminode) {
        // Clear luminode if track doesn't have one
        this.trackManager.updateModulator(modulator.id, { targetLuminode: null, targetConfigKey: null })
      }
    })

    return `
      <div class="modulation-controls">
        <div class="control-section">
          <div class="modulator-header">
            <h4>Modulators</h4>
            <button class="add-modulator-btn" id="addModulatorBtn" ${modulators.length >= 4 ? 'disabled' : ''}>
              <ion-icon name="add-outline"></ion-icon>
              Add Modulator
            </button>
          </div>
          
          ${modulators.length === 0
            ? '<div class="no-modulators">No modulators. Click "Add Modulator" to create one.</div>'
            : ''
          }
          
          <div class="modulators-list" id="modulatorsList">
            ${modulators.map(modulator => this.createModulatorHTML(modulator, tracks, waveformShapes, waveformNames)).join('')}
          </div>
        </div>
      </div>
    `
  }

  // Create HTML for a single modulator
  createModulatorHTML (modulator, tracks, waveformShapes, waveformNames) {
    const waveformPreview = this.createWaveformPreview(modulator.shape, 40, 20)

    // Get the track's assigned luminode
    const track = tracks.find(t => t.id === modulator.targetTrack)
    const trackLuminode = track ? track.luminode : null

    // Get available config params for the track's luminode
    let configOptions = ''
    if (trackLuminode) {
      const configParams = getLuminodeConfig(trackLuminode)
      configOptions = configParams
        .filter(p => p.type === 'slider' || p.type === 'number')
        .map(p => `<option value="${p.key}" ${modulator.targetConfigKey === p.key ? 'selected' : ''}>${p.label}</option>`)
        .join('')
    }

    return `
      <div class="modulator-item" data-modulator-id="${modulator.id}">
        <div class="modulator-header-controls">
          <label class="modulator-toggle">
            <input type="checkbox" 
                   class="modulator-enabled" 
                   ${modulator.enabled ? 'checked' : ''}
                   data-modulator-id="${modulator.id}">
            <span class="toggle-label">${modulator.enabled ? 'Enabled' : 'Disabled'}</span>
          </label>
          <button class="remove-modulator-btn" data-modulator-id="${modulator.id}" title="Remove Modulator">
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        <div class="modulator-controls">
          <div class="modulator-row">
            <div class="modulator-control-group">
              <label>Waveform</label>
              <div class="waveform-selector">
                <select class="modulator-shape" data-modulator-id="${modulator.id}">
                  ${waveformShapes.map(shape => `
                    <option value="${shape}" ${modulator.shape === shape ? 'selected' : ''}>
                      ${waveformNames[shape]}
                    </option>
                  `).join('')}
                </select>
                <div class="waveform-preview" data-shape="${modulator.shape}">
                  ${waveformPreview}
                </div>
              </div>
            </div>
          </div>

          <div class="modulator-row">
            <div class="modulator-control-group" style="flex: 1;">
              <label>Track</label>
              <select class="modulator-track" data-modulator-id="${modulator.id}">
                ${tracks.map(t => `
                  <option value="${t.id}" ${modulator.targetTrack === t.id ? 'selected' : ''}>
                    Track ${t.id}${t.luminode ? ` (${t.luminode})` : ''}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          ${trackLuminode
? `
            <div class="modulator-row">
              <div class="modulator-control-group">
                <label>Parameter</label>
                <select class="modulator-config-key" data-modulator-id="${modulator.id}">
                  <option value="">Select Parameter</option>
                  ${configOptions}
                </select>
              </div>
            </div>
          `
: ''}

          <div class="modulator-row">
            <div class="modulator-control-group">
              <label>Rate</label>
              <div class="slider-container">
                <input type="range" 
                       class="modulator-rate" 
                       data-modulator-id="${modulator.id}"
                       min="0.001" 
                       max="2" 
                       step="0.001" 
                       value="${modulator.rate}">
                <span class="slider-value">${modulator.rate.toFixed(3)} Hz</span>
              </div>
            </div>

            <div class="modulator-control-group">
              <label>Depth</label>
              <div class="slider-container">
                <input type="range" 
                       class="modulator-depth" 
                       data-modulator-id="${modulator.id}"
                       min="0" 
                       max="1" 
                       step="0.01" 
                       value="${modulator.depth}">
                <span class="slider-value">${(modulator.depth * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          <div class="modulator-row">
            <div class="modulator-control-group">
              <label>Offset</label>
              <div class="slider-container">
                <input type="range" 
                       class="modulator-offset" 
                       data-modulator-id="${modulator.id}"
                       min="-1" 
                       max="1" 
                       step="0.01" 
                       value="${modulator.offset}">
                <span class="slider-value">${(modulator.offset * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  // Create SVG waveform preview
  createWaveformPreview (shape, width, height) {
    const viewBox = `0 0 ${width} ${height}`
    const centerY = height / 2
    let pathData = ''

    switch (shape) {
      case 'sine':
        pathData = `M 0,${centerY} ` + Array.from({ length: width }, (_, i) => {
          const x = i
          const y = centerY + Math.sin((i / width) * Math.PI * 4) * (height / 3)
          return `L ${x},${y}`
        }).join(' ')
        break
      case 'square':
        pathData = `M 0,${height * 0.25} L ${width / 4},${height * 0.25} L ${width / 4},${height * 0.75} L ${width * 3 / 4},${height * 0.75} L ${width * 3 / 4},${height * 0.25} L ${width},${height * 0.25}`
        break
      case 'triangle':
        pathData = `M 0,${height * 0.75} L ${width / 2},${height * 0.25} L ${width},${height * 0.75}`
        break
      case 'saw':
        pathData = `M 0,${height * 0.75} L ${width / 2},${height * 0.25} L ${width},${height * 0.75}`
        break
      default:
        pathData = `M 0,${centerY} L ${width},${centerY}`
    }

    return `
      <svg width="${width}" height="${height}" viewBox="${viewBox}" class="waveform-svg">
        <path d="${pathData}" stroke="currentColor" stroke-width="1.5" fill="none"/>
      </svg>
    `
  }

  // Setup event listeners
  setupModulationControlsEventListeners (container) {
    // Add modulator button
    const addBtn = container.querySelector('#addModulatorBtn')
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const modulatorId = this.trackManager.addModulator()
        if (modulatorId) {
          this.renderModulationControls()
        }
      })
    }

    // Remove modulator buttons
    container.querySelectorAll('.remove-modulator-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modulatorId = e.currentTarget.dataset.modulatorId
        this.trackManager.removeModulator(modulatorId)
        this.renderModulationControls()
      })
    })

    // Enable/disable toggles
    container.querySelectorAll('.modulator-enabled').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const modulatorId = e.currentTarget.dataset.modulatorId
        const enabled = e.target.checked
        this.trackManager.updateModulator(modulatorId, { enabled })
        this.updateModulatorToggleLabel(e.currentTarget.closest('.modulator-toggle'), enabled)
      })
    })

    // Waveform shape selectors
    container.querySelectorAll('.modulator-shape').forEach(select => {
      select.addEventListener('change', (e) => {
        const modulatorId = e.currentTarget.dataset.modulatorId
        const shape = e.target.value
        this.trackManager.updateModulator(modulatorId, { shape })
        this.updateWaveformPreview(e.currentTarget.closest('.waveform-selector'), shape)
      })
    })

    // Track selectors
    container.querySelectorAll('.modulator-track').forEach(select => {
      select.addEventListener('change', (e) => {
        const modulatorId = e.currentTarget.dataset.modulatorId
        const targetTrack = parseInt(e.target.value)
        const track = this.trackManager.getTrack(targetTrack)
        const targetLuminode = track && track.luminode ? track.luminode : null

        // Update modulator with track and auto-assigned luminode
        this.trackManager.updateModulator(modulatorId, {
          targetTrack,
          targetLuminode,
          targetConfigKey: null // Reset config key when track changes
        })

        // Re-render to show updated luminode and config params
        this.renderModulationControls()
      })
    })

    // Config key selectors
    container.querySelectorAll('.modulator-config-key').forEach(select => {
      select.addEventListener('change', (e) => {
        const modulatorId = e.currentTarget.dataset.modulatorId
        const targetConfigKey = e.target.value || null
        this.trackManager.updateModulator(modulatorId, { targetConfigKey })
      })
    })

    // Rate sliders
    container.querySelectorAll('.modulator-rate').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const modulatorId = e.currentTarget.dataset.modulatorId
        const rate = parseFloat(e.target.value)
        const valueDisplay = e.currentTarget.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = `${rate.toFixed(3)} Hz`
        }
        this.trackManager.updateModulator(modulatorId, { rate })
      })
    })

    // Depth sliders
    container.querySelectorAll('.modulator-depth').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const modulatorId = e.currentTarget.dataset.modulatorId
        const depth = parseFloat(e.target.value)
        const valueDisplay = e.currentTarget.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = `${(depth * 100).toFixed(0)}%`
        }
        this.trackManager.updateModulator(modulatorId, { depth })
      })
    })

    // Offset sliders
    container.querySelectorAll('.modulator-offset').forEach(slider => {
      slider.addEventListener('input', (e) => {
        const modulatorId = e.currentTarget.dataset.modulatorId
        const offset = parseFloat(e.target.value)
        const valueDisplay = e.currentTarget.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = `${(offset * 100).toFixed(0)}%`
        }
        this.trackManager.updateModulator(modulatorId, { offset })
      })
    })
  }

  // Helper methods
  updateModulatorToggleLabel (toggleElement, enabled) {
    const label = toggleElement.querySelector('.toggle-label')
    if (label) {
      label.textContent = enabled ? 'Enabled' : 'Disabled'
    }
  }

  updateWaveformPreview (selectorElement, shape) {
    const preview = selectorElement.querySelector('.waveform-preview')
    if (preview) {
      const modulationSystem = this.trackManager.getModulationSystem()
      const waveformPreview = this.createWaveformPreview(shape, 40, 20)
      preview.innerHTML = waveformPreview
      preview.dataset.shape = shape
    }
  }
}
