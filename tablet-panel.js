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
  updateRangeValue(value) {
    const rangeValue = this.panel.querySelector('.range-value');
    if (rangeValue) {
      rangeValue.textContent = value;
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

  // Public API
  isPanelVisible() {
    return this.isVisible;
  }
}
