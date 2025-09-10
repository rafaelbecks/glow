// Scanline gradients drawing module
import { SETTINGS, UTILS } from '../settings.js';

export class ScanlineGradientsLuminode {
  constructor(canvasDrawer) {
    this.canvasDrawer = canvasDrawer;
    this.ctx = canvasDrawer.getContext();
    this.dimensions = canvasDrawer.getDimensions();
  }

  draw(t, notes, colors = ['#4444ff', '#ffeeaa', '#ff77cc']) {
    if (!notes || notes.length === 0) return;

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions();

    this.canvasDrawer.drawGradientTexture(t, notes, colors);
  }
}
