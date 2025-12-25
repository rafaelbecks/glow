// Synth Manager - Vector Synth using actual drawing points from luminodes
// Each luminode becomes its own oscillator. Drawing points (x/y) become the waveform.
// Nothing drawn = silence. Each track's luminode generates its own waveform.

export class SynthManager {
  constructor () {
    this.audioContext = null
    this.isEnabled = false
    this.masterGain = null
    this.scriptProcessor = null
    this.audioNodes = new Map() // Track ID -> Map of note -> audio node (for polyphony)
    this.trackVolumes = new Map() // Track ID -> volume (0-1)
    this.trackMidiNotes = new Map() // Track ID -> array of active MIDI notes (for polyphony)
    this.trackManager = null // Reference to track manager (set externally)
    this.testOscillator = null // For testing audio output
    this.debugMode = true // Enable detailed logging
    
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
      
      // Sample rate and buffer settings
      sampleRate: 44100,
      bufferSize: 4096, // Audio buffer size
      
      // Waveform settings
      waveformLength: 1024, // Target length for waveform (will be resampled to this)
      maxPoints: 44000 // Maximum points to store per track
    }
    
    // Filter state (MS20-style state variable filter)
    this.filterState = {
      cutoff: 20000,
      resonance: 1.0,
      enabled: false,
      // State variables for filter
      lp: 0, // Low pass output
      bp: 0, // Band pass output
      hp: 0  // High pass output
    }
    
    // Waveform cache - stores drawing points and converted waveforms per track
    this.drawingPoints = new Map() // Track ID -> Array of {x, y} points
    this.waveforms = new Map() // Track ID -> Float32Array of waveform data
  }

  // Initialize Web Audio API
  async initialize () {
    try {
      // Create AudioContext (with user gesture requirement handling)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain()
      this.masterGain.gain.value = 0.5 // Default volume
      this.masterGain.connect(this.audioContext.destination)
      
      // Create ScriptProcessorNode for custom waveform generation
      // Note: ScriptProcessorNode is deprecated but works everywhere
      // For production, consider AudioWorkletNode
      this.scriptProcessor = this.audioContext.createScriptProcessor(
        this.config.bufferSize,
        0, // 0 inputs
        1  // 1 output (mono)
      )
      
      this.scriptProcessor.onaudioprocess = (e) => {
        this.processAudio(e)
      }
      
      // Connect script processor to master gain
      this.scriptProcessor.connect(this.masterGain)
      
      // Start processing (ScriptProcessorNode starts automatically when connected)
      // The script processor will always process, even when disabled (outputs silence)
      
      // Test audio output with a brief tone
      this.playTestTone()
      
      console.log('Synth Manager initialized', {
        sampleRate: this.audioContext.sampleRate,
        state: this.audioContext.state,
        bufferSize: this.config.bufferSize,
        scriptProcessorConnected: this.scriptProcessor.numberOfInputs,
        scriptProcessorOutputs: this.scriptProcessor.numberOfOutputs
      })
      return true
    } catch (error) {
      console.error('Failed to initialize audio context:', error)
      return false
    }
  }

  // Enable/disable synth
  async setEnabled (enabled) {
    this.isEnabled = enabled
    
    if (!enabled) {
      // Stop all audio nodes (but keep script processor connected)
      this.stopAllAudioNodes()
    } else {
      // Initialize if not already done
      if (!this.audioContext) {
        const initialized = await this.initialize()
        if (!initialized) {
          console.error('Failed to initialize audio context')
          this.isEnabled = false
          return
        }
      }
      
      // Resume if suspended (required for user interaction)
      if (this.audioContext && this.audioContext.state === 'suspended') {
        try {
          await this.audioContext.resume()
          console.log('Audio context resumed, state:', this.audioContext.state)
        } catch (error) {
          console.error('Failed to resume audio context:', error)
        }
      }
      
      // Ensure script processor is connected (it should already be, but verify)
      if (this.scriptProcessor && this.audioContext) {
        try {
          // Check if already connected by trying to connect again (will error if already connected)
          this.scriptProcessor.connect(this.masterGain)
        } catch (e) {
          // Already connected, that's fine
          console.log('Script processor already connected')
        }
      }
      
      console.log('Synth enabled, audio context state:', this.audioContext?.state)
    }
  }

  // Update configuration
  updateConfig (config) {
    Object.assign(this.config, config)
  }

  // Capture drawing points from a luminode
  // This is called as luminodes draw, passing the actual x/y coordinates
  captureDrawingPoints (trackId, points) {
    if (!this.isEnabled || !points || points.length === 0) return
    
    // Normalize trackId to string for consistency
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
    if (this.debugMode) {
      if (trackPoints.length === 1) {
        console.log(`First point captured for track ${trackIdStr}:`, points[0])
      } else if (trackPoints.length % 50 === 0) {
        console.log(`Captured ${trackPoints.length} points for track ${trackIdStr}`)
      }
    }
    
    // Convert points to waveform (will be converted with context in main loop)
  }

  // Convert drawing points to audio waveform
  // Uses Y coordinates as the waveform, X coordinates for timing/spacing
  convertPointsToWaveform (trackId) {
    const points = this.drawingPoints.get(trackId)
    if (!points || points.length === 0) {
      this.waveforms.delete(trackId)
      return
    }
    
    // If we have points, create a waveform
    // Strategy: Use Y coordinates as the waveform values
    // For closed shapes or complex paths, we'll sample evenly
    
    const targetLength = this.config.waveformLength
    const waveform = new Float32Array(targetLength)
    
    if (points.length === 1) {
      // Single point - use as constant value
      const normalizedY = this.normalizeY(points[0].y)
      waveform.fill(normalizedY)
    } else {
      // Multiple points - resample to target length
      // Use Y coordinates, interpolating if needed
      for (let i = 0; i < targetLength; i++) {
        const t = i / (targetLength - 1) // 0 to 1
        const pointIndex = t * (points.length - 1)
        const index1 = Math.floor(pointIndex)
        const index2 = Math.min(index1 + 1, points.length - 1)
        const frac = pointIndex - index1
        
        // Interpolate Y values
        const y1 = points[index1].y
        const y2 = points[index2].y
        const y = y1 + (y2 - y1) * frac
        
        // Normalize Y to -1 to 1 range (assuming canvas coordinates)
        waveform[i] = this.normalizeY(y)
      }
    }
    
    // Normalize waveform to prevent clipping
    this.normalizeWaveform(waveform)
    
    // Store waveform
    this.waveforms.set(trackId, waveform)
  }

  // Normalize Y coordinate to audio range (-1 to 1)
  // Y coordinates are in local space (after layout transform)
  // We normalize based on a typical canvas height range
  normalizeY (y, canvasHeight = 1000) {
    // Normalize Y from local coordinates to -1 to 1
    // Assume Y ranges from -canvasHeight/2 to +canvasHeight/2 (centered at 0)
    // Map to -1 to 1 range
    const normalized = (y / (canvasHeight / 2))
    return Math.max(-1, Math.min(1, normalized))
  }

  // Normalize waveform to prevent clipping
  normalizeWaveform (waveform) {
    // Find max absolute value
    let max = 0
    for (let i = 0; i < waveform.length; i++) {
      max = Math.max(max, Math.abs(waveform[i]))
    }
    
    // Only normalize if max > 1 (to prevent clipping)
    // Don't normalize if max is very small (would amplify noise)
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

  // Process audio - called by ScriptProcessorNode
  processAudio (e) {
    const output = e.outputBuffer.getChannelData(0)
    const bufferLength = output.length
    
    // Always initialize output to zero
    for (let i = 0; i < bufferLength; i++) {
      output[i] = 0
    }
    
    if (!this.isEnabled) {
      return
    }
    
    if (!this.audioContext || this.audioContext.state !== 'running') {
      // Try to resume if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(err => {
          console.warn('Failed to resume audio context in processAudio:', err)
        })
      }
      return
    }
    
    // Mix all active track waveforms (with polyphony)
    let activeCount = 0
    let totalOutput = 0
    
    this.waveforms.forEach((waveform, trackId) => {
      if (!waveform || waveform.length === 0) return
      
      // Get all audio nodes for this track (polyphony - one per note)
      const trackAudioNodes = this.audioNodes.get(trackId)
      if (!trackAudioNodes || trackAudioNodes.size === 0) return
      
      // Process each voice (note) for this track
      trackAudioNodes.forEach((audioNode, noteId) => {
        if (!audioNode || !audioNode.active || audioNode.gain < 0.001) return
        
        activeCount++
        
        // Apply envelope and generate audio from waveform
        const attack = this.config.attack
        const release = this.config.release
        const sampleRate = this.audioContext.sampleRate
        
        for (let i = 0; i < bufferLength; i++) {
          // Apply envelope
          if (audioNode.gain < audioNode.targetGain && attack > 0) {
            // Attack phase
            audioNode.attackTime += 1 / sampleRate
            if (audioNode.attackTime < attack) {
              const attackProgress = audioNode.attackTime / attack
              audioNode.gain = audioNode.targetGain * attackProgress
            } else {
              audioNode.gain = audioNode.targetGain
              audioNode.attackTime = attack
            }
            audioNode.releaseTime = 0
          } else if (audioNode.gain > audioNode.targetGain && release > 0) {
            // Release phase
            audioNode.releaseTime += 1 / sampleRate
            if (audioNode.releaseTime < release) {
              const releaseProgress = 1 - (audioNode.releaseTime / release)
              const startGain = audioNode.targetGain + (audioNode.gain - audioNode.targetGain) * releaseProgress
              audioNode.gain = Math.max(audioNode.targetGain, startGain)
            } else {
              audioNode.gain = audioNode.targetGain
            }
          } else {
            audioNode.gain = audioNode.targetGain
          }
          
          // Get sample from waveform using phase (with interpolation for smoother sound)
          const phaseFloor = Math.floor(audioNode.phase)
          const phaseFrac = audioNode.phase - phaseFloor
          const index1 = phaseFloor % waveform.length
          const index2 = (index1 + 1) % waveform.length
          
          // Linear interpolation between samples
          const sample1 = waveform[index1]
          const sample2 = waveform[index2]
          let sample = sample1 + (sample2 - sample1) * phaseFrac
          
          // Apply gain
          sample *= audioNode.gain
          
          // Apply MS20-style low pass filter if enabled
          if (this.filterState.enabled) {
            sample = this.applyMS20Filter(sample, i)
          }
          
          // Add to output
          output[i] += sample
          totalOutput += Math.abs(sample)
          
          // Advance phase
          audioNode.phase += audioNode.phaseIncrement
          
          // Wrap phase if it exceeds waveform length
          while (audioNode.phase >= waveform.length) {
            audioNode.phase -= waveform.length
          }
          while (audioNode.phase < 0) {
            audioNode.phase += waveform.length
          }
        }
      })
    })
    
    // Debug: log audio processing stats occasionally
    if (this.debugMode && Math.random() < 0.01) {
      const avgOutput = totalOutput / bufferLength
      if (activeCount > 0 || this.waveforms.size > 0) {
        let totalVoices = 0
        const activeNodesInfo = []
        this.audioNodes.forEach((trackNodes, trackId) => {
          trackNodes.forEach((node, noteId) => {
            if (node.active) {
              totalVoices++
              activeNodesInfo.push({
                trackId,
                noteId,
                gain: node.gain.toFixed(3),
                targetGain: node.targetGain.toFixed(3),
                phaseInc: node.phaseIncrement.toFixed(4)
              })
            }
          })
        })
        
        console.log('Audio processing:', {
          activeVoices: activeCount,
          totalVoices,
          waveforms: this.waveforms.size,
          tracks: this.audioNodes.size,
          avgOutput: avgOutput.toFixed(4),
          masterGain: this.masterGain?.gain.value.toFixed(3),
          filterEnabled: this.filterState.enabled,
          activeNodesInfo: activeNodesInfo.slice(0, 5) // Limit to first 5 for readability
        })
      }
    }
  }

  // Convert MIDI note to frequency (Hz)
  midiToFrequency (midiNote) {
    // Standard MIDI note to frequency conversion: A4 (69) = 440 Hz
    return 440 * Math.pow(2, (midiNote - 69) / 12)
  }

  // Process drawing data and synthesize audio
  // This is called from the animation loop after drawing
  // activeNotes: Map of luminode type -> array of {midi, velocity, timestamp}
  processDrawingData (canvasWidth, canvasHeight, trackLayouts = {}, activeTrackIds = [], activeNotes = {}) {
    if (!this.isEnabled || !this.audioContext) {
      // Stop all audio if disabled
      this.stopAllAudioNodes()
      return
    }
    
    // Try to resume if suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(err => {
        console.warn('Failed to resume audio context:', err)
      })
      return
    }
    
    if (this.audioContext.state !== 'running') {
      return
    }

    // Convert activeTrackIds to strings for consistency
    const activeTrackIdsStr = activeTrackIds.map(id => String(id))
    
    // First, stop all audio nodes for tracks that are not active
    this.audioNodes.forEach((trackNodes, trackId) => {
      const trackIdStr = String(trackId)
      if (!activeTrackIdsStr.includes(trackIdStr)) {
        this.stopAllAudioNodesForTrack(trackIdStr)
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
        this.stopAllAudioNodesForTrack(trackIdStr)
        return
      }
      
      // Get the track to find its luminode type
      const trackIdNum = parseInt(trackIdStr)
      const track = this.trackManager?.getTrack(trackIdNum)
      if (!track || !track.luminode) {
        this.stopAllAudioNodesForTrack(trackIdStr)
        return
      }
      
      // Get MIDI notes for this track's luminode
      const notes = activeNotes[track.luminode] || []
      if (notes.length === 0) {
        // No active notes, stop all voices for this track
        this.stopAllAudioNodesForTrack(trackIdStr)
        this.trackMidiNotes.delete(trackIdStr)
        this.waveforms.delete(trackIdStr)
        return
      }
      
      // Get waveform from captured points
      const drawingPoints = this.drawingPoints.get(trackIdStr)
      let trackWaveform = this.waveforms.get(trackIdStr)
      
      // Always convert points to waveform if we have points (update continuously)
      // This ensures the waveform reflects the current drawing state
      if (drawingPoints && drawingPoints.length > 0) {
        // Need at least a few points to form a waveform
        if (drawingPoints.length >= 2) {
          // Convert points to waveform (this will update the waveform)
          this.convertPointsToWaveformWithContext(trackIdStr, canvasHeight)
          trackWaveform = this.waveforms.get(trackIdStr)
        }
      }
      
      // Process if we have a valid waveform
      if (trackWaveform && trackWaveform.length > 0) {
        // Check if waveform has any non-zero samples
        const hasDrawing = trackWaveform.some(sample => Math.abs(sample) > 0.01)
        
        if (hasDrawing) {
          // Get track volume (default to 0.5 if not set)
          const volume = this.trackVolumes.get(trackIdStr) || 0.5
          
          // POLYPHONY: Create/update audio node for each active MIDI note
          const activeNoteIds = new Set()
          
          // Limit polyphony to maxPolyphony
          const limitedNotes = notes.slice(0, this.config.maxPolyphony)
          
          limitedNotes.forEach((note) => {
            const noteId = `${trackIdStr}-${note.midi}`
            activeNoteIds.add(noteId)
            
            const frequency = this.midiToFrequency(note.midi)
            
            // Update or create audio node for this note
            this.updateAudioNode(trackIdStr, noteId, frequency, volume)
          })
          
          // Stop audio nodes for notes that are no longer active
          const trackNodes = this.audioNodes.get(trackIdStr)
          if (trackNodes) {
            trackNodes.forEach((node, noteId) => {
              if (!activeNoteIds.has(noteId)) {
                this.stopAudioNode(trackIdStr, noteId)
              }
            })
          }
          
          // Store active notes for this track
          this.trackMidiNotes.set(trackIdStr, limitedNotes.map(n => n.midi))
        } else {
          // No drawing, stop all voices for this track
          this.stopAllAudioNodesForTrack(trackIdStr)
        }
      } else {
        // No waveform, stop all voices for this track
        this.stopAllAudioNodesForTrack(trackIdStr)
      }
    })
  }

  // Set master volume
  setMasterVolume (volume) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume))
      if (this.debugMode) {
        console.log('Master volume set to:', volume)
      }
    }
  }

  // Set volume for a specific track
  setTrackVolume (trackId, volume) {
    this.trackVolumes.set(trackId, Math.max(0, Math.min(1, volume)))
    
    // Update audio node if it exists
    const audioNode = this.audioNodes.get(trackId)
    if (audioNode) {
      audioNode.targetGain = volume
    }
  }

  // Get volume for a specific track
  getTrackVolume (trackId) {
    // Try both string and number versions
    const trackIdStr = String(trackId)
    return this.trackVolumes.get(trackIdStr) || this.trackVolumes.get(parseInt(trackIdStr)) || 0.5
  }

  // Set track manager reference (needed to get track info)
  setTrackManager (trackManager) {
    this.trackManager = trackManager
  }


  // Convert points to waveform with canvas height context
  // This is like a reverse Fourier transform - we're summing the drawing points into a waveform
  convertPointsToWaveformWithContext (trackId, canvasHeight) {
    const points = this.drawingPoints.get(trackId)
    if (!points || points.length === 0) {
      this.waveforms.delete(trackId)
      return
    }
    
    // Sort points by X coordinate to ensure proper waveform order
    // This is critical - the waveform must be ordered by X (left to right)
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
      // This preserves the shape of what was drawn
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
        
        // Binary search for efficiency (or linear for small arrays)
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
      // This is important for wavetable synthesis
      const firstSample = waveform[0]
      const lastSample = waveform[targetLength - 1]
      const avg = (firstSample + lastSample) / 2
      waveform[0] = avg
      waveform[targetLength - 1] = avg
    }
    
    // Normalize waveform to prevent clipping (but preserve shape)
    this.normalizeWaveform(waveform)
    this.waveforms.set(trackId, waveform)
    
    // Debug
    if (this.debugMode && sortedPoints.length > 10) {
      const hasNonZero = waveform.some(s => Math.abs(s) > 0.01)
      if (hasNonZero) {
        console.log(`Waveform created: track=${trackId}, points=${sortedPoints.length}, samples=${targetLength}, minY=${minY.toFixed(2)}, maxY=${maxY.toFixed(2)}`)
      }
    }
  }

  // MS20-style state variable filter
  applyMS20Filter (sample, sampleIndex) {
    const cutoff = this.filterState.cutoff
    const resonance = this.filterState.resonance
    const sampleRate = this.audioContext.sampleRate
    
    // Calculate filter coefficients
    const f = cutoff / sampleRate
    const k = 3.6 * f - 1.6 * f * f - 1 // MS20-style coefficient
    const p = (k + 1) * 0.5
    const scale = Math.exp((1 - p) * 1.386249)
    const r = resonance * scale
    
    // State variable filter (MS20 style)
    const input = sample
    this.filterState.bp = p * (this.filterState.lp + input) - this.filterState.lp
    this.filterState.lp = this.filterState.lp + p * this.filterState.bp
    this.filterState.hp = input - this.filterState.lp - r * this.filterState.bp
    
    // Return low pass output (MS20 style)
    return this.filterState.lp
  }

  // Update or create audio node for a track and note (polyphony)
  updateAudioNode (trackId, noteId, frequency, volume) {
    // Get or create track's audio nodes map
    if (!this.audioNodes.has(trackId)) {
      this.audioNodes.set(trackId, new Map())
    }
    const trackNodes = this.audioNodes.get(trackId)
    
    let audioNode = trackNodes.get(noteId)
    
    if (!audioNode) {
      // Create new audio node for this note
      audioNode = {
        active: true,
        phase: 0,
        phaseIncrement: 0,
        gain: 0,
        targetGain: 0,
        attackTime: 0, // Time since note on
        releaseTime: 0 // Time since note off
      }
      trackNodes.set(noteId, audioNode)
      if (this.debugMode) {
        console.log(`✓ Audio node created for track ${trackId}, note ${noteId}`)
      }
    }
    
    // Calculate phase increment based on frequency
    // phaseIncrement = (frequency * waveformLength) / sampleRate
    const waveform = this.waveforms.get(trackId)
    if (waveform && waveform.length > 0) {
      // Ensure phase increment is valid
      const phaseInc = (frequency * waveform.length) / this.audioContext.sampleRate
      if (isNaN(phaseInc) || !isFinite(phaseInc) || phaseInc <= 0) {
        // Invalid phase increment, stop this node
        this.stopAudioNode(trackId)
        return
      }
      audioNode.phaseIncrement = phaseInc
    } else {
      // No waveform yet, don't update
      this.stopAudioNode(trackId)
      return
    }
    
    // Update target gain (envelope is applied in processAudio)
    audioNode.targetGain = volume
    audioNode.active = true
    
    // If starting from silence and volume > 0, start attack immediately
    if (audioNode.gain === 0 && volume > 0) {
      audioNode.attackTime = 0
      audioNode.releaseTime = 0
      // Start with a small gain to avoid silence
      if (this.config.attack > 0) {
        audioNode.gain = 0.01 // Small initial gain
      } else {
        audioNode.gain = volume // No attack, set directly
      }
    } else if (volume > audioNode.gain) {
      // Starting attack - reset attack time
      audioNode.attackTime = 0
      audioNode.releaseTime = 0
    } else if (volume < audioNode.gain) {
      // Starting release - reset release time
      audioNode.releaseTime = 0
    }
  }

  // Stop audio node for a specific track and note
  stopAudioNode (trackId, noteId = null) {
    const trackNodes = this.audioNodes.get(trackId)
    if (!trackNodes) return
    
    if (noteId) {
      // Stop specific note
      const audioNode = trackNodes.get(noteId)
      if (audioNode) {
        audioNode.targetGain = 0
        audioNode.releaseTime = 0
        if (audioNode.gain < 0.001) {
          audioNode.active = false
          trackNodes.delete(noteId)
        }
      }
    } else {
      // Stop all notes for this track (legacy support)
      this.stopAllAudioNodesForTrack(trackId)
    }
  }

  // Stop all audio nodes for a track
  stopAllAudioNodesForTrack (trackId) {
    const trackNodes = this.audioNodes.get(trackId)
    if (trackNodes) {
      trackNodes.forEach((node, noteId) => {
        node.targetGain = 0
        node.releaseTime = 0
        if (node.gain < 0.001) {
          node.active = false
        }
      })
      // Clean up if all nodes are inactive
      const hasActive = Array.from(trackNodes.values()).some(n => n.active)
      if (!hasActive) {
        this.audioNodes.delete(trackId)
      }
    }
  }

  // Stop all audio nodes
  stopAllAudioNodes () {
    this.audioNodes.forEach((trackNodes, trackId) => {
      this.stopAllAudioNodesForTrack(trackId)
    })
  }

  // Clear waveform data for a track
  clearTrackData (trackId) {
    this.drawingPoints.delete(trackId)
    this.waveforms.delete(trackId)
    this.trackVolumes.delete(trackId)
    this.stopAudioNode(trackId)
  }

  // Clear all waveform data
  clearAllData () {
    this.drawingPoints.clear()
    this.waveforms.clear()
    this.trackVolumes.clear()
    this.stopAllAudioNodes()
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
    this.filterState.enabled = enabled
    this.config.filterEnabled = enabled
  }

  setFilterCutoff (cutoff) {
    this.filterState.cutoff = Math.max(20, Math.min(20000, cutoff))
    this.config.filterCutoff = this.filterState.cutoff
  }

  setFilterResonance (resonance) {
    this.filterState.resonance = Math.max(0, Math.min(10, resonance))
    this.config.filterResonance = this.filterState.resonance
  }

  // Play a test tone to verify audio output works
  playTestTone () {
    if (!this.audioContext || this.audioContext.state !== 'running') {
      setTimeout(() => this.playTestTone(), 100)
      return
    }
    
    try {
      const osc = this.audioContext.createOscillator()
      const gain = this.audioContext.createGain()
      
      osc.type = 'sine'
      osc.frequency.value = 440 // A4
      
      gain.gain.setValueAtTime(0, this.audioContext.currentTime)
      gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01)
      gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1)
      
      osc.connect(gain)
      gain.connect(this.masterGain)
      
      osc.start(this.audioContext.currentTime)
      osc.stop(this.audioContext.currentTime + 0.1)
      
      console.log('Test tone played - if you heard a beep, audio output is working')
    } catch (error) {
      console.error('Failed to play test tone:', error)
    }
  }


  // Get debug info
  getDebugInfo () {
    return {
      enabled: this.isEnabled,
      audioContextState: this.audioContext?.state,
      audioContextSampleRate: this.audioContext?.sampleRate,
      waveformsCount: this.waveforms.size,
      audioNodesCount: this.audioNodes.size,
      drawingPointsCount: this.drawingPoints.size,
      activeAudioNodes: Array.from(this.audioNodes.entries())
        .filter(([id, node]) => node.active && node.gain > 0.001)
        .map(([id, node]) => ({
          trackId: id,
          gain: node.gain,
          targetGain: node.targetGain,
          phase: node.phase,
          phaseIncrement: node.phaseIncrement
        })),
      waveforms: Array.from(this.waveforms.entries()).map(([id, waveform]) => ({
        trackId: id,
        length: waveform.length,
        hasData: waveform.some(s => Math.abs(s) > 0.01),
        min: Math.min(...waveform),
        max: Math.max(...waveform)
      })),
      drawingPoints: Array.from(this.drawingPoints.entries()).map(([id, points]) => ({
        trackId: id,
        pointCount: points.length
      }))
    }
  }
}

