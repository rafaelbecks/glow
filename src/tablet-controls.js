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
          <button id="readTabletData" class="tablet-action-btn">
            <ion-icon name="link-outline"></ion-icon>
            Connect Tablet
          </button>
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
            <ion-icon name="color-filter-outline"></ion-icon>
            Visual Mode
          </label>
          <label class="checkbox-container">
            <input id="colorToggle" type="checkbox"/>
            <span class="checkmark"></span>
            Color Mode
          </label>
        </div>
        
        <div class="tablet-config-group">
          <label>
            <ion-icon name="brush-outline"></ion-icon>
            Background Effects
          </label>
          <label class="checkbox-container">
            <input id="backgroundBleedingToggle" type="checkbox" checked/>
            <span class="checkmark"></span>
            Background Bleeding
          </label>
        </div>
        
        <div class="tablet-config-group">
          <label>
            <ion-icon name="layers-outline"></ion-icon>
            Canvas Layer
          </label>
          <div class="radio-container">
            <label class="radio-option">
              <input id="canvasLayerFront" type="radio" name="canvasLayer" value="front" checked/>
              <span class="radio-mark"></span>
              Front
            </label>
            <label class="radio-option">
              <input id="canvasLayerBack" type="radio" name="canvasLayer" value="back"/>
              <span class="radio-mark"></span>
              Back
            </label>
          </div>
          <div class="setting-description">
            Choose whether tablet drawing appears in front of or behind luminodes
          </div>
        </div>
        
        <div class="tablet-config-group">
          <label>
            <ion-icon name="shapes-outline"></ion-icon>
            Geometric Drawing
          </label>
          <label class="checkbox-container">
            <input id="geometricModeToggle" type="checkbox"/>
            <span class="checkmark"></span>
            Enable Shape Detection
          </label>
          <div class="setting-description">
            Automatically convert strokes to geometric shapes (lines, circles, rectangles, triangles)
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
      </div>
    `
  }

  // Setup event listeners for tablet controls
  setupEventListeners (container) {
    const readTabletBtn = container.querySelector('#readTabletData')
    const clearTabletBtn = container.querySelector('#clearTablet')
    const tabletWidthSlider = container.querySelector('#tabletWidth')
    const colorToggle = container.querySelector('#colorToggle')
    const backgroundBleedingToggle = container.querySelector('#backgroundBleedingToggle')
    const canvasLayerFront = container.querySelector('#canvasLayerFront')
    const canvasLayerBack = container.querySelector('#canvasLayerBack')
    const geometricModeToggle = container.querySelector('#geometricModeToggle')
    const shapeDetectionThreshold = container.querySelector('#shapeDetectionThreshold')

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

    if (colorToggle) {
      colorToggle.addEventListener('change', (e) => {
        this.triggerCallback('colorModeChange', e.target.checked)
      })
    }

    if (backgroundBleedingToggle) {
      backgroundBleedingToggle.addEventListener('change', (e) => {
        this.triggerCallback('backgroundBleedingChange', e.target.checked)
      })
    }

    if (canvasLayerFront) {
      canvasLayerFront.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.triggerCallback('canvasLayerChange', 'front')
        }
      })
    }

    if (canvasLayerBack) {
      canvasLayerBack.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.triggerCallback('canvasLayerChange', 'back')
        }
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

  // Toggle geometric settings visibility
  toggleGeometricSettings (enabled, container) {
    const geometricSettings = container.querySelector('#geometricSettings')
    if (geometricSettings) {
      geometricSettings.style.display = enabled ? 'block' : 'none'
    }
  }

  // Update tablet width from external source
  updateTabletWidth (value, container) {
    const slider = container.querySelector('#tabletWidth')
    if (slider) {
      slider.value = value
      this.updateRangeValue(value, container)
    }
  }

  // Update color mode from external source
  updateColorMode (enabled, container) {
    const checkbox = container.querySelector('#colorToggle')
    if (checkbox) {
      checkbox.checked = enabled
    }
  }

  // Update background bleeding from external source
  updateBackgroundBleeding (enabled, container) {
    const checkbox = container.querySelector('#backgroundBleedingToggle')
    if (checkbox) {
      checkbox.checked = enabled
    }
  }

  // Update canvas layer from external source
  updateCanvasLayer (layer, container) {
    const frontRadio = container.querySelector('#canvasLayerFront')
    const backRadio = container.querySelector('#canvasLayerBack')
    if (frontRadio && backRadio) {
      if (layer === 'front') {
        frontRadio.checked = true
        backRadio.checked = false
      } else if (layer === 'back') {
        frontRadio.checked = false
        backRadio.checked = true
      }
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

  // Update shape detection threshold from external source
  updateShapeDetectionThreshold (value, container) {
    const slider = container.querySelector('#shapeDetectionThreshold')
    if (slider) {
      slider.value = value
      this.updateRangeValue(value, container, 'shapeDetectionThreshold')
    }
  }
}
