// Whitney lines drawing module
import { SETTINGS, UTILS } from '../settings.js';

export class WhitneyLinesLuminode {
  constructor(canvasDrawer) {
    this.canvasDrawer = canvasDrawer;
    this.ctx = canvasDrawer.getContext();
    this.dimensions = canvasDrawer.getDimensions();
  }

  draw(t, notes, useColor = false) {
    if (notes.length === 0) return;

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions();

    const notesToUse = notes.map(n => n.midi);
    const cx = this.dimensions.width / 2;
    const cy = this.dimensions.height / 2;
    const r = SETTINGS.MODULES.WHITNEY_LINES.RADIUS;
    const totalLines = notesToUse.length * SETTINGS.MODULES.WHITNEY_LINES.LINES_PER_NOTE;

    this.ctx.save();
    this.ctx.translate(cx, cy);

    for (let i = 0; i < totalLines; i++) {
      const angle = t * SETTINGS.MODULES.WHITNEY_LINES.ROTATION_SPEED + i * (Math.PI * 2 / totalLines);
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      this.ctx.lineTo(x, y);

      if (useColor) {
        const note = notesToUse[i % notesToUse.length];
        this.ctx.strokeStyle = UTILS.pitchToColor(note);
        this.ctx.shadowColor = this.ctx.strokeStyle;
      } else {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.shadowColor = 'white';
      }

      this.ctx.lineWidth = SETTINGS.MODULES.WHITNEY_LINES.LINE_WIDTH;
      this.ctx.shadowBlur = SETTINGS.MODULES.WHITNEY_LINES.SHADOW_BLUR;
      this.ctx.stroke();
    }

    this.ctx.restore();
  }
}
