// Track management system for DAW-style interface
export class TrackManager {
  constructor () {
    this.tracks = [
      { id: 1, name: 'Track 1', muted: false, solo: false, midiDevice: null, luminode: 'lissajous', layout: { x: 0, y: 0, rotation: 0 } },
      { id: 2, name: 'Track 2', muted: false, solo: false, midiDevice: null, luminode: 'harmonograph', layout: { x: 0, y: 0, rotation: 0 } },
      { id: 3, name: 'Track 3', muted: false, solo: false, midiDevice: null, luminode: 'sphere', layout: { x: 0, y: 0, rotation: 0 } },
      { id: 4, name: 'Track 4', muted: false, solo: false, midiDevice: null, luminode: 'gegoNet', layout: { x: 0, y: 0, rotation: 0 } }
    ]

    this.availableLuminodes = [
      'lissajous', 'harmonograph', 'sphere', 'gegoNet', 'gegoShape',
      'sotoGrid', 'sotoGridRotated', 'whitneyLines', 'phyllotaxis',
      'moireCircles', 'wovenNet', 'sinewave', 'triangle', 'polygons'
    ]

    this.availableMidiDevices = new Map()
    this.midiInputs = new Map()
    this.callbacks = {}
  }

  // Callback system for track events
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

  // Track management
  getTracks () {
    return this.tracks
  }

  getTrack (trackId) {
    return this.tracks.find(track => track.id === trackId)
  }

  updateTrack (trackId, updates) {
    const track = this.getTrack(trackId)
    if (track) {
      Object.assign(track, updates)
      this.triggerCallback('trackUpdated', { trackId, track })
    }
  }

  toggleMute (trackId) {
    const track = this.getTrack(trackId)
    if (track) {
      track.muted = !track.muted
      if (track.muted && track.solo) {
        track.solo = false // Un-solo when muting
      }
      this.triggerCallback('trackUpdated', { trackId, track })
    }
  }

  toggleSolo (trackId) {
    const track = this.getTrack(trackId)
    if (track) {
      track.solo = !track.solo
      if (track.solo && track.muted) {
        track.muted = false // Un-mute when soloing
      }
      this.triggerCallback('trackUpdated', { trackId, track })
    }
  }

  setMidiDevice (trackId, deviceId) {
    const track = this.getTrack(trackId)
    if (track) {
      track.midiDevice = deviceId
      this.triggerCallback('trackUpdated', { trackId, track })
    }
  }

  setLuminode (trackId, luminode) {
    const track = this.getTrack(trackId)
    if (track) {
      track.luminode = luminode
      this.triggerCallback('trackUpdated', { trackId, track })
    }
  }

  setLayout (trackId, layoutUpdates) {
    const track = this.getTrack(trackId)
    if (track) {
      track.layout = { ...track.layout, ...layoutUpdates }
      this.triggerCallback('trackUpdated', { trackId, track })
    }
  }

  // MIDI device management
  addMidiDevice (deviceId, device) {
    this.availableMidiDevices.set(deviceId, device)
    this.midiInputs.set(deviceId, device)
    console.log(`TrackManager: Added MIDI device ${device.name} (${deviceId})`)
    this.triggerCallback('midiDeviceAdded', { deviceId, device })
  }

  removeMidiDevice (deviceId) {
    this.availableMidiDevices.delete(deviceId)
    this.midiInputs.delete(deviceId)
    this.triggerCallback('midiDeviceRemoved', { deviceId })
  }

  getAvailableMidiDevices () {
    return Array.from(this.availableMidiDevices.entries()).map(([id, device]) => ({
      id,
      name: device.name,
      manufacturer: device.manufacturer
    }))
  }

  getAvailableLuminodes () {
    return this.availableLuminodes
  }

  // Get active tracks (not muted, or soloed)
  getActiveTracks () {
    const hasSolo = this.tracks.some(track => track.solo)

    if (hasSolo) {
      return this.tracks.filter(track => track.solo)
    } else {
      return this.tracks.filter(track => !track.muted)
    }
  }

  // Get MIDI data for a specific track
  getMidiDataForTrack (trackId) {
    const track = this.getTrack(trackId)
    if (!track || !track.midiDevice || !track.luminode) {
      return []
    }

    const midiInput = this.midiInputs.get(track.midiDevice)
    if (!midiInput) {
      return []
    }

    // This would be populated by the MIDI manager
    return midiInput.activeNotes || []
  }

  // Get all active MIDI data organized by luminode
  getAllActiveMidiData () {
    const activeTracks = this.getActiveTracks()
    const midiData = {}

    activeTracks.forEach(track => {
      if (track.luminode && track.midiDevice) {
        const data = this.getMidiDataForTrack(track.id)
        if (data.length > 0) {
          midiData[track.luminode] = data
        }
      }
    })

    return midiData
  }

  // Reset all tracks
  resetTracks () {
    this.tracks.forEach(track => {
      track.muted = false
      track.solo = false
      track.midiDevice = null
      track.luminode = null
    })
    this.triggerCallback('tracksReset')
  }
}
