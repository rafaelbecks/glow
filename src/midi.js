// MIDI event handling and device management
// TODO: Refactor to discard the legacy "Bus" assignment logic which we don't use anymore (it's not needed)
import { SETTINGS, MIDI_CHANNELS } from './settings.js'
import { getAvailableLuminodes } from './luminodes/index.js'

export class MIDIManager {
  constructor (trackManager = null, ccMapper = null) {
    this.trackManager = trackManager
    this.ccMapper = ccMapper
    // Build activeNotes dynamically from available luminodes
    this.activeNotes = {}
    getAvailableLuminodes().forEach(luminode => {
      this.activeNotes[luminode] = []
    })

    this.inputs = new Map() // Maps channel to array of inputs
    this.deviceToChannelMap = new Map() // Maps device ID to channel name
    this.trackInputs = new Map() // Maps device ID to input for track system

    // MIDI output for tablet
    this.outputEnabled = false
    this.outputDevice = null
    this.output = null
    this.currentNote = null
    this.octaveRange = 3

    // Generate mode: feed notes without hardware MIDI; blocks real note input
    this.generateModeActive = false
    this.generateOutputEnabled = false
    this.generatorOwnedTracks = new Set()
    /** @type {Record<number, Array<{ midi: number, velocity: number, timestamp: number }>>} */
    this.activeNotesByTrack = {}
  }

  setGenerateModeActive (active) {
    this.generateModeActive = !!active
  }

  isGenerateModeActive () {
    return this.generateModeActive
  }

  setGeneratorOwnedTracks (trackIds = []) {
    this.generatorOwnedTracks = new Set(trackIds)
  }

  isTrackDrivenByGenerator (trackId) {
    return this.generatorOwnedTracks.has(trackId)
  }

  setGenerateOutputEnabled (enabled) {
    this.generateOutputEnabled = !!enabled
  }

  clearAllNotes () {
    Object.keys(this.activeNotes).forEach((channel) => {
      this.activeNotes[channel] = []
    })
    Object.keys(this.activeNotesByTrack).forEach((trackId) => {
      this.activeNotesByTrack[trackId] = []
    })
  }

  ensureTrackNoteBucket (trackId) {
    if (this.activeNotesByTrack[trackId] === undefined) {
      this.activeNotesByTrack[trackId] = []
    }
  }

  clearTrackNotes (trackId) {
    delete this.activeNotesByTrack[trackId]
  }

  noteOnTrack (trackId, midi, velocity) {
    this.ensureTrackNoteBucket(trackId)
    const list = this.activeNotesByTrack[trackId]
    const existingNote = list.find(n => n.midi === midi)

    if (existingNote) {
      existingNote.timestamp = performance.now()
      existingNote.velocity = velocity / SETTINGS.MIDI.VELOCITY_MAX
    } else {
      list.push({
        midi,
        velocity: velocity / SETTINGS.MIDI.VELOCITY_MAX,
        timestamp: performance.now()
      })
    }
  }

  noteOffTrack (trackId, midi) {
    const list = this.activeNotesByTrack[trackId]
    if (!list) return
    const index = list.findIndex(n => n.midi === midi)
    if (index !== -1) {
      list.splice(index, 1)
    }
  }

  sendGenerateNoteOn (note, velocity) {
    if (!this.generateOutputEnabled || !this.output) return
    this.output.send([SETTINGS.MIDI.NOTE_ON, note, velocity])
  }

  sendGenerateNoteOff (note) {
    if (!this.output) return
    this.output.send([SETTINGS.MIDI.NOTE_OFF, note, 0])
  }

  noteOn (channel, midi, velocity) {
    const list = this.activeNotes[channel]
    if (!list) {
      console.warn(`Unknown MIDI channel: ${channel}`)
      return
    }
    const existingNote = list.find(n => n.midi === midi)

    if (existingNote) {
      // Update timestamp and velocity for existing note (key held down)
      existingNote.timestamp = performance.now()
      existingNote.velocity = velocity / SETTINGS.MIDI.VELOCITY_MAX
    } else {
      // Add new note
      list.push({
        midi,
        velocity: velocity / SETTINGS.MIDI.VELOCITY_MAX, // Normalize to 0-1
        timestamp: performance.now()
      })
    }
  }

  noteOff (channel, midi) {
    const list = this.activeNotes[channel]
    if (!list) {
      console.warn(`Unknown MIDI channel: ${channel}`)
      return
    }
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
      const access = await navigator.requestMIDIAccess({ sysex: false })

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
          // Support multiple devices per channel
          if (!this.inputs.has(channel)) {
            this.inputs.set(channel, [])
          }
          this.inputs.get(channel).push(input)
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
    // Legacy bus path: ignore notes while any generator is active
    if (this.generateModeActive) return

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
    const channel = status & 0x0f
    const input = this.trackInputs.get(deviceId)
    const deviceName = input?.name || 'Unknown MIDI device'
    const commandNames = {
      [SETTINGS.MIDI.NOTE_OFF]: 'noteOff',
      [SETTINGS.MIDI.NOTE_ON]: 'noteOn',
      [SETTINGS.MIDI.CONTROL_CHANGE]: 'controlChange',
      [SETTINGS.MIDI.PITCH_BEND]: 'pitchBend'
    }

    console.log('[MIDI IN]', {
      deviceId,
      deviceName,
      status: `0x${status.toString(16).padStart(2, '0')}`,
      command: commandNames[cmd] || `0x${cmd.toString(16)}`,
      channel: channel + 1,
      data1,
      data2,
      hardwareMode: SETTINGS.HARDWARE_MODE.ENABLED,
      mapperEnabled: Boolean(this.ccMapper?.enabled),
      mapperDeviceMatch: Boolean(
        this.ccMapper?.matchesDevice(deviceId, deviceName)
      )
    })

    if (SETTINGS.HARDWARE_MODE.ENABLED && this.ccMapper && input) {
      if (cmd === SETTINGS.MIDI.CONTROL_CHANGE) {
        this.ccMapper.handleCC(data1, data2, deviceId, deviceName)
      } else if (cmd === SETTINGS.MIDI.PITCH_BEND) {
        this.ccMapper.handlePitchBend(
          data1,
          data2,
          channel,
          deviceId,
          deviceName
        )
      } else if (
        cmd === SETTINGS.MIDI.NOTE_ON ||
        cmd === SETTINGS.MIDI.NOTE_OFF
      ) {
        this.ccMapper.handleNote(
          data1,
          data2,
          cmd === SETTINGS.MIDI.NOTE_ON && data2 > 0,
          deviceId,
          deviceName
        )
      }
    }

    const isNoteMessage =
      cmd === SETTINGS.MIDI.NOTE_ON || cmd === SETTINGS.MIDI.NOTE_OFF
    if (
      isNoteMessage &&
      this.ccMapper?.shouldSuppressNotes(deviceId, deviceName)
    ) {
      console.log('[MIDI IN] Suppressed mapped-controller note event', {
        deviceName,
        channel: channel + 1,
        note: data1,
        velocity: data2
      })
      return
    }

    // Find which tracks this device is assigned to
    if (!this.trackManager) return

    const tracks = this.trackManager.getTracks()
    const assignedTracks = tracks.filter(track => track.midiDevice === deviceId)

    if (assignedTracks.length === 0) return

    // Route the MIDI message to all assigned luminodes (skip tracks owned by generators)
    assignedTracks.forEach(track => {
      if (!track.luminode) return
      if (this.isTrackDrivenByGenerator(track.id)) return

      if (cmd === SETTINGS.MIDI.NOTE_ON && data2 > 0) {
        this.noteOn(track.luminode, data1, data2)
      } else if (cmd === SETTINGS.MIDI.NOTE_OFF || (cmd === SETTINGS.MIDI.NOTE_ON && data2 === 0)) {
        this.noteOff(track.luminode, data1)
      }
    })
  }

  setCCMapper (ccMapper) {
    this.ccMapper = ccMapper
  }

  // Clean up old notes based on timestamp
  cleanupOldNotes (maxAge = SETTINGS.ANIMATION.MAX_AGE) {
    const now = performance.now()

    Object.keys(this.activeNotes).forEach(channel => {
      this.activeNotes[channel] = this.activeNotes[channel].filter(note => {
        return (now - note.timestamp) < maxAge
      })
    })

    Object.keys(this.activeNotesByTrack).forEach(trackId => {
      this.activeNotesByTrack[trackId] = this.activeNotesByTrack[trackId].filter(note => {
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

  /**
   * Notes for drawing / activity. Prefer per-track generator notes when present;
   * otherwise luminode-keyed hardware MIDI. Consumers should resolve with
   * `notes[track.id] || notes[track.luminode]`.
   */
  getActiveNotesForTracks () {
    if (!this.trackManager) {
      return this.activeNotes
    }

    const activeTracks = this.trackManager.getActiveTracks()
    const trackBasedNotes = {}

    Object.keys(this.activeNotes).forEach(channel => {
      trackBasedNotes[channel] = []
    })

    activeTracks.forEach(track => {
      if (!track.luminode) return

      if (this.isTrackDrivenByGenerator(track.id)) {
        const notes = this.activeNotesByTrack[track.id] || []
        trackBasedNotes[track.id] = [...notes]
        return
      }

      if (track.midiDevice) {
        const notes = this.activeNotes[track.luminode] || []
        trackBasedNotes[track.id] = [...notes]
        trackBasedNotes[track.luminode] = [...notes]
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

  // MIDI Output methods for tablet
  setOutputEnabled (enabled) {
    this.outputEnabled = enabled
    if (!enabled && this.currentNote !== null) {
      this.sendNoteOff()
    }
  }

  setOutputDevice (deviceId) {
    this.outputDevice = deviceId
  }

  setOctaveRange (range) {
    this.octaveRange = Math.max(1, Math.min(4, range))
  }

  async initializeOutput () {
    try {
      if (!this.outputDevice) {
        console.warn('No MIDI output device selected')
        return
      }

      const access = await navigator.requestMIDIAccess({ sysex: false })
      this.output = access.outputs.get(this.outputDevice)
      if (!this.output) {
        console.warn('MIDI output device not found:', this.outputDevice)
        console.log('Available output devices:', Array.from(access.outputs.values()).map(d => ({ id: d.id, name: d.name })))
      } else {
        console.log('MIDI output device connected:', this.output.name)
      }
    } catch (error) {
      console.error('Error initializing MIDI output:', error)
    }
  }

  sendNoteOn (note, velocity) {
    if (!this.outputEnabled || !this.output) return

    // Send note off for current note if different
    if (this.currentNote !== null && this.currentNote !== note) {
      this.sendNoteOff()
    }

    this.output.send([SETTINGS.MIDI.NOTE_ON, note, velocity])
    this.currentNote = note
  }

  sendNoteOff () {
    if (!this.outputEnabled || !this.output || this.currentNote === null) return

    this.output.send([SETTINGS.MIDI.NOTE_OFF, this.currentNote, 0])
    this.currentNote = null
  }

  mapPositionToNote (x, canvasWidth) {
    if (!this.outputEnabled) return null

    // Map X position to note (0-1 range to note range)
    const normalizedX = x / canvasWidth
    const noteRange = this.octaveRange * 12 // 12 notes per octave
    const baseNote = 60 // Middle C (C4)
    const note = Math.floor(normalizedX * noteRange) + baseNote

    // Clamp to valid MIDI range
    return Math.max(0, Math.min(127, note))
  }

  mapPressureToVelocity (pressure) {
    if (!this.outputEnabled) return 0

    // Map pressure (0-1) to velocity (0-127)
    return Math.floor(pressure * SETTINGS.MIDI.VELOCITY_MAX)
  }

  // Get available output devices
  async getAvailableOutputDevices () {
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false })
      const outputDevices = []

      for (const output of access.outputs.values()) {
        outputDevices.push({
          id: output.id,
          name: output.name,
          manufacturer: output.manufacturer,
          state: output.state
        })
      }

      return outputDevices
    } catch (error) {
      console.error('Error getting MIDI output devices:', error)
      return []
    }
  }
}
