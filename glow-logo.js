export class GlowLogo extends HTMLElement {
  constructor() {
    super();
    this.canvas = null;
    this.ctx = null;
    this.t = 0;
    this.animationId = 0;
    this.svgData = null;
    this.svgPaths = [];
    this.isHovered = false;
    this.letterColors = ['white', 'white', 'white', 'white']; // G, L, O, W
    this.baseHues = [0, 0, 0, 0]; // Base hues for each letter
  }

  async connectedCallback() {
    this.canvas = document.createElement('canvas');
    this.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    window.addEventListener('resize', this.resize.bind(this));
    
    // Add hover event listeners
    this.canvas.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // Load SVG data
    await this.loadSVG();
    this.resize();
    this.render();
  }

  disconnectedCallback() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.resize.bind(this));
  }

  handleMouseEnter() {
    this.isHovered = true;
    this.generateRandomHues();
  }

  handleMouseLeave() {
    this.isHovered = false;
    this.letterColors = ['white', 'white', 'white', 'white'];
    this.baseHues = [0, 0, 0, 0];
  }

  generateRandomHues() {
    // Generate random base hues for each letter (0-360 degrees)
    this.baseHues = this.baseHues.map(() => {
      return Math.floor(Math.random() * 360);
    });
  }

  getHueColor(baseHue, t) {
    // Animate hue over time like harmonograph
    const hue = (baseHue + t * 20) % 360;
    return `hsla(${hue}, 100%, 70%, 1)`;
  }

  async loadSVG() {
    try {
      const response = await fetch('glow-logo.svg');
      const svgText = await response.text();
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
      const svg = svgDoc.querySelector('svg');
      
      // Extract all paths (G, L, W)
      const paths = svg.querySelectorAll('path');
      this.svgPaths = Array.from(paths);
      
      // Get viewBox for scaling
      const viewBox = svg.getAttribute('viewBox').split(' ').map(Number);
      this.svgViewBox = {
        x: viewBox[0],
        y: viewBox[1], 
        width: viewBox[2],
        height: viewBox[3]
      };
    } catch (error) {
      console.error('Failed to load SVG:', error);
    }
  }

  resize() {
    const size = Math.min(window.innerWidth, window.innerHeight) * 0.8;
    this.canvas.width = size;
    this.canvas.height = size * 0.4; // Aspect ratio for "GLOW" text
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size * 0.4}px`;
  }

  render() {
    this.t += 1 / 60;

    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Update letter colors based on hover state and time
    if (this.isHovered) {
      this.letterColors = this.baseHues.map(baseHue => this.getHueColor(baseHue, this.t));
    }

    // Set up Vectrex-style rendering
    this.ctx.strokeStyle = 'white';
    this.ctx.fillStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (this.svgPaths && this.svgViewBox) {
      // Draw SVG paths (G, L, W)
      this.drawSVGPaths(width, height);
      
      // Draw Whitney-style O in the center
      this.drawWhitneyO(width, height);
    } else {
      // Fallback: draw simple letters
      this.drawFallbackLetters(width, height);
    }

    this.animationId = requestAnimationFrame(this.render.bind(this));
  }

  drawSVGPaths(canvasWidth, canvasHeight) {
    const scaleX = canvasWidth / this.svgViewBox.width;
    const scaleY = canvasHeight / this.svgViewBox.height;
    const scale = Math.min(scaleX, scaleY) * 0.8;
    
    const offsetX = (canvasWidth - this.svgViewBox.width * scale) / 2;
    const offsetY = (canvasHeight - this.svgViewBox.height * scale) / 2;

    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-this.svgViewBox.x, -this.svgViewBox.y);

    this.svgPaths.forEach((path, index) => {
      this.ctx.beginPath();
      // Use individual letter colors (G, L, W) - skip O which is drawn separately
      const colorIndex = index < 3 ? index : 2; // Map to G, L, W
      this.ctx.strokeStyle = this.letterColors[colorIndex];
      this.ctx.fillStyle = this.letterColors[colorIndex];
      this.ctx.lineWidth = 1 / scale; // Thinner lines
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      // Always add glow effect
      this.ctx.shadowColor = this.letterColors[colorIndex];
      this.ctx.shadowBlur = 10;
      
      this.ctx.stroke(new Path2D(path.getAttribute('d')));
    });

    this.ctx.restore();
  }

  drawWhitneyO(canvasWidth, canvasHeight) {
    // Calculate position for O (center of the logo)
    const centerX = canvasWidth / 1.75;
    const centerY = canvasHeight / 2;
    const r = Math.min(canvasWidth, canvasHeight) * 0.35;
    
    this.ctx.strokeStyle = this.letterColors[2]; // O is at index 2
    this.ctx.lineWidth = 1;
    
    // Always add glow effect
    this.ctx.shadowColor = this.letterColors[2];
    this.ctx.shadowBlur = 10;

    // Whitney-style rotating radial lines
    const numLines = 40;
    for (let i = 0; i < numLines; i++) {
      const angle = this.t * 0.5 + i * 0.2;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(
        centerX + Math.cos(angle) * r,
        centerY + Math.sin(angle) * r
      );
      this.ctx.stroke();
    }
  }

  drawFallbackLetters(canvasWidth, canvasHeight) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const letterWidth = canvasWidth / 4;
    const letterHeight = canvasHeight * 0.8;

    // Draw G, L, W (skip O)
    this.drawG(centerX - letterWidth * 1.5, centerY, letterWidth, letterHeight);
    this.drawL(centerX - letterWidth * 0.5, centerY, letterWidth, letterHeight);
    this.drawW(centerX + letterWidth * 1.5, centerY, letterWidth, letterHeight);
    
    // Draw Whitney O in center
    this.drawWhitneyO(canvasWidth, canvasHeight);
  }

  drawG(x, y, width, height) {
    const w = width * 0.8;
    const h = height * 0.8;
    const strokeWidth = width * 0.1;
    
    this.ctx.strokeStyle = this.letterColors[0]; // G is at index 0
    this.ctx.lineWidth = strokeWidth;
    
    // Always add glow effect
    this.ctx.shadowColor = this.letterColors[0];
    this.ctx.shadowBlur = 15;
    
    this.ctx.beginPath();
    
    // G shape: vertical line, horizontal top, vertical right, horizontal bottom, small horizontal inside
    this.ctx.moveTo(x - w/2, y - h/2);
    this.ctx.lineTo(x - w/2, y + h/2);
    this.ctx.lineTo(x + w/2, y + h/2);
    this.ctx.lineTo(x + w/2, y);
    this.ctx.lineTo(x, y);
    this.ctx.moveTo(x - w/2, y - h/2);
    this.ctx.lineTo(x + w/2, y - h/2);
    
    this.ctx.stroke();
  }

  drawL(x, y, width, height) {
    const w = width * 0.8;
    const h = height * 0.8;
    const strokeWidth = width * 0.1;
    
    this.ctx.strokeStyle = this.letterColors[1]; // L is at index 1
    this.ctx.lineWidth = strokeWidth;
    
    // Always add glow effect
    this.ctx.shadowColor = this.letterColors[1];
    this.ctx.shadowBlur = 15;
    
    this.ctx.beginPath();
    
    // L shape: vertical line, horizontal bottom
    this.ctx.moveTo(x - w/2, y - h/2);
    this.ctx.lineTo(x - w/2, y + h/2);
    this.ctx.lineTo(x + w/2, y + h/2);
    
    this.ctx.stroke();
  }

  drawW(x, y, width, height) {
    const w = width * 0.8;
    const h = height * 0.8;
    const strokeWidth = width * 0.1;
    
    this.ctx.strokeStyle = this.letterColors[3]; // W is at index 3
    this.ctx.lineWidth = strokeWidth;
    
    // Always add glow effect
    this.ctx.shadowColor = this.letterColors[3];
    this.ctx.shadowBlur = 15;
    
    this.ctx.beginPath();
    
    // W shape: two V shapes side by side
    this.ctx.moveTo(x - w/2, y - h/2);
    this.ctx.lineTo(x - w/4, y + h/2);
    this.ctx.lineTo(x, y - h/4);
    this.ctx.lineTo(x + w/4, y + h/2);
    this.ctx.lineTo(x + w/2, y - h/2);
    
    this.ctx.stroke();
  }
}

customElements.define('glow-logo', GlowLogo);