// Canvas controls UI management
import { UTILS } from '../settings.js'

export class CanvasUIManager {
  constructor (panel) {
    this.panel = panel
    this.settings = null
  }

  // Set settings reference
  setSettings (settings) {
    this.settings = settings
  }

  // Render canvas and color controls
  renderCanvasControls () {
    const canvasControlsContainer = this.panel.querySelector('#canvasControlsContainer')
    if (canvasControlsContainer) {
      canvasControlsContainer.innerHTML = this.createCanvasControlsHTML()
      this.setupCanvasControlsEventListeners(canvasControlsContainer)
    }
  }

  // Create canvas and color controls HTML
  createCanvasControlsHTML () {
    const settings = this.settings || {}
    const canvasSettings = settings.CANVAS || { CLEAR_ALPHA: 0.5, BACKGROUND_COLOR: '#000', CRT_MODE: false, CRT_INTENSITY: 100 }
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
          
          <div class="tablet-config-group">
            <label>
              <ion-icon name="tv-outline"></ion-icon>
              CRT Mode
            </label>
            <label class="checkbox-container">
              <input type="checkbox" 
                     id="crtMode" 
                     ${canvasSettings.CRT_MODE ? 'checked' : ''}
                     class="config-checkbox">
              <span class="checkmark"></span>
              Enable CRT Effect
            </label>
            <div class="setting-description">
              Adds vintage CRT monitor effect with scanlines and flickering
            </div>
          </div>
          
          <div class="tablet-config-group" id="crtIntensityGroup" style="${canvasSettings.CRT_MODE ? 'display: block;' : 'display: none;'}">
            <label>
              <ion-icon name="contrast-outline"></ion-icon>
              CRT Intensity
            </label>
            <div class="range-container">
              <input type="range" 
                     id="crtIntensity" 
                     min="80" 
                     max="200" 
                     step="5" 
                     value="${canvasSettings.CRT_INTENSITY || 100}">
              <span class="range-value">${canvasSettings.CRT_INTENSITY || 100}%</span>
            </div>
            <div class="setting-description">
              Controls the strength of the CRT effect (80% = subtle, 200% = maximum)
            </div>
          </div>
          
          <div class="tablet-config-group">
            <label>
              <ion-icon name="blur-outline"></ion-icon>
              Lumia Effect
            </label>
            <div class="range-container">
              <input type="range" 
                     id="lumiaEffect" 
                     min="0" 
                     max="100" 
                     step="5" 
                     value="${canvasSettings.LUMIA_EFFECT || 0}">
              <span class="range-value">${canvasSettings.LUMIA_EFFECT || 0}px</span>
            </div>
            <div class="setting-description">
              Applies blur effect to all luminodes (0 = no blur, 100px = maximum blur)
            </div>
          </div>
          
          <div class="tablet-config-group">
            <label>
              <ion-icon name="grid-outline"></ion-icon>
              Background Grid
            </label>
            <label class="checkbox-container">
              <input type="checkbox" 
                     id="gridEnabled" 
                     ${canvasSettings.GRID_ENABLED ? 'checked' : ''}
                     class="config-checkbox">
              <span class="checkmark"></span>
              Enable Grid
            </label>
            <div class="setting-description">
              Shows a configurable grid overlay on the canvas background
            </div>
          </div>
          
          <div class="tablet-config-group" id="gridSettingsGroup" style="${canvasSettings.GRID_ENABLED ? 'display: block;' : 'display: none;'}">
            <div class="grid-controls">
              <div class="grid-control-row">
                <div class="grid-control">
                  <label for="gridXLines">X Lines</label>
                  <div class="slider-container">
                    <input type="range" 
                           id="gridXLines" 
                           class="config-slider"
                           min="2" 
                           max="50" 
                           step="1" 
                           value="${canvasSettings.GRID_X_LINES || 10}">
                    <span class="slider-value">${canvasSettings.GRID_X_LINES || 10}</span>
                  </div>
                </div>
                <div class="grid-control">
                  <label for="gridYLines">Y Lines</label>
                  <div class="slider-container">
                    <input type="range" 
                           id="gridYLines" 
                           class="config-slider"
                           min="2" 
                           max="50" 
                           step="1" 
                           value="${canvasSettings.GRID_Y_LINES || 10}">
                    <span class="slider-value">${canvasSettings.GRID_Y_LINES || 10}</span>
                  </div>
                </div>
              </div>
              <div class="grid-control-row">
                <div class="grid-control">
                  <label for="gridColor">Grid Color</label>
                  <input type="color" 
                         id="gridColor" 
                         value="${canvasSettings.GRID_COLOR || '#333333'}"
                         class="color-picker">
                </div>
              </div>
            </div>
          </div>
          
          <div class="tablet-config-group">
            <label>
              <ion-icon name="radio-outline"></ion-icon>
              Noise Overlay
            </label>
            <label class="checkbox-container">
              <input type="checkbox" 
                     id="noiseOverlay" 
                     ${canvasSettings.NOISE_OVERLAY ? 'checked' : ''}
                     class="config-checkbox">
              <span class="checkmark"></span>
              Enable Noise Effect
            </label>
            <div class="setting-description">
              Adds animated grain texture overlay on top of the canvas
            </div>
          </div>
          
          <div class="tablet-config-group" id="noiseSettingsGroup" style="${canvasSettings.NOISE_OVERLAY ? 'display: block;' : 'display: none;'}">
            <div class="noise-controls">
              <div class="noise-control-row">
                <div class="noise-control">
                  <label for="noiseAnimate">Animate</label>
                  <label class="checkbox-container">
                    <input type="checkbox" 
                           id="noiseAnimate" 
                           ${canvasSettings.NOISE_ANIMATE ? 'checked' : ''}
                           class="config-checkbox">
                    <span class="checkmark"></span>
                    Animated Noise
                  </label>
                </div>
                <div class="noise-control">
                  <label for="noiseOpacity">Opacity</label>
                  <div class="slider-container">
                    <input type="range" 
                           id="noiseOpacity" 
                           class="config-slider"
                           min="0.01" 
                           max="0.2" 
                           step="0.01" 
                           value="${canvasSettings.NOISE_OPACITY || 0.05}">
                    <span class="slider-value">${Math.round((canvasSettings.NOISE_OPACITY || 0.05) * 100)}%</span>
                  </div>
                </div>
              </div>
              
              <div class="noise-control-row">
                <div class="noise-control">
                  <label for="noisePatternWidth">Pattern Width</label>
                  <div class="slider-container">
                    <input type="range" 
                           id="noisePatternWidth" 
                           class="config-slider"
                           min="50" 
                           max="200" 
                           step="10" 
                           value="${canvasSettings.NOISE_PATTERN_WIDTH || 100}">
                    <span class="slider-value">${canvasSettings.NOISE_PATTERN_WIDTH || 100}px</span>
                  </div>
                </div>
                <div class="noise-control">
                  <label for="noisePatternHeight">Pattern Height</label>
                  <div class="slider-container">
                    <input type="range" 
                           id="noisePatternHeight" 
                           class="config-slider"
                           min="50" 
                           max="200" 
                           step="10" 
                           value="${canvasSettings.NOISE_PATTERN_HEIGHT || 100}">
                    <span class="slider-value">${canvasSettings.NOISE_PATTERN_HEIGHT || 100}px</span>
                  </div>
                </div>
              </div>
              
              <div class="noise-control-row">
                <div class="noise-control">
                  <label for="noiseDensity">Density</label>
                  <div class="slider-container">
                    <input type="range" 
                           id="noiseDensity" 
                           class="config-slider"
                           min="0.5" 
                           max="2" 
                           step="0.1" 
                           value="${canvasSettings.NOISE_DENSITY || 1}">
                    <span class="slider-value">${canvasSettings.NOISE_DENSITY || 1}</span>
                  </div>
                </div>
                <div class="noise-control">
                  <label for="noiseWidth">Grain Width</label>
                  <div class="slider-container">
                    <input type="range" 
                           id="noiseWidth" 
                           class="config-slider"
                           min="0.5" 
                           max="3" 
                           step="0.1" 
                           value="${canvasSettings.NOISE_WIDTH || 1}">
                    <span class="slider-value">${canvasSettings.NOISE_WIDTH || 1}px</span>
                  </div>
                </div>
              </div>
              
              <div class="noise-control-row">
                <div class="noise-control">
                  <label for="noiseHeight">Grain Height</label>
                  <div class="slider-container">
                    <input type="range" 
                           id="noiseHeight" 
                           class="config-slider"
                           min="0.5" 
                           max="3" 
                           step="0.1" 
                           value="${canvasSettings.NOISE_HEIGHT || 1}">
                    <span class="slider-value">${canvasSettings.NOISE_HEIGHT || 1}px</span>
                  </div>
                </div>
              </div>
            </div>
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
        this.triggerCanvasSettingChange('CLEAR_ALPHA', value)
      })
    }

    // Background color picker
    const backgroundColorPicker = container.querySelector('#backgroundColor')
    if (backgroundColorPicker) {
      backgroundColorPicker.addEventListener('change', (e) => {
        this.triggerCanvasSettingChange('BACKGROUND_COLOR', e.target.value)
      })
    }

    // CRT mode checkbox
    const crtModeCheckbox = container.querySelector('#crtMode')
    if (crtModeCheckbox) {
      crtModeCheckbox.addEventListener('change', (e) => {
        const isEnabled = e.target.checked
        this.triggerCanvasSettingChange('CRT_MODE', isEnabled)

        // Show/hide intensity slider based on CRT mode
        const intensityGroup = container.querySelector('#crtIntensityGroup')
        if (intensityGroup) {
          intensityGroup.style.display = isEnabled ? 'block' : 'none'
        }
      })
    }

    // CRT intensity slider
    const crtIntensitySlider = container.querySelector('#crtIntensity')
    if (crtIntensitySlider) {
      crtIntensitySlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.range-value')
        if (valueDisplay) {
          valueDisplay.textContent = `${value}%`
        }
        this.triggerCanvasSettingChange('CRT_INTENSITY', value)
      })
    }

    // Lumia Effect slider
    const lumiaEffectSlider = container.querySelector('#lumiaEffect')
    if (lumiaEffectSlider) {
      lumiaEffectSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.range-value')
        if (valueDisplay) {
          valueDisplay.textContent = `${value}px`
        }
        this.triggerCanvasSettingChange('LUMIA_EFFECT', value)
      })
    }

    // Grid enabled checkbox
    const gridEnabledCheckbox = container.querySelector('#gridEnabled')
    if (gridEnabledCheckbox) {
      gridEnabledCheckbox.addEventListener('change', (e) => {
        const isEnabled = e.target.checked
        this.triggerCanvasSettingChange('GRID_ENABLED', isEnabled)

        // Show/hide grid settings based on enabled state
        const gridSettingsGroup = container.querySelector('#gridSettingsGroup')
        if (gridSettingsGroup) {
          gridSettingsGroup.style.display = isEnabled ? 'block' : 'none'
        }
      })
    }

    // Grid X lines slider
    const gridXLinesSlider = container.querySelector('#gridXLines')
    if (gridXLinesSlider) {
      gridXLinesSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = value
        }
        this.triggerCanvasSettingChange('GRID_X_LINES', value)
      })
    }

    // Grid Y lines slider
    const gridYLinesSlider = container.querySelector('#gridYLines')
    if (gridYLinesSlider) {
      gridYLinesSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = value
        }
        this.triggerCanvasSettingChange('GRID_Y_LINES', value)
      })
    }

    // Grid color picker
    const gridColorPicker = container.querySelector('#gridColor')
    if (gridColorPicker) {
      gridColorPicker.addEventListener('change', (e) => {
        this.triggerCanvasSettingChange('GRID_COLOR', e.target.value)
      })
    }

    // Palette color pickers
    const paletteColors = container.querySelectorAll('.palette-color')
    paletteColors.forEach(picker => {
      picker.addEventListener('change', (e) => {
        const palette = e.target.dataset.palette
        const index = parseInt(e.target.dataset.index)
        this.triggerColorPaletteChange(palette, index, e.target.value)
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
        this.triggerPitchColorFactorChange(value)
      })
    }

    // Noise overlay checkbox
    const noiseOverlayCheckbox = container.querySelector('#noiseOverlay')
    if (noiseOverlayCheckbox) {
      noiseOverlayCheckbox.addEventListener('change', (e) => {
        const isEnabled = e.target.checked
        this.triggerCanvasSettingChange('NOISE_OVERLAY', isEnabled)

        // Show/hide noise settings based on enabled state
        const noiseSettingsGroup = container.querySelector('#noiseSettingsGroup')
        if (noiseSettingsGroup) {
          noiseSettingsGroup.style.display = isEnabled ? 'block' : 'none'
        }
      })
    }

    // Noise animate checkbox
    const noiseAnimateCheckbox = container.querySelector('#noiseAnimate')
    if (noiseAnimateCheckbox) {
      noiseAnimateCheckbox.addEventListener('change', (e) => {
        this.triggerCanvasSettingChange('NOISE_ANIMATE', e.target.checked)
      })
    }

    // Noise opacity slider
    const noiseOpacitySlider = container.querySelector('#noiseOpacity')
    if (noiseOpacitySlider) {
      noiseOpacitySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = `${Math.round(value * 100)}%`
        }
        this.triggerCanvasSettingChange('NOISE_OPACITY', value)
      })
    }

    // Noise pattern width slider
    const noisePatternWidthSlider = container.querySelector('#noisePatternWidth')
    if (noisePatternWidthSlider) {
      noisePatternWidthSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = `${value}px`
        }
        this.triggerCanvasSettingChange('NOISE_PATTERN_WIDTH', value)
      })
    }

    // Noise pattern height slider
    const noisePatternHeightSlider = container.querySelector('#noisePatternHeight')
    if (noisePatternHeightSlider) {
      noisePatternHeightSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = `${value}px`
        }
        this.triggerCanvasSettingChange('NOISE_PATTERN_HEIGHT', value)
      })
    }

    // Noise density slider
    const noiseDensitySlider = container.querySelector('#noiseDensity')
    if (noiseDensitySlider) {
      noiseDensitySlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = value
        }
        this.triggerCanvasSettingChange('NOISE_DENSITY', value)
      })
    }

    // Noise width slider
    const noiseWidthSlider = container.querySelector('#noiseWidth')
    if (noiseWidthSlider) {
      noiseWidthSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = `${value}px`
        }
        this.triggerCanvasSettingChange('NOISE_WIDTH', value)
      })
    }

    // Noise height slider
    const noiseHeightSlider = container.querySelector('#noiseHeight')
    if (noiseHeightSlider) {
      noiseHeightSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value)
        const valueDisplay = e.target.parentElement.querySelector('.slider-value')
        if (valueDisplay) {
          valueDisplay.textContent = `${value}px`
        }
        this.triggerCanvasSettingChange('NOISE_HEIGHT', value)
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

  // Event trigger methods
  triggerCanvasSettingChange (setting, value) {
    const event = new CustomEvent('canvasSettingChange', {
      detail: { setting, value }
    })
    this.panel.dispatchEvent(event)
  }

  triggerColorPaletteChange (palette, index, color) {
    const event = new CustomEvent('colorPaletteChange', {
      detail: { palette, index, color }
    })
    this.panel.dispatchEvent(event)
  }

  triggerPitchColorFactorChange (value) {
    const event = new CustomEvent('pitchColorFactorChange', {
      detail: { value }
    })
    this.panel.dispatchEvent(event)
  }
}
