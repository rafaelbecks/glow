// Synth Manager - Vector Synth using Tone.js
// Each luminode becomes its own oscillator. Drawing points (x/y) become the waveform.
// Nothing drawn = silence. Each track's luminode generates its own waveform.

// Tone.js is loaded via CDN in index.html, available as global 'Tone'

// Note: We use Tone.Oscillator directly with PeriodicWave for wavetable synthesis

export class SynthManager {
  constructor () {
    this.isEnabled = false
    this.trackManager = null
    this.debugMode = true
    
    // Configuration parameters
    this.config = {
      // Audio parameters
      attack: 0.01, // Attack time in seconds
      release: 0.1, // Release time in seconds
      
      // Filter parameters (MS20 style)
      filterCutoff: 20000, // Cutoff frequency in Hz (0-20000)
      filterResonance: 1.0, // Resonance/Q factor (0-10, MS20 style)
      filterEnabled: false, // Enable/disable filter
      
      // Polyphony settings
      maxPolyphony: 8, // Maximum simultaneous voices per track
      
      // Waveform settings
      waveformLength: 1024, // Target length for waveform (will be resampled to this)
      maxPoints: 44000 // Maximum points to store per track
    }
    
    // Tone.js components
    this.masterVolume = null // Tone.Volume for master volume
    this.masterFilter = null // Tone.Filter for MS20-style filter
    
    // Track synths: Map<trackId, Map<noteId, {synth, envelope, filter, volume}>>
    this.trackSynths = new Map()
    
    // Track volumes: Map<trackId, volume>
    this.trackVolumes = new Map()
    
    // Track MIDI notes: Map<trackId, array of active MIDI notes>
    this.trackMidiNotes = new Map()
    
    // Waveform cache - stores drawing points and converted waveforms per track
    this.drawingPoints = new Map() // Track ID -> Array of {x, y} points
    this.waveforms = new Map() // Track ID -> Float32Array of waveform data
  }

  // Initialize Tone.js and AudioWorklet
  async initialize () {
    try {
      // Start Tone.js context (requires user interaction)
      await Tone.start()
      
      // Load AudioWorklet processor
      try {
        await Tone.context.audioWorklet.addModule('src/wavetable-worklet.js')
        this.workletLoaded = true
        console.log('AudioWorklet loaded successfully')
      } catch (error) {
        console.warn('Failed to load AudioWorklet, falling back to Tone.js oscillators:', error)
        this.workletLoaded = false
      }
      
      // Create master volume
      this.masterVolume = new Tone.Volume(0).toDestination()
      
      // Create master filter (MS20-style lowpass)
      this.masterFilter = new Tone.Filter({
        type: 'lowpass',
        frequency: this.config.filterCutoff,
        Q: this.config.filterResonance
      }).connect(this.masterVolume)
      
      // Initially bypass filter (connect masterVolume directly)
      this.masterVolume.toDestination()
      
      console.log('Synth Manager initialized with Tone.js', {
        sampleRate: Tone.context.sampleRate,
        state: Tone.context.state,
        workletLoaded: this.workletLoaded
      })
      
      // Test audio output
      this.playTestTone()
      
      return true
    } catch (error) {
      console.error('Failed to initialize Tone.js:', error)
      return false
    }
  }

  // Enable/disable synth
  async setEnabled (enabled) {
    this.isEnabled = enabled
    
    if (!enabled) {
      // Stop all synths
      this.stopAllSynths()
    } else {
      // Initialize if not already done
      if (!this.masterVolume) {
        const initialized = await this.initialize()
        if (!initialized) {
          console.error('Failed to initialize Tone.js')
          this.isEnabled = false
          return
        }
      }
      
      // Resume Tone.js context if suspended
      if (Tone.context.state !== 'running') {
        await Tone.start()
      }
      
      console.log('Synth enabled, Tone.js context state:', Tone.context.state)
    }
  }

  // Update configuration
  updateConfig (config) {
    Object.assign(this.config, config)
    
    // Update filter if it exists
    if (this.masterFilter) {
      this.masterFilter.frequency.value = this.config.filterCutoff
      this.masterFilter.Q.value = this.config.filterResonance
    }
  }

  // Capture drawing points from a luminode
  captureDrawingPoints (trackId, points) {
    if (!this.isEnabled || !points || points.length === 0) return
    
    const trackIdStr = String(trackId)
    
    if (!this.drawingPoints.has(trackIdStr)) {
      this.drawingPoints.set(trackIdStr, [])
    }
    
    const trackPoints = this.drawingPoints.get(trackIdStr)
    
    // Add new points
    points.forEach(point => {
      trackPoints.push({ x: point.x, y: point.y })
    })
    
    // Keep only recent points (limit memory)
    if (trackPoints.length > this.config.maxPoints) {
      trackPoints.splice(0, trackPoints.length - this.config.maxPoints)
    }
    
    // Debug logging
    if (this.debugMode && trackPoints.length % 50 === 0) {
      console.log(`Captured ${trackPoints.length} points for track ${trackIdStr}`)
    }
  }

  // Convert drawing points to audio waveform
  convertPointsToWaveformWithContext (trackId, canvasHeight) {
    const points = this.drawingPoints.get(trackId)
    if (!points || points.length === 0) {
      this.waveforms.delete(trackId)
      return
    }
    
    // Sort points by X coordinate to ensure proper waveform order
    const sortedPoints = [...points].sort((a, b) => a.x - b.x)
    
    const targetLength = this.config.waveformLength
    const waveform = new Float32Array(targetLength)
    
    // Find the actual Y range for proper normalization
    const yValues = sortedPoints.map(p => p.y)
    const minY = Math.min(...yValues)
    const maxY = Math.max(...yValues)
    const rangeY = maxY - minY
    
    if (sortedPoints.length === 1) {
      // Single point - use as constant value
      waveform.fill(rangeY > 0 ? ((sortedPoints[0].y - minY) / rangeY) * 2 - 1 : 0)
    } else {
      // Create waveform by sampling Y values based on X position
      const xValues = sortedPoints.map(p => p.x)
      const minX = Math.min(...xValues)
      const maxX = Math.max(...xValues)
      const xRange = maxX - minX
      
      for (let i = 0; i < targetLength; i++) {
        // Map waveform index to X position
        const normalizedX = i / (targetLength - 1) // 0 to 1
        const targetX = minX + normalizedX * xRange
        
        // Find the two points that bracket this X position
        let index1 = 0
        let index2 = sortedPoints.length - 1
        
        for (let j = 0; j < sortedPoints.length - 1; j++) {
          if (sortedPoints[j].x <= targetX && sortedPoints[j + 1].x >= targetX) {
            index1 = j
            index2 = j + 1
            break
          }
        }
        
        // Interpolate Y value between the two points
        const p1 = sortedPoints[index1]
        const p2 = sortedPoints[index2]
        const xDiff = p2.x - p1.x
        const frac = xDiff > 0 ? (targetX - p1.x) / xDiff : 0
        const y = p1.y + (p2.y - p1.y) * frac
        
        // Normalize Y to -1 to 1 range
        waveform[i] = rangeY > 0 ? ((y - minY) / rangeY) * 2 - 1 : 0
      }
      
      // Make waveform periodic - ensure last sample connects smoothly to first
      const firstSample = waveform[0]
      const lastSample = waveform[targetLength - 1]
      const avg = (firstSample + lastSample) / 2
      waveform[0] = avg
      waveform[targetLength - 1] = avg
    }
    
    // Normalize waveform to prevent clipping
    this.normalizeWaveform(waveform)
    this.waveforms.set(trackId, waveform)
    
    // Update all synths for this track with the new waveform
    this.updateTrackWaveform(trackId, waveform)
    
    // Debug
    if (this.debugMode && sortedPoints.length > 10) {
      const hasNonZero = waveform.some(s => Math.abs(s) > 0.01)
      if (hasNonZero) {
        console.log(`Waveform created: track=${trackId}, points=${sortedPoints.length}, samples=${targetLength}`)
      }
    }
  }

  // Normalize waveform to prevent clipping
  normalizeWaveform (waveform) {
    let max = 0
    for (let i = 0; i < waveform.length; i++) {
      max = Math.max(max, Math.abs(waveform[i]))
    }
    
    if (max > 1 && max > 0) {
      for (let i = 0; i < waveform.length; i++) {
        waveform[i] /= max
      }
    } else if (max > 0 && max < 0.01) {
      // Very small signal - scale it up to audible range
      const scale = 0.5 / max
      for (let i = 0; i < waveform.length; i++) {
        waveform[i] *= scale
      }
    }
  }

  // Convert MIDI note to frequency (Hz)
  midiToFrequency (midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12)
  }

  // Convert time-domain waveform to partials (harmonics) for Tone.js
  // Uses simple DFT to extract harmonic amplitudes
  waveformToPartials (waveform, maxPartials = 32) {
    const N = waveform.length
    const partials = []
    
    // Extract fundamental and harmonics using DFT
    // We'll compute the amplitude of each harmonic
    for (let k = 0; k < maxPartials && k < N / 2; k++) {
      let realSum = 0
      let imagSum = 0
      
      // Discrete Fourier Transform for this harmonic
      for (let n = 0; n < N; n++) {
        const angle = (2 * Math.PI * k * n) / N
        realSum += waveform[n] * Math.cos(angle)
        imagSum += waveform[n] * Math.sin(angle)
      }
      
      // Calculate amplitude (magnitude)
      const amplitude = Math.sqrt(realSum * realSum + imagSum * imagSum) / N
      partials.push(amplitude)
    }
    
    // Normalize partials so the fundamental (first partial) is 1.0
    if (partials.length > 0 && partials[0] > 0) {
      const fundamental = partials[0]
      for (let i = 0; i < partials.length; i++) {
        partials[i] = partials[i] / fundamental
      }
    }
    
    return partials
  }

  // Convert MIDI note to Tone.js note string
  midiToNote (midiNote) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const octave = Math.floor(midiNote / 12) - 1
    const note = notes[midiNote % 12]
    return `${note}${octave}`
  }

  // Update waveform for all synths in a track
  updateTrackWaveform (trackId, waveform) {
    const trackSynths = this.trackSynths.get(trackId)
    if (!trackSynths) return
    
    // Convert waveform to partials for Tone.js
    const partials = this.waveformToPartials(waveform, 32)
    
    // Update all synths for this track
    trackSynths.forEach((voice, noteId) => {
      if (voice.synth && voice.synth.oscillator) {
        // Update partials - this will change the waveform
        voice.synth.oscillator.partials = partials
      }
    })
  }

  // Create or update synth for a track and note
  createOrUpdateSynth (trackId, noteId, frequency, volume) {
    // Get or create track's synth map
    if (!this.trackSynths.has(trackId)) {
      this.trackSynths.set(trackId, new Map())
    }
    const trackSynths = this.trackSynths.get(trackId)
    
    let voice = trackSynths.get(noteId)
    
    if (!voice) {
      // Create new synth voice
      const waveform = this.waveforms.get(trackId)
      if (!waveform || waveform.length === 0) {
        return null
      }
      
      // Convert waveform to PeriodicWave
      const real = new Float32Array(waveform.length)
      const imag = new Float32Array(waveform.length)
      
      for (let i = 0; i < waveform.length; i++) {
        real[i] = waveform[i]
        imag[i] = 0
      }
      
      // Convert time-domain waveform to partials (harmonics) for Tone.js
      const partials = this.waveformToPartials(waveform, 32)
      
      // Create oscillator with custom partials
      const oscillator = new Tone.Oscillator({
        frequency: frequency,
        type: 'custom',
        partials: partials
      })
      
      // Create envelope
      const envelope = new Tone.AmplitudeEnvelope({
        attack: this.config.attack,
        decay: 0,
        sustain: 1,
        release: this.config.release
      })
      
      // Create per-voice volume
      const voiceVolume = new Tone.Volume(0)
      
      // Create per-voice filter (optional, can use master filter)
      const voiceFilter = new Tone.Filter({
        type: 'lowpass',
        frequency: this.config.filterCutoff,
        Q: this.config.filterResonance
      })
      
      // Connect: oscillator -> envelope -> filter -> voiceVolume -> masterFilter/masterVolume
      oscillator.connect(envelope)
      
      if (this.config.filterEnabled) {
        envelope.connect(voiceFilter)
        voiceFilter.connect(voiceVolume)
      } else {
        envelope.connect(voiceVolume)
      }
      
      if (this.config.filterEnabled && this.masterFilter) {
        voiceVolume.connect(this.masterFilter)
      } else {
        voiceVolume.connect(this.masterVolume)
      }
      
      // Store voice
      voice = {
        synth: { oscillator }, // Store oscillator in synth-like structure
        envelope,
        filter: voiceFilter,
        volume: voiceVolume,
        frequency
      }
      
      trackSynths.set(noteId, voice)
      
      // Start oscillator
      oscillator.start()
      
      // Trigger attack
      envelope.triggerAttack()
      
      if (this.debugMode) {
        console.log(`✓ Synth voice created: track=${trackId}, note=${noteId}, freq=${frequency.toFixed(2)}Hz`)
      }
    } else {
      // Update existing voice
      if (voice.workletNode) {
        // Update AudioWorklet voice
        if (voice.frequency !== frequency) {
          voice.workletNode.port.postMessage({
            type: 'setFrequency',
            data: frequency
          })
          voice.frequency = frequency
        }
        const trackVolume = this.trackVolumes.get(trackId) || 0.5
        voice.workletNode.port.postMessage({
          type: 'setGain',
          data: trackVolume * volume
        })
      } else if (voice.synth && voice.synth.oscillator) {
        // Update Tone.js oscillator voice
        if (voice.synth.oscillator.frequency.value !== frequency) {
          voice.synth.oscillator.frequency.value = frequency
          voice.frequency = frequency
        }
        const trackVolume = this.trackVolumes.get(trackId) || 0.5
        voice.volume.volume.value = Tone.gainToDb(trackVolume * volume)
      }
    }
    
    // Update volume for new voices
    if (!voice.volume) {
      const trackVolume = this.trackVolumes.get(trackId) || 0.5
      if (voice.workletNode) {
        voice.workletNode.port.postMessage({
          type: 'setGain',
          data: trackVolume * volume
        })
      }
    }
    
    return voice
  }

  // Stop synth for a specific track and note
  stopSynth (trackId, noteId) {
    const trackSynths = this.trackSynths.get(trackId)
    if (!trackSynths) return
    
    const voice = trackSynths.get(noteId)
    if (!voice) return
    
    if (voice.workletNode) {
      // Stop AudioWorklet voice
      voice.workletNode.port.postMessage({ type: 'stop' })
      
      // Clean up after release time
      const releaseTime = this.config.release
      const cleanupDelay = Math.max(releaseTime * 1000, 50) + 50
      
      setTimeout(() => {
        try {
          if (voice.workletNode) {
            voice.workletNode.disconnect()
            voice.workletNode = null
          }
          if (voice.filter) {
            voice.filter.dispose()
          }
          if (voice.volume) {
            voice.volume.dispose()
          }
        } catch (e) {
          // Already disposed, ignore
        }
        
        trackSynths.delete(noteId)
        
        if (trackSynths.size === 0) {
          this.trackSynths.delete(trackId)
        }
      }, cleanupDelay)
    } else {
      // Stop Tone.js oscillator voice
      if (voice.synth && voice.synth.oscillator) {
        try {
          voice.synth.oscillator.stop()
        } catch (e) {
          // Already stopped, ignore
        }
      }
      
      // Trigger release on envelope
      if (voice.envelope) {
        try {
          voice.envelope.triggerRelease()
        } catch (e) {
          // Already released, ignore
        }
      }
      
      // Clean up after release time
      const releaseTime = this.config.release
      const cleanupDelay = Math.max(releaseTime * 1000, 50) + 50
      
      setTimeout(() => {
        try {
          if (voice.synth && voice.synth.oscillator) {
            voice.synth.oscillator.dispose()
          }
          if (voice.envelope) {
            voice.envelope.dispose()
          }
          if (voice.filter) {
            voice.filter.dispose()
          }
          if (voice.volume) {
            voice.volume.dispose()
          }
        } catch (e) {
          // Already disposed, ignore
        }
        
        trackSynths.delete(noteId)
        
        if (trackSynths.size === 0) {
          this.trackSynths.delete(trackId)
        }
      }, cleanupDelay)
    }
  }

  // Stop all synths for a track
  stopAllSynthsForTrack (trackId) {
    const trackSynths = this.trackSynths.get(trackId)
    if (!trackSynths) return
    
    trackSynths.forEach((voice, noteId) => {
      this.stopSynth(trackId, noteId)
    })
  }

  // Stop all synths immediately
  stopAllSynths () {
    this.trackSynths.forEach((trackSynths, trackId) => {
      trackSynths.forEach((voice, noteId) => {
        // Immediately stop and dispose
        try {
          if (voice.workletNode) {
            voice.workletNode.port.postMessage({ type: 'stop' })
            voice.workletNode.disconnect()
            voice.workletNode = null
          }
          if (voice.synth && voice.synth.oscillator) {
            voice.synth.oscillator.stop()
            voice.synth.oscillator.dispose()
          }
          if (voice.envelope) {
            voice.envelope.dispose()
          }
          if (voice.filter) {
            voice.filter.dispose()
          }
          if (voice.volume) {
            voice.volume.dispose()
          }
        } catch (e) {
          // Already disposed, ignore
        }
      })
    })
    this.trackSynths.clear()
  }

  // Process drawing data and synthesize audio
  processDrawingData (canvasWidth, canvasHeight, trackLayouts = {}, activeTrackIds = [], activeNotes = {}) {
    if (!this.isEnabled) {
      this.stopAllSynths()
      return
    }
    
    if (Tone.context.state !== 'running') {
      Tone.start().catch(err => {
        console.warn('Failed to start Tone.js context:', err)
      })
      return
    }

    // Convert activeTrackIds to strings
    const activeTrackIdsStr = activeTrackIds.map(id => String(id))
    
    // Stop synths for inactive tracks
    this.trackSynths.forEach((trackSynths, trackId) => {
      const trackIdStr = String(trackId)
      if (!activeTrackIdsStr.includes(trackIdStr)) {
        this.stopAllSynthsForTrack(trackIdStr)
      }
    })
    
    // Clear waveforms for inactive tracks
    this.waveforms.forEach((waveform, trackId) => {
      if (!activeTrackIdsStr.includes(trackId)) {
        this.waveforms.delete(trackId)
        this.drawingPoints.delete(trackId)
      }
    })

    // Process each active track
    activeTrackIdsStr.forEach(trackIdStr => {
      const layout = trackLayouts[trackIdStr] || trackLayouts[parseInt(trackIdStr)]
      if (!layout) {
        this.stopAllSynthsForTrack(trackIdStr)
        return
      }
      
      const trackIdNum = parseInt(trackIdStr)
      const track = this.trackManager?.getTrack(trackIdNum)
      if (!track || !track.luminode) {
        this.stopAllSynthsForTrack(trackIdStr)
        return
      }
      
      // Get MIDI notes for this track's luminode
      const notes = activeNotes[track.luminode] || []
      if (notes.length === 0) {
        this.stopAllSynthsForTrack(trackIdStr)
        this.trackMidiNotes.delete(trackIdStr)
        this.waveforms.delete(trackIdStr)
        return
      }
      
      // Get waveform from captured points
      const drawingPoints = this.drawingPoints.get(trackIdStr)
      let trackWaveform = this.waveforms.get(trackIdStr)
      
      // Convert points to waveform if we have points
      if (drawingPoints && drawingPoints.length > 0) {
        if (drawingPoints.length >= 2) {
          this.convertPointsToWaveformWithContext(trackIdStr, canvasHeight)
          trackWaveform = this.waveforms.get(trackIdStr)
        }
      }
      
      // Process if we have a valid waveform
      if (trackWaveform && trackWaveform.length > 0) {
        const hasDrawing = trackWaveform.some(sample => Math.abs(sample) > 0.01)
        
        if (hasDrawing) {
          const volume = this.trackVolumes.get(trackIdStr) || 0.5
          
          // POLYPHONY: Create/update synth for each active MIDI note
          const activeNoteIds = new Set()
          const limitedNotes = notes.slice(0, this.config.maxPolyphony)
          
          limitedNotes.forEach((note) => {
            const noteId = `${trackIdStr}-${note.midi}`
            activeNoteIds.add(noteId)
            
            const frequency = this.midiToFrequency(note.midi)
            this.createOrUpdateSynth(trackIdStr, noteId, frequency, volume)
          })
          
          // Stop synths for notes that are no longer active
          const trackSynths = this.trackSynths.get(trackIdStr)
          if (trackSynths) {
            trackSynths.forEach((voice, noteId) => {
              if (!activeNoteIds.has(noteId)) {
                this.stopSynth(trackIdStr, noteId)
              }
            })
          }
          
          // Store active notes
          this.trackMidiNotes.set(trackIdStr, limitedNotes.map(n => n.midi))
        } else {
          this.stopAllSynthsForTrack(trackIdStr)
        }
      } else {
        this.stopAllSynthsForTrack(trackIdStr)
      }
    })
  }

  // Set master volume
  setMasterVolume (volume) {
    if (this.masterVolume) {
      this.masterVolume.volume.value = Tone.gainToDb(volume)
    }
  }

  // Set volume for a specific track
  setTrackVolume (trackId, volume) {
    const trackIdStr = String(trackId)
    this.trackVolumes.set(trackIdStr, Math.max(0, Math.min(1, volume)))
    
    // Update all voices for this track
    const trackSynths = this.trackSynths.get(trackIdStr)
    if (trackSynths) {
      trackSynths.forEach((voice) => {
        voice.volume.volume.value = Tone.gainToDb(volume)
      })
    }
  }

  // Get volume for a specific track
  getTrackVolume (trackId) {
    const trackIdStr = String(trackId)
    return this.trackVolumes.get(trackIdStr) || 0.5
  }

  // Set track manager reference
  setTrackManager (trackManager) {
    this.trackManager = trackManager
  }

  // Clear waveform data for a track
  clearTrackData (trackId) {
    this.drawingPoints.delete(trackId)
    this.waveforms.delete(trackId)
    this.trackVolumes.delete(trackId)
    this.stopAllSynthsForTrack(trackId)
  }

  // Clear all waveform data
  clearAllData () {
    this.drawingPoints.clear()
    this.waveforms.clear()
    this.trackVolumes.clear()
    this.stopAllSynths()
  }

  // Get all active track IDs
  getActiveTrackIds () {
    return Array.from(this.waveforms.keys())
  }

  // Get current configuration
  getConfig () {
    return { ...this.config }
  }

  // Filter control methods
  setFilterEnabled (enabled) {
    this.config.filterEnabled = enabled
    
    // Update all voices to use/not use filter
    this.trackSynths.forEach((trackSynths, trackId) => {
      trackSynths.forEach((voice, noteId) => {
        // Disconnect and reconnect with/without filter
        voice.envelope.disconnect()
        voice.volume.disconnect()
        
        if (enabled) {
          voice.envelope.connect(voice.filter)
          voice.filter.connect(voice.volume)
          if (this.masterFilter) {
            voice.volume.connect(this.masterFilter)
          } else {
            voice.volume.connect(this.masterVolume)
          }
        } else {
          voice.envelope.connect(voice.volume)
          voice.volume.connect(this.masterVolume)
        }
      })
    })
  }

  setFilterCutoff (cutoff) {
    this.config.filterCutoff = Math.max(20, Math.min(20000, cutoff))
    
    if (this.masterFilter) {
      this.masterFilter.frequency.value = this.config.filterCutoff
    }
    
    // Update all voice filters
    this.trackSynths.forEach((trackSynths) => {
      trackSynths.forEach((voice) => {
        voice.filter.frequency.value = this.config.filterCutoff
      })
    })
  }

  setFilterResonance (resonance) {
    this.config.filterResonance = Math.max(0, Math.min(10, resonance))
    
    if (this.masterFilter) {
      this.masterFilter.Q.value = this.config.filterResonance
    }
    
    // Update all voice filters
    this.trackSynths.forEach((trackSynths) => {
      trackSynths.forEach((voice) => {
        voice.filter.Q.value = this.config.filterResonance
      })
    })
  }

  // Play a test tone
  async playTestTone () {
    try {
      await Tone.start()
      
      const osc = new Tone.Oscillator(440, 'sine')
      const vol = new Tone.Volume(-20).toDestination()
      
      osc.connect(vol)
      osc.start()
      osc.stop('+0.1')
      
      console.log('Test tone played - if you heard a beep, audio output is working')
    } catch (error) {
      console.error('Failed to play test tone:', error)
    }
  }

  // Get debug info
  getDebugInfo () {
    let totalVoices = 0
    this.trackSynths.forEach((trackSynths) => {
      totalVoices += trackSynths.size
    })
    
    return {
      enabled: this.isEnabled,
      contextState: Tone.context.state,
      sampleRate: Tone.context.sampleRate,
      waveformsCount: this.waveforms.size,
      tracksCount: this.trackSynths.size,
      totalVoices,
      drawingPointsCount: this.drawingPoints.size,
      filterEnabled: this.config.filterEnabled,
      filterCutoff: this.config.filterCutoff,
      filterResonance: this.config.filterResonance
    }
  }

  // Show debug info
  showDebugInfo () {
    const info = this.getDebugInfo()
    console.log('Synth Debug Info:', info)
    return info
  }
}
