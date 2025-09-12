// MIDI event handling and device management
import { SETTINGS, MIDI_CHANNELS } from './settings.js'

export class MIDIManager {
  constructor (trackManager = null) {
    this.trackManager = trackManager
    this.activeNotes = {
      lissajous: [],
      harmonograph: [],
      sphere: [],
      gegoNet: [],
      sinewave: [],
      triangle: [],
      moireCircles: [],
      gegoShape: [],
      sotoGrid: [],
      sotoGridRotated: [],
      phyllotaxis: [],
      wovenNet: [],
      polygons: [],
      whitneyLines: []
    }

    this.inputs = new Map()
    this.deviceToChannelMap = new Map() // Maps device ID to channel name
    this.trackInputs = new Map() // Maps device ID to input for track system
  }

  noteOn (channel, midi, velocity) {
    const list = this.activeNotes[channel]
    if (!list.some(n => n.midi === midi)) {
      list.push({
        midi,
        velocity: velocity / SETTINGS.MIDI.VELOCITY_MAX, // Normalize to 0-1
        timestamp: performance.now()
      })
    }
  }

  noteOff (channel, midi) {
    const list = this.activeNotes[channel]
    const index = list.findIndex(n => n.midi === midi)
    if (index !== -1) {
      list.splice(index, 1)
    }
  }

  getActiveNotes (channel) {
    return this.activeNotes[channel] || []
  }

  getAllActiveNotes () {
    return this.activeNotes
  }

  async setupMIDI () {
    try {
      const access = await navigator.requestMIDIAccess()

      for (const input of access.inputs.values()) {
        const name = input.name.toLowerCase()
        let channel = null

        // Find matching channel based on device name
        // Sort by length (longest first) to match "bus 10" before "bus 1"
        const sortedEntries = Object.entries(MIDI_CHANNELS).sort((a, b) => b[0].length - a[0].length)
        for (const [busName, channelName] of sortedEntries) {
          if (name.includes(busName)) {
            channel = channelName
            break
          }
        }

        // Store input reference (even if no channel match for track system)
        if (channel) {
          this.inputs.set(channel, input)
          this.deviceToChannelMap.set(input.id, channel)
        }

        // Register ALL devices with track manager (regardless of channel match)
        if (this.trackManager) {
          this.trackInputs.set(input.id, input)
          this.trackManager.addMidiDevice(input.id, input)
        }

        // Set up unified message handler
        input.onmidimessage = (msg) => {
          // Handle legacy bus-based system
          if (channel) {
            this.handleMIDIMessage(channel, msg)
          }

          // Handle track-based system
          if (this.trackManager) {
            this.handleTrackMIDIMessage(input.id, msg)
          }
        }

        console.log(`Connected MIDI device: ${input.name}${channel ? ` -> ${channel}` : ' (no channel match)'}`)
      }

      console.log(`MIDI setup complete. Connected ${this.inputs.size} devices for legacy system, ${access.inputs.size} total devices available for tracks.`)
    } catch (error) {
      console.error('Error setting up MIDI:', error)
      throw error
    }
  }

  handleMIDIMessage (channel, msg) {
    const [status, data1, data2] = msg.data
    const cmd = status & 0xf0

    if (cmd === SETTINGS.MIDI.NOTE_ON && data2 > 0) {
      this.noteOn(channel, data1, data2)
    } else if (cmd === SETTINGS.MIDI.NOTE_OFF || (cmd === SETTINGS.MIDI.NOTE_ON && data2 === 0)) {
      this.noteOff(channel, data1)
    }
  }

  handleTrackMIDIMessage (deviceId, msg) {
    const [status, data1, data2] = msg.data
    const cmd = status & 0xf0

    // Find which track this device is assigned to
    if (!this.trackManager) return

    const tracks = this.trackManager.getTracks()
    const assignedTrack = tracks.find(track => track.midiDevice === deviceId)

    if (!assignedTrack || !assignedTrack.luminode) return

    // Route the MIDI message to the assigned luminode
    if (cmd === SETTINGS.MIDI.NOTE_ON && data2 > 0) {
      this.noteOn(assignedTrack.luminode, data1, data2)
    } else if (cmd === SETTINGS.MIDI.NOTE_OFF || (cmd === SETTINGS.MIDI.NOTE_ON && data2 === 0)) {
      this.noteOff(assignedTrack.luminode, data1)
    }
  }

  // Clean up old notes based on timestamp
  cleanupOldNotes (maxAge = SETTINGS.ANIMATION.MAX_AGE) {
    const now = performance.now()

    Object.keys(this.activeNotes).forEach(channel => {
      this.activeNotes[channel] = this.activeNotes[channel].filter(note => {
        return (now - note.timestamp) < maxAge
      })
    })
  }

  // Get device info for debugging
  getDeviceInfo () {
    const info = {}
    this.inputs.forEach((input, channel) => {
      info[channel] = {
        name: input.name,
        manufacturer: input.manufacturer,
        state: input.state
      }
    })
    return info
  }

  // Get active notes based on track assignments
  getActiveNotesForTracks () {
    if (!this.trackManager) {
      return this.activeNotes
    }

    const activeTracks = this.trackManager.getActiveTracks()
    const trackBasedNotes = {}

    // Initialize all luminode channels
    Object.keys(this.activeNotes).forEach(channel => {
      trackBasedNotes[channel] = []
    })

    // Populate notes for active tracks
    activeTracks.forEach(track => {
      if (track.luminode && track.midiDevice) {
        // Get notes for the assigned luminode directly
        if (this.activeNotes[track.luminode]) {
          trackBasedNotes[track.luminode] = [...this.activeNotes[track.luminode]]
        }
      }
    })

    return trackBasedNotes
  }

  // Get active notes for a specific device
  getActiveNotesForDevice (deviceId) {
    const channel = this.deviceToChannelMap.get(deviceId)
    return channel ? this.activeNotes[channel] || [] : []
  }

  // Get all available MIDI devices (for debugging)
  getAllMidiDevices () {
    const devices = []
    this.trackInputs.forEach((input, deviceId) => {
      devices.push({
        id: deviceId,
        name: input.name,
        manufacturer: input.manufacturer,
        state: input.state
      })
    })
    return devices
  }
}
