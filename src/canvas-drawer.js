// Canvas drawing operations and utilities
import { SETTINGS, UTILS } from './settings.js';

export class CanvasDrawer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  clear() {
    this.ctx.fillStyle = `rgba(0, 0, 0, ${SETTINGS.CANVAS.CLEAR_ALPHA})`;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  // Utility drawing functions
  drawOutlinedRotatingTriangle(x, y, size, angle, color) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size);
    this.ctx.lineTo(size * 0.866, size * 0.5);
    this.ctx.lineTo(-size * 0.866, size * 0.5);
    this.ctx.closePath();
    this.ctx.strokeStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 20;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawStripedSquare(x, y, size, angleDeg, bgColor) {
    const stripeWidth = 4;
    const angle = angleDeg * Math.PI / 180;

    // Diagonal of the square = size * sqrt(2)
    const paddedSize = Math.ceil(size * Math.SQRT2);

    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = paddedSize;
    patternCanvas.height = paddedSize;
    const pctx = patternCanvas.getContext('2d');

    // Fill with background color
    pctx.fillStyle = bgColor;
    pctx.fillRect(0, 0, paddedSize, paddedSize);

    // Erase diagonal stripes
    pctx.globalCompositeOperation = 'destination-out';
    pctx.save();
    pctx.translate(paddedSize / 2, paddedSize / 2);
    pctx.rotate(angle);
    pctx.translate(-paddedSize / 2, -paddedSize / 2);

    for (let i = -paddedSize; i < paddedSize * 2; i += stripeWidth * 2) {
      pctx.fillRect(i, 0, stripeWidth, paddedSize);
    }

    pctx.restore();
    pctx.globalCompositeOperation = 'source-over';

    // Draw the central square portion, rotated
    this.ctx.save();
    this.ctx.translate(x + size / 2, y + size / 2); // center of square
    this.ctx.rotate(angle);

    // Clip to the visible square
    this.ctx.beginPath();
    this.ctx.rect(-size / 2, -size / 2, size, size);
    this.ctx.clip();

    // Draw pattern, centered
    this.ctx.drawImage(
      patternCanvas,
      -paddedSize / 2,
      -paddedSize / 2,
      paddedSize,
      paddedSize
    );

    this.ctx.restore();
  }

  drawWobblyRect(x, y, size, color) {
    const wobble = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x + Math.random() * wobble, y + Math.random() * wobble);
    for (let i = 0; i < 4; i++) {
      const angle = Math.PI / 2 * i;
      const dx = Math.cos(angle) * size + Math.random() * wobble;
      const dy = Math.sin(angle) * size + Math.random() * wobble;
      this.ctx.lineTo(x + dx, y + dy);
    }
    this.ctx.closePath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5 + Math.random();
    this.ctx.stroke();
  }

  drawWobblyContour(shape, t) {
    shape.layers.forEach((layer, idx) => {
      const { radius, jitter, sides } = layer;
      const angleStep = (Math.PI * 2) / sides;
      this.ctx.beginPath();

      for (let i = 0; i <= sides; i++) {
        const angle = angleStep * i + shape.baseAngle;
        const r = radius + (Math.random() - 0.5) * jitter;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) this.ctx.moveTo(x, y);
        else this.ctx.lineTo(x, y);
      }

      this.ctx.closePath();
      this.ctx.strokeStyle = shape.color;
      this.ctx.lineWidth = 2;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = shape.color;
      this.ctx.stroke();
    });
  }

  // Gradient and texture functions
  drawMorphingGradient(t, notes, colors = ['#ee77aa', '#558dff']) {
    const noteCount = notes?.length || 0;

    // Animate only when notes are playing
    const movement = noteCount > 0 ? t * 0.2 : 0;

    const gradient = this.ctx.createLinearGradient(
      Math.sin(movement) * this.width * 0.5,
      0,
      Math.cos(movement) * this.width * 0.5 + this.width,
      this.height
    );

    colors.forEach((color, i) => {
      const stop = i / (colors.length - 1);
      gradient.addColorStop(stop, color);
    });

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawScanlineOverlay(t, density = 150, strength = 0.5) {
    this.ctx.save();
    this.ctx.strokeStyle = `rgba(255, 255, 255, ${strength})`;
    this.ctx.lineWidth = 1;

    for (let i = 0; i < density; i++) {
      const y = (i / density) * this.height;
      const offset = Math.sin(t + i * 0.25) * 0.4;

      this.ctx.beginPath();
      this.ctx.moveTo(0, y + offset);
      this.ctx.lineTo(this.width, y + offset);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawGradientTexture(t, notes, colors = ['#ee77aa', '#558dff']) {
    if (!notes || notes.length === 0) return;
    this.drawMorphingGradient(t, notes, colors);
    this.drawScanlineOverlay(t);
  }

  // Square overlap checking
  checkOverlap(square1, square2) {
    return !(square1.x + square1.size <= square2.x ||
             square1.x >= square2.x + square2.size ||
             square1.y + square1.size <= square2.y ||
             square1.y >= square2.y + square2.size);
  }

  // Get canvas context for direct drawing operations
  getContext() {
    return this.ctx;
  }

  // Get canvas dimensions
  getDimensions() {
    return { width: this.width, height: this.height };
  }
}
