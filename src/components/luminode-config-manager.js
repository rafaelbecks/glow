// Luminode configuration UI management
import { getLuminodeConfig, hasLuminodeConfig } from '../luminode-configs.js'
import { normalizeLuminodeName as normalizeLuminodeNameUtil } from './track-ui-manager.js'

function getLuminodeSettingsKey (luminode) {
  const luminodeMapping = {
    lissajous: 'LISSAJOUS',
    sphere: 'SPHERE',
    harmonograph: 'HARMONOGRAPH',
    gegoNet: 'GEGO_NET',
    gegoShape: 'GEGO_SHAPE',
    sotoGrid: 'SOTO_GRID',
    sotoGridRotated: 'SOTO_GRID',
    whitneyLines: 'WHITNEY_LINES',
    phyllotaxis: 'PHYLLOTAXIS',
    moireCircles: 'MOIRE_CIRCLES',
    wovenNet: 'WOVEN_NET',
    sinewave: 'SINEWAVE',
    triangle: 'TRIANGLE',
    polygons: 'POLYGONS',
    noiseValley: 'NOISE_VALLEY',
    catenoid: 'CATENOID',
    lineCylinder: 'LINE_CYLINDER',
    clavilux: 'CLAVILUX',
    diamond: 'DIAMOND',
    cube: 'CUBE',
    trefoil: 'TREFOIL',
    luneburgLens: 'LUNEBURG_LENS'
  }
  return luminodeMapping[luminode] || luminode.toUpperCase()
}

export class LuminodeConfigManager {
  constructor (trackManager, panel) {
    this.trackManager = trackManager
    this.panel = panel
    this.settings = null
  }

  // Set settings reference
  setSettings (settings) {
    this.settings = settings
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
      const displayValue = param.value === 0 && param.key === 'LINE_LENGTH' ? 'Full Width' : param.value
      return `
        <div class="config-control">
          <label for="${controlId}">${param.label}</label>
          <div class="slider-container">
            <input type="range" 
                   id="${controlId}" 
                   min="${param.min}" 
                   max="${param.max}" 
                   step="${param.step}" 
                   value="${param.value || 0}"
                   data-track-id="${trackId}"
                   data-param="${param.key}"
                   class="config-slider">
            <span class="slider-value">${displayValue}</span>
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
    } else if (param.type === 'select') {
      const options = param.options || []
      return `
        <div class="config-control">
          <label for="${controlId}">${param.label}</label>
          <select id="${controlId}"
                  data-track-id="${trackId}"
                  data-param="${param.key}"
                  class="config-select luminode-select">
            ${options.map(opt => `
              <option value="${opt.value}" ${param.value === opt.value ? 'selected' : ''}>
                ${opt.label}
              </option>
            `).join('')}
          </select>
        </div>
      `
    }

    return ''
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
          // Special display for LINE_LENGTH when 0
          if (param === 'LINE_LENGTH' && value === 0) {
            valueDisplay.textContent = 'Full Width'
          } else {
            valueDisplay.textContent = value
          }
        }

        this.triggerConfigChange(trackId, param, value)
      })
    })

    // Number controls
    const numberInputs = configElement.querySelectorAll('.config-number')
    numberInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        const param = e.target.dataset.param

        this.triggerConfigChange(trackId, param, value)
      })
    })

    // Checkbox controls
    const checkboxInputs = configElement.querySelectorAll('.config-checkbox')
    checkboxInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const value = e.target.checked
        const param = e.target.dataset.param

        this.triggerConfigChange(trackId, param, value)
      })
    })

    // Select controls
    const selectInputs = configElement.querySelectorAll('.config-select')
    selectInputs.forEach(select => {
      select.addEventListener('change', (e) => {
        const value = e.target.value
        const param = e.target.dataset.param

        this.triggerConfigChange(trackId, param, value)
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

  // Trigger config change callback
  triggerConfigChange (trackId, param, value) {
    // Dispatch custom event that can be listened to by the main panel
    const event = new CustomEvent('luminodeConfigChange', {
      detail: {
        trackId,
        luminode: this.trackManager.getTrack(trackId).luminode,
        param,
        value
      }
    })
    this.panel.dispatchEvent(event)
  }

  normalizeLuminodeName (name) {
    return normalizeLuminodeNameUtil(name)
  }

  getLuminodeSettingsKey (luminode) {
    return getLuminodeSettingsKey(luminode)
  }
}

// Export the shared mapping function for reuse
export { getLuminodeSettingsKey }
