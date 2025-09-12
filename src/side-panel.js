// Side panel UI component for track management
export class SidePanel {
  constructor(trackManager) {
    this.trackManager = trackManager;
    this.isVisible = false;
    this.panel = null;
    this.callbacks = {};
    
    this.initializePanel();
    this.setupEventListeners();
  }

  initializePanel() {
    // Create the side panel container
    this.panel = document.createElement('div');
    this.panel.id = 'sidePanel';
    this.panel.className = 'side-panel';
    
    // Create panel content
    this.panel.innerHTML = `
      <div class="side-panel-header">
        <h3>TRACKS</h3>
        <button id="togglePanel" class="toggle-panel-btn">
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>
      <div class="side-panel-content">
        <div id="tracksContainer" class="tracks-container">
          <!-- Tracks will be dynamically generated -->
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
    const toggleBtn = this.panel.querySelector('#togglePanel');
    toggleBtn.addEventListener('click', () => {
      this.toggle();
    });

    // Track manager events
    this.trackManager.on('trackUpdated', (data) => {
      this.updateTrackUI(data.trackId, data.track);
    });

    this.trackManager.on('midiDeviceAdded', (data) => {
      console.log(`SidePanel: MIDI device added - ${data.device.name}`);
      this.updateMidiDeviceDropdowns();
    });

    this.trackManager.on('midiDeviceRemoved', (data) => {
      this.updateMidiDeviceDropdowns();
    });

    this.trackManager.on('tracksReset', () => {
      this.renderTracks();
    });
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
    this.renderTracks();
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

  // Render all tracks
  renderTracks() {
    const tracksContainer = this.panel.querySelector('#tracksContainer');
    const tracks = this.trackManager.getTracks();
    
    tracksContainer.innerHTML = tracks.map(track => this.createTrackHTML(track)).join('');
    
    // Add event listeners to track elements
    this.attachTrackEventListeners();
  }

  createTrackHTML(track) {
    const midiDevices = this.trackManager.getAvailableMidiDevices();
    const luminodes = this.trackManager.getAvailableLuminodes();
    
    return `
      <div class="track-tile" data-track-id="${track.id}">
        <div class="track-header">
          <div class="track-info">
            <div class="track-number" style="background-color: ${this.getTrackColor(track.id)}">${track.id}</div>
            <div class="track-activity-indicator" id="activity-${track.id}"></div>
          </div>
          <div class="track-controls">
            <button class="mute-btn ${track.muted ? 'active' : ''}" data-action="mute" title="Mute">
              <ion-icon name="volume-mute-outline"></ion-icon>
            </button>
            <button class="solo-btn ${track.solo ? 'active' : ''}" data-action="solo" title="Solo">
              <ion-icon name="radio-outline"></ion-icon>
            </button>
          </div>
        </div>
        
        <div class="track-assignments">
          <div class="assignment-group">
            <label>
              <ion-icon name="grid-outline"></ion-icon>
              MIDI Device
            </label>
            <select class="midi-device-select" data-track-id="${track.id}">
              <option value="">Select Device</option>
              ${midiDevices.map(device => 
                `<option value="${device.id}" ${track.midiDevice === device.id ? 'selected' : ''}>
                  ${device.name}
                </option>`
              ).join('')}
            </select>
          </div>
          
          <div class="assignment-group">
            <label>
              <svg class="luminode-icon" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <style>.cls-1{fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:20px;}</style>
                </defs>
                <g data-name="Layer 2" id="Layer_2">
                  <g data-name="E449, Sine, sound, wave" id="E449_Sine_sound_wave">
                    <circle class="cls-1" cx="256" cy="256" r="246"></circle>
                    <line class="cls-1" x1="70.24" x2="441.76" y1="235.92" y2="235.92"></line>
                    <path class="cls-1" d="M100.37,150.57c77.81,0,77.81,210.86,155.63,210.86s77.82-210.86,155.63-210.86"></path>
                  </g>
                </g>
              </svg>
              Luminode
            </label>
            <select class="luminode-select" data-track-id="${track.id}">
              <option value="">Select Luminode</option>
              ${luminodes.map(luminode => 
                `<option value="${luminode}" ${track.luminode === luminode ? 'selected' : ''}>
                  ${this.normalizeLuminodeName(luminode)}
                </option>`
              ).join('')}
            </select>
          </div>
        </div>
      </div>
    `;
  }

  attachTrackEventListeners() {
    const trackTiles = this.panel.querySelectorAll('.track-tile');
    
    trackTiles.forEach(tile => {
      const trackId = parseInt(tile.dataset.trackId);
      
      // Mute/Solo buttons
      const muteBtn = tile.querySelector('.mute-btn');
      const soloBtn = tile.querySelector('.solo-btn');
      
      muteBtn.addEventListener('click', () => {
        this.trackManager.toggleMute(trackId);
      });
      
      soloBtn.addEventListener('click', () => {
        this.trackManager.toggleSolo(trackId);
      });
      
      // MIDI device selection
      const midiSelect = tile.querySelector('.midi-device-select');
      midiSelect.addEventListener('change', (e) => {
        this.trackManager.setMidiDevice(trackId, e.target.value || null);
      });
      
      // Luminode selection
      const luminodeSelect = tile.querySelector('.luminode-select');
      luminodeSelect.addEventListener('change', (e) => {
        this.trackManager.setLuminode(trackId, e.target.value || null);
      });
    });
  }

  updateTrackUI(trackId, track) {
    const trackTile = this.panel.querySelector(`[data-track-id="${trackId}"]`);
    if (!trackTile) return;
    
    // Update mute/solo button states
    const muteBtn = trackTile.querySelector('.mute-btn');
    const soloBtn = trackTile.querySelector('.solo-btn');
    
    muteBtn.classList.toggle('active', track.muted);
    soloBtn.classList.toggle('active', track.solo);
    
    // Update dropdown selections
    const midiSelect = trackTile.querySelector('.midi-device-select');
    const luminodeSelect = trackTile.querySelector('.luminode-select');
    
    midiSelect.value = track.midiDevice || '';
    luminodeSelect.value = track.luminode || '';
  }

  updateMidiDeviceDropdowns() {
    const tracks = this.trackManager.getTracks();
    const midiDevices = this.trackManager.getAvailableMidiDevices();
    
    console.log(`SidePanel: Updating dropdowns with ${midiDevices.length} devices:`, midiDevices.map(d => d.name));
    
    tracks.forEach(track => {
      const trackTile = this.panel.querySelector(`[data-track-id="${track.id}"]`);
      if (!trackTile) return;
      
      const midiSelect = trackTile.querySelector('.midi-device-select');
      const currentValue = midiSelect.value;
      
      // Update options
      midiSelect.innerHTML = `
        <option value="">Select Device</option>
        ${midiDevices.map(device => 
          `<option value="${device.id}">${device.name}</option>`
        ).join('')}
      `;
      
      // Restore selection if still valid
      if (currentValue && midiDevices.find(d => d.id === currentValue)) {
        midiSelect.value = currentValue;
      } else {
        midiSelect.value = '';
        this.trackManager.setMidiDevice(track.id, null);
      }
    });
  }

  // Update activity indicators
  updateActivityIndicators(activeNotes) {
    const tracks = this.trackManager.getTracks();
    
    tracks.forEach(track => {
      const indicator = this.panel.querySelector(`#activity-${track.id}`);
      if (indicator) {
        const hasActivity = track.luminode && activeNotes[track.luminode] && activeNotes[track.luminode].length > 0;
        indicator.classList.toggle('active', hasActivity);
      }
    });
  }

  // Get track color from Soto palette
  getTrackColor(trackId) {
    const colors = [
      '#EF4136', // Red-orange
      '#005BBB', // Blue
      '#FCEE09', // Yellow
      '#2E7D32'  // Green
    ];
    return colors[(trackId - 1) % colors.length];
  }

  // Normalize luminode names for display
  normalizeLuminodeName(name) {
    const nameMap = {
      'lissajous': 'Lissajous',
      'harmonograph': 'Harmonograph',
      'sphere': 'Sphere',
      'gegoNet': 'Gego Net',
      'gegoShape': 'Gego Shape',
      'sotoGrid': 'Soto Grid',
      'sotoGridRotated': 'Soto Grid Rotated',
      'whitneyLines': 'Whitney Lines',
      'phyllotaxis': 'Phyllotaxis',
      'moireCircles': 'Moire Circles',
      'wovenNet': 'Woven Net',
      'sinewave': 'Sine Wave',
      'triangle': 'Triangle',
      'polygons': 'Polygons'
    };
    return nameMap[name] || name;
  }

  // Public API
  isPanelVisible() {
    return this.isVisible;
  }
}
