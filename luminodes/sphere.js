// Wire sphere drawing module
import { SETTINGS, UTILS } from '../settings.js';

export class SphereLuminode {
  constructor(canvasDrawer) {
    this.canvasDrawer = canvasDrawer;
    this.ctx = canvasDrawer.getContext();
    this.dimensions = canvasDrawer.getDimensions();
    this.currentBaseHue = Math.floor(Math.random() * 360);
    this.lastChordSignature = '';
  }

  draw(t, notes) {
    if (notes.length === 0) return;

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions();

    this.ctx.save();
    this.ctx.translate(this.dimensions.width / 2, this.dimensions.height / 2);

    const baseRadius = SETTINGS.MODULES.SPHERE.BASE_RADIUS;
    const latLines = SETTINGS.MODULES.SPHERE.LAT_LINES;
    const lonLines = SETTINGS.MODULES.SPHERE.LON_LINES;

    const velocityAvg = notes.reduce((acc, n) => acc + n.velocity, 0) / notes.length;
    const sizeFactor = 1 + velocityAvg * 0.8;
    const radius = baseRadius * sizeFactor;

    const chordSize = notes.length;
    const deformAmount = Math.min((chordSize - 1) / 9, 1) * SETTINGS.MODULES.SPHERE.DEFORM_FACTOR;

    // Create a unique signature of active MIDI notes
    const chordSig = notes.map(n => n.midi).sort().join('-');

    if (chordSig !== this.lastChordSignature) {
      this.lastChordSignature = chordSig;
      this.currentBaseHue = Math.floor(Math.random() * 360);
    }

    const hue = (this.currentBaseHue + chordSize * 20 + t * 5) % 360;

    this.ctx.strokeStyle = `hsla(${hue}, 100%, 65%, 0.15)`;
    this.ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.4)`;
    this.ctx.shadowBlur = 5;
    this.ctx.lineWidth = 1;

    // Latitudes
    for (let i = 1; i < latLines; i++) {
      const phi = Math.PI * i / latLines;
      const r = radius * Math.sin(phi);
      const z = radius * Math.cos(phi);

      this.ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) {
        let [x, y1, z1] = UTILS.rotate3D(r * Math.cos(a), r * Math.sin(a), z, t * 0.2, t * 0.3);
        const deform = 1 + deformAmount * Math.sin(t + a + phi);
        this.ctx.lineTo(x * deform, y1 * deform * 0.8 + z1 * 0.1 * deform);
      }
      this.ctx.stroke();
    }

    // Longitudes
    for (let i = 0; i < lonLines; i++) {
      const theta = Math.PI * 2 * i / lonLines;

      this.ctx.beginPath();
      for (let j = 0; j <= latLines; j++) {
        const phi = Math.PI * j / latLines;
        let [x, y1, z1] = UTILS.rotate3D(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi),
          t * 0.2,
          t * 0.3
        );
        const deform = 1 + deformAmount * Math.sin(t + phi + theta);
        this.ctx.lineTo(x * deform, y1 * deform * 0.8 + z1 * 0.1 * deform);
      }
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
}
