// Sinewave drawing module
import { SETTINGS, UTILS } from '../settings.js';

export class SinewaveLuminode {
  constructor(canvasDrawer) {
    this.canvasDrawer = canvasDrawer;
    this.ctx = canvasDrawer.getContext();
    this.dimensions = canvasDrawer.getDimensions();
  }

  draw(t, notes) {
    if (!notes || notes.length === 0) return;

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions();

    const rootMidi = Math.min(...notes.map(n => n.midi));
    const rootFreq = 440 * Math.pow(2, (rootMidi - 69) / 12);
    const baseFreq = 0.0035;

    notes.forEach(({ midi, velocity, timestamp }) => {
      const progress = (t - timestamp) / 1000;
      if (progress > 3) return;

      const freq = 440 * Math.pow(2, (midi - 69) / 12);
      const ratio = freq / rootFreq;

      const harmonicFreq = baseFreq * ratio * 6;
      const amplitude = (10 + velocity * 80 / ratio) * 3;

      const phase = t * 2 + ratio * 4;

      this.ctx.beginPath();
      this.ctx.strokeStyle = UTILS.pitchToColor(midi);
      this.ctx.lineWidth = 1;

      for (let i = -this.dimensions.width / 2; i <= this.dimensions.width / 2; i += 1) {
        const yOffset = Math.sin(i * harmonicFreq + phase) * amplitude;
        this.ctx.lineTo(i + this.dimensions.width / 2, this.dimensions.height / 2 + yOffset);
      }
      this.ctx.stroke();
    });
  }
}
