// UI controls and event listeners
export class UIManager {
  constructor() {
    this.elements = {};
    this.callbacks = {};
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.elements = {
      startButton: document.getElementById('startButton'),
      settingsButton: document.getElementById('settingsButton'),
      controls: document.getElementById('controls'),
      readTabletData: document.getElementById('readTabletData'),
      clearTablet: document.getElementById('clearTablet'),
      tabletWidth: document.getElementById('tabletWidth'),
      colorToggle: document.getElementById('colorToggle'),
      logoContainer: document.getElementById('logoContainer')
    };
    
    this.statusVisible = false;
    this.controlsVisible = false;
  }

  setupEventListeners() {
    // Start button
    if (this.elements.startButton) {
      this.elements.startButton.addEventListener('click', () => {
        this.triggerCallback('startVisualizer');
      });
    }

    // Settings button
    if (this.elements.settingsButton) {
      this.elements.settingsButton.addEventListener('click', () => {
        this.toggleControls();
      });
    }

    // Tablet controls
    if (this.elements.readTabletData) {
      this.elements.readTabletData.addEventListener('click', () => {
        this.triggerCallback('connectTablet');
      });
    }

    if (this.elements.clearTablet) {
      this.elements.clearTablet.addEventListener('click', () => {
        this.triggerCallback('clearTablet');
      });
    }

    if (this.elements.tabletWidth) {
      this.elements.tabletWidth.addEventListener('input', (e) => {
        this.triggerCallback('tabletWidthChange', parseInt(e.target.value));
      });
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'c') {
        this.triggerCallback('clearCanvas');
      }
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.triggerCallback('resize');
    });
  }

  // Callback system for UI events
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

  // UI state management
  hideStartButton() {
    if (this.elements.startButton) {
      this.elements.startButton.style.display = 'none';
    }
  }

  showStartButton() {
    if (this.elements.startButton) {
      this.elements.startButton.style.display = 'block';
    }
  }

  // Get current UI state
  getColorMode() {
    return this.elements.colorToggle ? this.elements.colorToggle.checked : false;
  }

  getTabletWidth() {
    return this.elements.tabletWidth ? parseInt(this.elements.tabletWidth.value) : 4;
  }

  // Update UI elements
  updateTabletWidth(value) {
    if (this.elements.tabletWidth) {
      this.elements.tabletWidth.value = value;
    }
  }

  // Add status indicator
  showStatus(message, type = 'info') {
    if (!this.statusVisible) return;
    
    // Create or update status element
    let statusEl = document.getElementById('status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'status';
      statusEl.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        color: white;
        background: rgba(0,0,0,0.7);
        padding: 10px;
        border-radius: 5px;
        z-index: 100;
        font-family: monospace;
      `;
      document.body.appendChild(statusEl);
    }

    statusEl.textContent = message;
    statusEl.style.color = type === 'error' ? '#ff6b6b' : 
                          type === 'success' ? '#51cf66' : 'white';
  }

  hideStatus() {
    const statusEl = document.getElementById('status');
    if (statusEl) {
      statusEl.remove();
    }
    this.statusVisible = false;
  }


  toggleControls() {
    if (this.controlsVisible) {
      this.hideControls();
    } else {
      this.showControls();
    }
  }

  showControls() {
    if (this.elements.controls) {
      this.elements.controls.style.display = 'flex';
      this.controlsVisible = true;
    }
  }

  hideControls() {
    if (this.elements.controls) {
      this.elements.controls.style.display = 'none';
      this.controlsVisible = false;
    }
  }

  showSettingsButton() {
    if (this.elements.settingsButton) {
      this.elements.settingsButton.style.display = 'block';
    }
  }

  hideSettingsButton() {
    if (this.elements.settingsButton) {
      this.elements.settingsButton.style.display = 'none';
    }
  }

  showLogoContainer() {
    if (this.elements.logoContainer) {
      this.elements.logoContainer.style.display = 'flex';
    }
  }

  hideLogoContainer() {
    if (this.elements.logoContainer) {
      this.elements.logoContainer.style.display = 'none';
    }
  }
}
