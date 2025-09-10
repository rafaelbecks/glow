// MIDI event handling and device management
import { SETTINGS, MIDI_CHANNELS } from './settings.js';

export class MIDIManager {
  constructor() {
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
      scanlineGradients: [],
      phyllotaxis: [],
      wovenNet: [],
      polygons: [],
      whitneyLines: []
    };
    
    this.inputs = new Map();
  }

  noteOn(channel, midi, velocity) {
    const list = this.activeNotes[channel];
    if (!list.some(n => n.midi === midi)) {
      list.push({ 
        midi, 
        velocity: velocity / SETTINGS.MIDI.VELOCITY_MAX, // Normalize to 0-1
        timestamp: performance.now() 
      });
    }
  }

  noteOff(channel, midi) {
    const list = this.activeNotes[channel];
    const index = list.findIndex(n => n.midi === midi);
    if (index !== -1) {
      list.splice(index, 1);
    }
  }

  getActiveNotes(channel) {
    return this.activeNotes[channel] || [];
  }

  getAllActiveNotes() {
    return this.activeNotes;
  }

  async setupMIDI() {
    try {
      const access = await navigator.requestMIDIAccess();
      
      for (const input of access.inputs.values()) {
        const name = input.name.toLowerCase();
        let channel = null;
        
        // Find matching channel based on device name
        // Sort by length (longest first) to match "bus 10" before "bus 1"
        const sortedEntries = Object.entries(MIDI_CHANNELS).sort((a, b) => b[0].length - a[0].length);
        for (const [busName, channelName] of sortedEntries) {
          if (name.includes(busName)) {
            channel = channelName;
            break;
          }
        }

        if (!channel) continue;

        // Store input reference
        this.inputs.set(channel, input);

        // Set up message handler
        input.onmidimessage = (msg) => {
          this.handleMIDIMessage(channel, msg);
        };

        console.log(`Connected MIDI device: ${input.name} -> ${channel}`);
      }

      console.log(`MIDI setup complete. Connected ${this.inputs.size} devices.`);
    } catch (error) {
      console.error('Error setting up MIDI:', error);
      throw error;
    }
  }

  handleMIDIMessage(channel, msg) {
    const [status, data1, data2] = msg.data;
    const cmd = status & 0xf0;
    
    if (cmd === SETTINGS.MIDI.NOTE_ON && data2 > 0) {
      this.noteOn(channel, data1, data2);
    } else if (cmd === SETTINGS.MIDI.NOTE_OFF || (cmd === SETTINGS.MIDI.NOTE_ON && data2 === 0)) {
      this.noteOff(channel, data1);
    }
  }

  // Clean up old notes based on timestamp
  cleanupOldNotes(maxAge = SETTINGS.ANIMATION.MAX_AGE) {
    const now = performance.now();
    
    Object.keys(this.activeNotes).forEach(channel => {
      this.activeNotes[channel] = this.activeNotes[channel].filter(note => {
        return (now - note.timestamp) < maxAge;
      });
    });
  }

  // Get device info for debugging
  getDeviceInfo() {
    const info = {};
    this.inputs.forEach((input, channel) => {
      info[channel] = {
        name: input.name,
        manufacturer: input.manufacturer,
        state: input.state
      };
    });
    return info;
  }
}
