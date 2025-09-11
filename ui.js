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
      panelToggleButton: document.getElementById('panelToggleButton'),
      tabletPanelToggleButton: document.getElementById('tabletPanelToggleButton'),
      infoButton: document.getElementById('infoButton'),
      infoModal: document.getElementById('infoModal'),
      infoModalClose: document.getElementById('infoModalClose'),
      infoModalBody: document.getElementById('infoModalBody'),
      readTabletData: document.getElementById('readTabletData'),
      clearTablet: document.getElementById('clearTablet'),
      tabletWidth: document.getElementById('tabletWidth'),
      colorToggle: document.getElementById('colorToggle'),
      logoContainer: document.getElementById('logoContainer')
    };
    
    this.statusVisible = false;
  }

  setupEventListeners() {
    // Start button
    if (this.elements.startButton) {
      this.elements.startButton.addEventListener('click', () => {
        this.triggerCallback('startVisualizer');
      });
    }
    // Panel toggle button
    if (this.elements.panelToggleButton) {
      this.elements.panelToggleButton.addEventListener('click', () => {
        this.triggerCallback('togglePanel');
      });
    }

    // Tablet panel toggle button
    if (this.elements.tabletPanelToggleButton) {
      this.elements.tabletPanelToggleButton.addEventListener('click', () => {
        this.triggerCallback('toggleTabletPanel');
      });
    }

    // Info button
    if (this.elements.infoButton) {
      this.elements.infoButton.addEventListener('click', () => {
        this.showInfoModal();
      });
    }

    // Info modal close button
    if (this.elements.infoModalClose) {
      this.elements.infoModalClose.addEventListener('click', () => {
        this.hideInfoModal();
      });
    }

    // Close modal when clicking outside
    if (this.elements.infoModal) {
      this.elements.infoModal.addEventListener('click', (e) => {
        if (e.target === this.elements.infoModal) {
          this.hideInfoModal();
        }
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
      } else if (e.key === 'p' || e.key === 'P') {
        this.triggerCallback('togglePanel');
      } else if (e.key >= '1' && e.key <= '4') {
        const trackId = parseInt(e.key);
        if (e.ctrlKey || e.metaKey) {
          if (e.shiftKey) {
            this.triggerCallback('toggleSolo', trackId);
          } else {
            this.triggerCallback('toggleMute', trackId);
          }
        }
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

  showPanelToggleButton() {
    if (this.elements.panelToggleButton) {
      this.elements.panelToggleButton.style.display = 'flex';
    }
  }

  hidePanelToggleButton() {
    if (this.elements.panelToggleButton) {
      this.elements.panelToggleButton.style.display = 'none';
    }
  }

  setPanelToggleActive(active) {
    if (this.elements.panelToggleButton) {
      this.elements.panelToggleButton.classList.toggle('active', active);
    }
  }

  showTabletPanelToggleButton() {
    if (this.elements.tabletPanelToggleButton) {
      this.elements.tabletPanelToggleButton.style.display = 'flex';
    }
  }

  hideTabletPanelToggleButton() {
    if (this.elements.tabletPanelToggleButton) {
      this.elements.tabletPanelToggleButton.style.display = 'none';
    }
  }

  setTabletPanelToggleActive(active) {
    if (this.elements.tabletPanelToggleButton) {
      this.elements.tabletPanelToggleButton.classList.toggle('active', active);
    }
  }

  showInfoButton() {
    if (this.elements.infoButton) {
      this.elements.infoButton.style.display = 'flex';
    }
  }

  hideInfoButton() {
    if (this.elements.infoButton) {
      this.elements.infoButton.style.display = 'none';
    }
  }

  async showInfoModal() {
    if (this.elements.infoModal && this.elements.infoModalBody) {
      // Load and parse the markdown content
      try {
        const response = await fetch('USER_MANUAL.md');
        const markdownContent = await response.text();
        
        // Use marked to convert markdown to HTML
        if (typeof marked !== 'undefined') {
          const htmlContent = marked.parse(markdownContent);
          this.elements.infoModalBody.innerHTML = htmlContent;
        } else {
          // Fallback if marked is not loaded
          this.elements.infoModalBody.innerHTML = '<p>Error loading content. Please refresh the page.</p>';
        }
      } catch (error) {
        console.error('Error loading user manual:', error);
        this.elements.infoModalBody.innerHTML = '<p>Error loading content. Please check if USER_MANUAL.md exists.</p>';
      }
      
      this.elements.infoModal.classList.add('show');
    }
  }

  hideInfoModal() {
    if (this.elements.infoModal) {
      this.elements.infoModal.classList.remove('show');
    }
  }
}
