// Tablet/HID device management and drawing
import { SETTINGS } from './settings.js';
import { GeometricUtils } from './geometric-utils.js';

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
    this.backgroundBleeding = options.backgroundBleeding !== undefined ? options.backgroundBleeding : SETTINGS.TABLET.BACKGROUND_BLEEDING;
    this.canvasLayerOrder = options.canvasLayerOrder || SETTINGS.TABLET.CANVAS_LAYER_ORDER;
    
    // Geometric drawing settings
    this.geometricMode = options.geometricMode || false;
    this.shapeDetectionThreshold = options.shapeDetectionThreshold || 0.8; // 0-1, higher = more strict
    this.minPointsForShape = options.minPointsForShape || 3;
    
    // Device references - track all connected devices
    this.devices = [];
    this.activeDevice = null;
    
  // Initialize canvas layer order
  this.updateCanvasZIndex();
  
  // Initialize tablet canvas dimensions
  this.resizeCanvas();
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

  setBackgroundBleeding(enabled) {
    this.backgroundBleeding = enabled;
  }

  setCanvasLayerOrder(layer) {
    this.canvasLayerOrder = layer;
    this.updateCanvasZIndex();
  }

  setGeometricMode(enabled) {
    this.geometricMode = enabled;
  }

  setShapeDetectionThreshold(threshold) {
    this.shapeDetectionThreshold = Math.max(0, Math.min(1, threshold));
  }

  updateCanvasZIndex() {
    if (this.canvas) {
      if (this.canvasLayerOrder === 'front') {
        this.canvas.style.zIndex = '2';
      } else {
        this.canvas.style.zIndex = '0';
      }
    }
  }

  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
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
      // Check for geometric shapes if geometric mode is enabled
      if (this.geometricMode) {
        const detectedShape = GeometricUtils.detectGeometricShape(this.currentStroke.points, {
          shapeDetectionThreshold: this.shapeDetectionThreshold,
          minPointsForShape: this.minPointsForShape
        });
        if (detectedShape) {
          this.currentStroke.geometricShape = detectedShape;
          // Clear the canvas and redraw all strokes with geometric shapes
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.redrawAllStrokes();
        }
      }
      
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

    // If geometric mode is enabled, don't draw freehand - wait for shape detection
    if (this.geometricMode) {
      this.lastX = x;
      this.lastY = y;
      return;
    }

    // Draw the current stroke (freehand mode)
    this.ctx.strokeStyle = this.currentStroke.color;
    this.ctx.lineWidth = lineWidth;
    this.ctx.shadowColor = this.currentStroke.color;
    this.ctx.shadowBlur = lineWidth * 0.5;

    this.ctx.beginPath();
    this.ctx.moveTo(this.lastX, this.lastY);
    this.ctx.lineTo(x, y);
    this.ctx.stroke();

    this.lastX = x;
    this.lastY = y;
  }


  clearStrokes() {
    this.strokes = [];
  }

  clear() {
    this.strokes = [];
    this.currentStroke = null;
    this.drawing = false;
    // Clear the tablet canvas completely (no background bleeding)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }


  // Redraw all strokes, using geometric shapes when available
  redrawAllStrokes() {
    for (const stroke of this.strokes) {
      if (stroke.geometricShape) {
        GeometricUtils.renderGeometricShape(this.ctx, stroke);
      } else {
        // Draw freehand stroke
        this.ctx.strokeStyle = stroke.color;
        this.ctx.lineWidth = stroke.lineWidth;
        this.ctx.shadowColor = stroke.color;
        this.ctx.shadowBlur = stroke.lineWidth * 0.5;
        this.ctx.beginPath();
        
        if (stroke.points.length > 0) {
          this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          for (let i = 1; i < stroke.points.length; i++) {
            this.ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
          }
        }
        
        this.ctx.stroke();
      }
    }
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

      // Connect to all devices instead of just the last one
      this.devices = [];
      for (const device of devices) {
        try {
          await device.open();
          console.log(`Connected to ${device.productName}`);
          
          // Set up input event listener for each device
          device.addEventListener("inputreport", (e) => {
            this.handleTabletInput(e, device);
          });
          
          this.devices.push(device);
        } catch (deviceError) {
          console.warn(`Failed to connect to device ${device.productName}:`, deviceError);
        }
      }

      if (this.devices.length === 0) {
        console.error("No devices could be connected");
        return false;
      }

      console.log(`Connected to ${this.devices.length} tablet device(s)`);
      return true;
    } catch (error) {
      console.error("Error connecting to UGEE Q6", error);
      return false;
    }
  }

  handleTabletInput(e, device) {
    if (e.reportId !== SETTINGS.TABLET.REPORT_ID) return;

    const dv = new DataView(e.data.buffer);

    // Buttons (first byte)
    const buttons = dv.getUint8(0);
    // const tipSwitch = buttons & 0x01; // bit 0
    // const barrel = (buttons >> 1) & 0x01; // bit 1
    // const eraser = (buttons >> 2) & 0x01; // bit 2
    // const invert = (buttons >> 3) & 0x01; // bit 3
    // const inRange = (buttons >> 5) & 0x01; // bit 5

    // Position + pressure + tilt
    const x = dv.getUint16(1, true);  // bits 8–23
    const y = dv.getUint16(3, true);  // bits 24–39
    const pressure = dv.getUint16(5, true);  // bits 40–55
    const tiltX = dv.getInt8(7);          // bits 56–63
    const tiltY = dv.getInt8(8);          // bits 64–71

    // Normalize pressure from 0-65535 to 0-1
    const normalizedPressure = pressure / SETTINGS.TABLET.PRESSURE_MAX;

    // Only process data if this device is active or if we need to determine the active device
    if (this.activeDevice === null || this.activeDevice === device) {
      // If we have pressure data (pen is touching), this becomes the active device
      if (normalizedPressure > 0) {
        if (this.activeDevice !== device) {
          console.log(`Switching active device to: ${device.productName}`);
          this.activeDevice = device;
        }
        // Handle tablet drawing
        this.handleTabletData(x, y, pressure, tiltX, tiltY);
      } else if (this.activeDevice === device) {
        // If the active device reports no pressure, handle the stop drawing
        this.handleTabletData(x, y, pressure, tiltX, tiltY);
      }
    }
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

  // Reset active device (useful for debugging or manual switching)
  resetActiveDevice() {
    this.activeDevice = null;
    console.log('Active device reset - next device with pressure data will become active');
  }

  // Get current state for debugging
  getState() {
    return {
      drawing: this.drawing,
      strokeCount: this.strokes.length,
      devices: this.devices.map(d => d.productName),
      activeDevice: this.activeDevice ? this.activeDevice.productName : 'None',
      lineWidth: this.baseLineWidth,
      geometricMode: this.geometricMode,
      shapeDetectionThreshold: this.shapeDetectionThreshold
    };
  }
}
