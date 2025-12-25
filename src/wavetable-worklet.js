// AudioWorklet Processor for Wavetable Synthesis
// This runs on a separate audio thread for better performance

class WavetableProcessor extends AudioWorkletProcessor {
  constructor (options) {
    super()
    
    this.waveform = null
    this.phase = 0
    this.phaseIncrement = 0
    this.gain = 0
    this.targetGain = 0
    this.attackTime = 0
    this.releaseTime = 0
    this.attack = 0.01
    this.release = 0.1
    this.active = false
    this.sampleRate = sampleRate // Use the global sampleRate from AudioWorkletProcessor
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data
      
      switch (type) {
        case 'setWaveform':
          this.waveform = new Float32Array(data)
          break
        case 'setFrequency':
          if (this.waveform && this.waveform.length > 0) {
            this.phaseIncrement = (data * this.waveform.length) / this.sampleRate
          }
          break
        case 'setGain':
          this.targetGain = data
          if (data > 0 && this.gain === 0) {
            this.attackTime = 0
            this.releaseTime = 0
            this.gain = 0.01 // Small initial gain
          } else if (data === 0) {
            this.releaseTime = 0
          }
          break
        case 'setEnvelope':
          this.attack = data.attack || 0.01
          this.release = data.release || 0.1
          break
        case 'start':
          this.active = true
          this.phase = 0
          this.attackTime = 0
          this.releaseTime = 0
          break
        case 'stop':
          this.targetGain = 0
          this.releaseTime = 0
          break
      }
    }
  }

  process (inputs, outputs, parameters) {
    const output = outputs[0]
    const channel = output[0]
    
    if (!this.active || !this.waveform || this.waveform.length === 0) {
      // Output silence
      for (let i = 0; i < channel.length; i++) {
        channel[i] = 0
      }
      return true
    }
    
    for (let i = 0; i < channel.length; i++) {
      // Apply envelope
      if (this.gain < this.targetGain && this.attack > 0) {
        // Attack phase
        this.attackTime += 1 / sampleRate
        if (this.attackTime < this.attack) {
          const attackProgress = this.attackTime / this.attack
          this.gain = this.targetGain * attackProgress
        } else {
          this.gain = this.targetGain
          this.attackTime = this.attack
        }
        this.releaseTime = 0
      } else if (this.gain > this.targetGain && this.release > 0) {
        // Release phase
        this.releaseTime += 1 / sampleRate
        if (this.releaseTime < this.release) {
          const releaseProgress = 1 - (this.releaseTime / this.release)
          const startGain = this.targetGain + (this.gain - this.targetGain) * releaseProgress
          this.gain = Math.max(this.targetGain, startGain)
        } else {
          this.gain = this.targetGain
        }
      } else {
        this.gain = this.targetGain
      }
      
      // Get sample from waveform using phase (with interpolation)
      const phaseFloor = Math.floor(this.phase)
      const phaseFrac = this.phase - phaseFloor
      const index1 = phaseFloor % this.waveform.length
      const index2 = (index1 + 1) % this.waveform.length
      
      // Linear interpolation
      const sample1 = this.waveform[index1]
      const sample2 = this.waveform[index2]
      let sample = sample1 + (sample2 - sample1) * phaseFrac
      
      // Apply gain
      sample *= this.gain
      
      // Write to output
      channel[i] = sample
      
      // Advance phase
      this.phase += this.phaseIncrement
      
      // Wrap phase
      while (this.phase >= this.waveform.length) {
        this.phase -= this.waveform.length
      }
      while (this.phase < 0) {
        this.phase += this.waveform.length
      }
      
      // Stop if gain is effectively zero
      if (this.gain < 0.001 && this.targetGain === 0) {
        this.active = false
        // Output remaining samples as zero
        for (let j = i + 1; j < channel.length; j++) {
          channel[j] = 0
        }
        break
      }
    }
    
    return true
  }
}

registerProcessor('wavetable-processor', WavetableProcessor)

