// Tablet/HID device management and drawing
import { SETTINGS, UTILS } from './settings.js';

export class TabletManager {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    
    this.drawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.currentStroke = null;
    this.strokes = [];
    this.lastClearTime = 0;
    
    // Configuration
    this.baseLineWidth = options.lineWidth || SETTINGS.TABLET.DEFAULT_LINE_WIDTH;
    this.clearInterval = options.clearInterval || SETTINGS.TABLET.CLEAR_INTERVAL;
    
    // Device reference
    this.device = null;
  }

  // Color generation methods
  getRandomColor() {
    if (Math.random() < 0.5) {
      // Use SOTO_PALETTE colors
      return SETTINGS.COLORS.SOTO_PALETTE[Math.floor(Math.random() * SETTINGS.COLORS.SOTO_PALETTE.length)];
    } else {
      // Use random hue like pitchToColor function
      const hue = Math.floor(Math.random() * 360);
      return `hsla(${hue}, 100%, 70%, 1)`;
    }
  }

  // Drawing control methods
  setLineWidth(newWidth) {
    this.baseLineWidth = newWidth;
  }

  startDrawing(x, y) {
    this.drawing = true;
    this.lastX = x;
    this.lastY = y;
    
    // Start a new stroke
    this.currentStroke = {
      points: [{ x, y, timestamp: performance.now() }],
      color: this.getRandomColor(),
      lineWidth: this.baseLineWidth
    };
  }

  stopDrawing() {
    this.drawing = false;
    if (this.currentStroke && this.currentStroke.points.length > 1) {
      // Add completed stroke to the strokes array
      this.strokes.push(this.currentStroke);
    }
    this.currentStroke = null;
    this.ctx.beginPath(); // reset path
  }

  draw(x, y, pressure = 0.5, tiltX = 0, tiltY = 0) {
    if (!this.drawing || !this.currentStroke) return;

    // Pressure scales the line width
    const lineWidth = this.baseLineWidth * (0.5 + pressure);
    this.currentStroke.lineWidth = lineWidth;

    // Add point to current stroke
    this.currentStroke.points.push({ x, y, timestamp: performance.now() });

    // Draw the current stroke
    this.ctx.strokeStyle = this.currentStroke.color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.shadowColor = this.currentStroke.color;
    this.ctx.shadowBlur = lineWidth * 2;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }

  drawStrokes() {
    // Draw all stored strokes
    this.strokes.forEach(stroke => {
      this.ctx.save();
      this.ctx.strokeStyle = stroke.color;
      this.ctx.lineWidth = stroke.lineWidth;
      this.ctx.shadowColor = stroke.color;
      this.ctx.shadowBlur = stroke.lineWidth * 2;

      this.ctx.beginPath();
      for (let i = 1; i < stroke.points.length; i++) {
        const prev = stroke.points[i - 1];
        const curr = stroke.points[i];
        this.ctx.moveTo(prev.x, prev.y);
        this.ctx.lineTo(curr.x, curr.y);
      }
      this.ctx.stroke();
      this.ctx.restore();
    });
  }

  clearStrokes() {
    this.strokes = [];
  }

  clear() {
    this.strokes = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // HID device connection
  async connectUgeeQ6() {
    const filters = [{ 
      vendorId: SETTINGS.TABLET.VENDOR_ID, 
      productId: SETTINGS.TABLET.PRODUCT_ID 
    }];

    try {
      const devices = await navigator.hid.requestDevice({ filters });
      
      if (!devices || devices.length === 0) {
        console.error("No UGEE Q6 found");
        return false;
      }

      this.device = devices[devices.length - 1];
      await this.device.open();
      console.log(`Connected to ${this.device.productName}`);

      // Set up input event listener
      this.device.addEventListener("inputreport", (e) => {
        this.handleTabletInput(e);
      });

      return true;
    } catch (error) {
      console.error("Error connecting to UGEE Q6", error);
      return false;
    }
  }

  handleTabletInput(e) {
    if (e.reportId !== SETTINGS.TABLET.REPORT_ID) return;

    const dv = new DataView(e.data.buffer);

    // Buttons (first byte)
    const buttons = dv.getUint8(0);
    const tipSwitch = buttons & 0x01; // bit 0
    const barrel = (buttons >> 1) & 0x01; // bit 1
    const eraser = (buttons >> 2) & 0x01; // bit 2
    const invert = (buttons >> 3) & 0x01; // bit 3
    const inRange = (buttons >> 5) & 0x01; // bit 5

    // Position + pressure + tilt
    const x = dv.getUint16(1, true);  // bits 8–23
    const y = dv.getUint16(3, true);  // bits 24–39
    const pressure = dv.getUint16(5, true);  // bits 40–55
    const tiltX = dv.getInt8(7);          // bits 56–63
    const tiltY = dv.getInt8(8);          // bits 64–71

    // Handle tablet drawing
    this.handleTabletData(x, y, pressure, tiltX, tiltY);
  }

  handleTabletData(x, y, pressure, tiltX, tiltY) {
    // Convert tablet coordinates to canvas coordinates
    // Assuming tablet coordinates are in the range 0-32767 (16-bit)
    const canvasX = (x / SETTINGS.TABLET.COORDINATE_MAX) * this.canvas.width;
    const canvasY = (y / SETTINGS.TABLET.COORDINATE_MAX) * this.canvas.height;
    
    // Normalize pressure from 0-65535 to 0-1
    const normalizedPressure = pressure / SETTINGS.TABLET.PRESSURE_MAX;

    // Check if pen is in range (pressure > 0 means pen is touching)
    if (normalizedPressure > 0) {
      if (!this.drawing) {
        this.startDrawing(canvasX, canvasY);
        this.drawing = true;
      }
      this.draw(canvasX, canvasY, normalizedPressure, tiltX, tiltY);
    } else {
      if (this.drawing) {
        this.stopDrawing();
        this.drawing = false;
      }
    }
  }

  // Periodic cleanup
  checkAndClearStrokes(currentTime) {
    if (currentTime - this.lastClearTime > this.clearInterval) {
      this.clearStrokes();
      this.lastClearTime = currentTime;
    }
  }

  // Get current state for debugging
  getState() {
    return {
      drawing: this.drawing,
      strokeCount: this.strokes.length,
      device: this.device ? this.device.productName : 'Not connected',
      lineWidth: this.baseLineWidth
    };
  }
}
