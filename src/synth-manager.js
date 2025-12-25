// Synth Manager - Vector Synth using actual drawing points from luminodes
// Each luminode becomes its own oscillator. Drawing points (x/y) become the waveform.
// Nothing drawn = silence. Each track's luminode generates its own waveform.

export class SynthManager {
  constructor () {
    this.audioContext = null
    this.isEnabled = false
    this.masterGain = null
    this.scriptProcessor = null
    this.audioNodes = new Map() // Track ID -> audio node
    this.trackVolumes = new Map() // Track ID -> volume (0-1)
    this.testOscillator = null // For testing audio output
    this.debugMode = true // Enable detailed logging
    
    // Configuration parameters
    this.config = {
      // Range mapping: canvas coordinates to audio spectrum
      xRange: { min: 0, max: 1 }, // Normalized X position (0-1) maps to frequency range
      
      // Frequency mapping (Hz) - playback speed of the waveform
      frequencyMin: 80, // Low frequency bound
      frequencyMax: 2000, // High frequency bound
      
      // Audio parameters
      attack: 0.01, // Attack time in seconds
      release: 0.1, // Release time in seconds
      
      // Sample rate and buffer settings
      sampleRate: 44100,
      bufferSize: 4096, // Audio buffer size
      
      // Waveform settings
      waveformLength: 512, // Target length for waveform (will be resampled to this)
      maxPoints: 10000 // Maximum points to store per track
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
    
    // Mix all active track waveforms
    let activeCount = 0
    let totalOutput = 0
    
    this.waveforms.forEach((waveform, trackId) => {
      if (!waveform || waveform.length === 0) return
      
      const audioNode = this.audioNodes.get(trackId)
      if (!audioNode || !audioNode.active || audioNode.gain < 0.001) return
      
      activeCount++
      
      // Generate audio from waveform
      for (let i = 0; i < bufferLength; i++) {
        // Get sample from waveform using phase (with interpolation for smoother sound)
        const phaseFloor = Math.floor(audioNode.phase)
        const phaseFrac = audioNode.phase - phaseFloor
        const index1 = phaseFloor % waveform.length
        const index2 = (index1 + 1) % waveform.length
        
        // Linear interpolation between samples
        const sample1 = waveform[index1]
        const sample2 = waveform[index2]
        const sample = sample1 + (sample2 - sample1) * phaseFrac
        
        // Add to output with gain
        const outputSample = sample * audioNode.gain
        output[i] += outputSample
        totalOutput += Math.abs(outputSample)
        
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
    
    // Debug: log audio processing stats occasionally
    if (this.debugMode && Math.random() < 0.01) {
      const avgOutput = totalOutput / bufferLength
      if (activeCount > 0 || this.waveforms.size > 0) {
        console.log('Audio processing:', {
          activeNodes: activeCount,
          waveforms: this.waveforms.size,
          audioNodes: this.audioNodes.size,
          avgOutput: avgOutput.toFixed(4),
          masterGain: this.masterGain?.gain.value
        })
      }
    }
  }

  // Process drawing data and synthesize audio
  // This is called from the animation loop after drawing
  processDrawingData (canvasWidth, canvasHeight, trackLayouts = {}, activeTrackIds = []) {
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
    this.audioNodes.forEach((node, trackId) => {
      const trackIdStr = String(trackId)
      if (!activeTrackIdsStr.includes(trackIdStr)) {
        this.stopAudioNode(trackIdStr)
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
        this.stopAudioNode(trackIdStr)
        return
      }
      
      const waveform = this.waveforms.get(trackIdStr)
      const drawingPoints = this.drawingPoints.get(trackIdStr)
      
      // Only process if we have recent drawing points (within last frame)
      if (drawingPoints && drawingPoints.length > 0 && waveform && waveform.length > 0) {
        // Check if waveform has any non-zero samples (actual drawing)
        const hasDrawing = waveform.some(sample => Math.abs(sample) > 0.01)
        
        if (hasDrawing) {
          // Calculate frequency based on layout X position
          const normalizedX = Math.max(0, Math.min(1, (layout.x + canvasWidth / 2) / canvasWidth))
          const frequency = this.mapToFrequency(normalizedX)
          
          // Get track volume (default to 0.5 if not set)
          const volume = this.trackVolumes.get(trackIdStr) || 0.5
          
          // Update or create audio node for this track
          this.updateAudioNode(trackIdStr, frequency, volume)
        } else {
          // No drawing, stop this track
          this.stopAudioNode(trackIdStr)
        }
      } else {
        // No waveform or points, stop this track
        this.stopAudioNode(trackIdStr)
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
    return this.trackVolumes.get(trackId) || 0.5
  }

  // Map normalized X position (0-1) to frequency (Hz)
  mapToFrequency (normalizedX) {
    const { frequencyMin, frequencyMax, xRange } = this.config
    
    // Map from xRange to frequency range
    const rangeX = (normalizedX - xRange.min) / (xRange.max - xRange.min)
    const clampedX = Math.max(0, Math.min(1, rangeX))
    
    return frequencyMin + (frequencyMax - frequencyMin) * clampedX
  }

  // Convert points to waveform with canvas height context
  convertPointsToWaveformWithContext (trackId, canvasHeight) {
    const points = this.drawingPoints.get(trackId)
    if (!points || points.length === 0) {
      this.waveforms.delete(trackId)
      return
    }
    
    const targetLength = this.config.waveformLength
    const waveform = new Float32Array(targetLength)
    
    if (points.length === 1) {
      const normalizedY = this.normalizeY(points[0].y, canvasHeight)
      waveform.fill(normalizedY)
    } else {
      for (let i = 0; i < targetLength; i++) {
        const t = i / (targetLength - 1)
        const pointIndex = t * (points.length - 1)
        const index1 = Math.floor(pointIndex)
        const index2 = Math.min(index1 + 1, points.length - 1)
        const frac = pointIndex - index1
        
        const y1 = points[index1].y
        const y2 = points[index2].y
        const y = y1 + (y2 - y1) * frac
        
        waveform[i] = this.normalizeY(y, canvasHeight)
      }
    }
    
    this.normalizeWaveform(waveform)
    this.waveforms.set(trackId, waveform)
    
    // Debug: log when waveform is created
    if (waveform.length > 0) {
      const hasNonZero = waveform.some(s => Math.abs(s) > 0.01)
      if (hasNonZero) {
        const min = Math.min(...waveform)
        const max = Math.max(...waveform)
        const avg = waveform.reduce((a, b) => a + Math.abs(b), 0) / waveform.length
        console.log(`✓ Waveform created for track ${trackId}:`, {
          length: waveform.length,
          min: min.toFixed(3),
          max: max.toFixed(3),
          avg: avg.toFixed(3),
          points: points.length,
          hasData: hasNonZero
        })
      } else {
        console.warn(`⚠ Waveform created but all zeros for track ${trackId} (${points.length} points)`)
      }
    }
  }

  // Update or create audio node for a track
  updateAudioNode (trackId, frequency, volume) {
    let audioNode = this.audioNodes.get(trackId)
    
    if (!audioNode) {
      // Create new audio node
      audioNode = {
        active: true,
        phase: 0,
        phaseIncrement: 0,
        gain: 0,
        targetGain: 0
      }
      this.audioNodes.set(trackId, audioNode)
      if (this.debugMode) {
        console.log(`✓ Audio node created for track ${trackId}`)
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
    
    // Update target gain
    audioNode.targetGain = volume
    audioNode.active = true
    
    // Smooth gain transition (faster for more responsive audio)
    const currentGain = audioNode.gain
    const gainDiff = audioNode.targetGain - currentGain
    const gainStep = gainDiff * 0.5 // Faster interpolation for more responsive audio
    
    audioNode.gain = Math.max(0, Math.min(1, currentGain + gainStep))
  }

  // Stop audio node for a track
  stopAudioNode (trackId) {
    const audioNode = this.audioNodes.get(trackId)
    if (audioNode) {
      // Immediately stop (no fade for now to avoid lingering sounds)
      audioNode.targetGain = 0
      audioNode.gain = 0
      audioNode.active = false
      audioNode.phase = 0
    }
  }

  // Stop all audio nodes
  stopAllAudioNodes () {
    this.audioNodes.forEach((node, trackId) => {
      this.stopAudioNode(trackId)
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

  // Set audio sink (output device) - if supported by browser
  async setSinkId (sinkId) {
    if (!this.audioContext) return false
    
    // Check if setSinkId is available (Chrome/Edge)
    if (this.audioContext.setSinkId) {
      try {
        await this.audioContext.setSinkId(sinkId || '')
        console.log('Audio sink set to:', sinkId || 'default')
        return true
      } catch (error) {
        console.error('Failed to set audio sink:', error)
        return false
      }
    } else {
      console.warn('setSinkId not supported in this browser')
      return false
    }
  }

  // Get available audio sinks (output devices) - if supported
  async getAvailableSinks () {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return []
    }
    
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioOutputs = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          id: device.deviceId,
          name: device.label || `Audio Output ${device.deviceId.substring(0, 8)}`,
          groupId: device.groupId
        }))
      
      return audioOutputs
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error)
      return []
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

