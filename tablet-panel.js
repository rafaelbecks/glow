// Tablet configuration panel component
export class TabletPanel {
  constructor(tabletManager) {
    this.tabletManager = tabletManager;
    this.isVisible = false;
    this.panel = null;
    this.callbacks = {};
    
    this.initializePanel();
    this.setupEventListeners();
  }

  initializePanel() {
    // Create the tablet panel container
    this.panel = document.createElement('div');
    this.panel.id = 'tabletPanel';
    this.panel.className = 'tablet-panel';
    
    // Create panel content
    this.panel.innerHTML = `
      <div class="tablet-panel-header">
        <h3>TABLET</h3>
        <button id="toggleTabletPanel" class="toggle-panel-btn">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>
      <div class="tablet-panel-content">
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
              <ion-icon name="tune-outline"></ion-icon>
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
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(this.panel);
    
    // Initially hidden
    this.hide();
  }

  setupEventListeners() {
    // Toggle panel visibility
    const toggleBtn = this.panel.querySelector('#toggleTabletPanel');
    toggleBtn.addEventListener('click', () => {
      this.toggle();
    });

    // Tablet controls
    const readTabletBtn = this.panel.querySelector('#readTabletData');
    const clearTabletBtn = this.panel.querySelector('#clearTablet');
    const tabletWidthSlider = this.panel.querySelector('#tabletWidth');
    const colorToggle = this.panel.querySelector('#colorToggle');
    const backgroundBleedingToggle = this.panel.querySelector('#backgroundBleedingToggle');
    const canvasLayerFront = this.panel.querySelector('#canvasLayerFront');
    const canvasLayerBack = this.panel.querySelector('#canvasLayerBack');
    const geometricModeToggle = this.panel.querySelector('#geometricModeToggle');
    const shapeDetectionThreshold = this.panel.querySelector('#shapeDetectionThreshold');

    if (readTabletBtn) {
      readTabletBtn.addEventListener('click', () => {
        this.triggerCallback('connectTablet');
      });
    }

    if (clearTabletBtn) {
      clearTabletBtn.addEventListener('click', () => {
        this.triggerCallback('clearTablet');
      });
    }

    if (tabletWidthSlider) {
      tabletWidthSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        this.updateRangeValue(value);
        this.triggerCallback('tabletWidthChange', value);
      });
    }

    if (colorToggle) {
      colorToggle.addEventListener('change', (e) => {
        this.triggerCallback('colorModeChange', e.target.checked);
      });
    }

    if (backgroundBleedingToggle) {
      backgroundBleedingToggle.addEventListener('change', (e) => {
        this.triggerCallback('backgroundBleedingChange', e.target.checked);
      });
    }

    if (canvasLayerFront) {
      canvasLayerFront.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.triggerCallback('canvasLayerChange', 'front');
        }
      });
    }

    if (canvasLayerBack) {
      canvasLayerBack.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.triggerCallback('canvasLayerChange', 'back');
        }
      });
    }

    if (geometricModeToggle) {
      geometricModeToggle.addEventListener('change', (e) => {
        this.toggleGeometricSettings(e.target.checked);
        this.triggerCallback('geometricModeChange', e.target.checked);
      });
    }

    if (shapeDetectionThreshold) {
      shapeDetectionThreshold.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        this.updateRangeValue(value, 'shapeDetectionThreshold');
        this.triggerCallback('shapeDetectionThresholdChange', value);
      });
    }
  }

  // Callback system
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  triggerCallback(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }

  // Panel visibility
  show() {
    this.panel.classList.add('visible');
    this.isVisible = true;
  }

  hide() {
    this.panel.classList.remove('visible');
    this.isVisible = false;
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  // Update range value display
  updateRangeValue(value, selector = null) {
    if (selector) {
      const rangeValue = this.panel.querySelector(`#${selector}`).parentElement.querySelector('.range-value');
      if (rangeValue) {
        rangeValue.textContent = value.toFixed(1);
      }
    } else {
      const rangeValue = this.panel.querySelector('.range-value');
      if (rangeValue) {
        rangeValue.textContent = value;
      }
    }
  }

  // Toggle geometric settings visibility
  toggleGeometricSettings(enabled) {
    const geometricSettings = this.panel.querySelector('#geometricSettings');
    if (geometricSettings) {
      geometricSettings.style.display = enabled ? 'block' : 'none';
    }
  }

  // Update tablet width from external source
  updateTabletWidth(value) {
    const slider = this.panel.querySelector('#tabletWidth');
    if (slider) {
      slider.value = value;
      this.updateRangeValue(value);
    }
  }

  // Update color mode from external source
  updateColorMode(enabled) {
    const checkbox = this.panel.querySelector('#colorToggle');
    if (checkbox) {
      checkbox.checked = enabled;
    }
  }

  // Update background bleeding from external source
  updateBackgroundBleeding(enabled) {
    const checkbox = this.panel.querySelector('#backgroundBleedingToggle');
    if (checkbox) {
      checkbox.checked = enabled;
    }
  }

  // Update canvas layer from external source
  updateCanvasLayer(layer) {
    const frontRadio = this.panel.querySelector('#canvasLayerFront');
    const backRadio = this.panel.querySelector('#canvasLayerBack');
    if (frontRadio && backRadio) {
      if (layer === 'front') {
        frontRadio.checked = true;
        backRadio.checked = false;
      } else if (layer === 'back') {
        frontRadio.checked = false;
        backRadio.checked = true;
      }
    }
  }

  // Update geometric mode from external source
  updateGeometricMode(enabled) {
    const checkbox = this.panel.querySelector('#geometricModeToggle');
    if (checkbox) {
      checkbox.checked = enabled;
      this.toggleGeometricSettings(enabled);
    }
  }

  // Update shape detection threshold from external source
  updateShapeDetectionThreshold(value) {
    const slider = this.panel.querySelector('#shapeDetectionThreshold');
    if (slider) {
      slider.value = value;
      this.updateRangeValue(value, 'shapeDetectionThreshold');
    }
  }

  // Public API
  isPanelVisible() {
    return this.isVisible;
  }
}
