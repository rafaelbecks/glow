class GlowCanvas extends HTMLElement {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private t = 0;

  connectedCallback() {
    this.canvas = document.createElement('canvas');
    this.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    window.addEventListener('resize', this.resize.bind(this));
    this.resize();
    requestAnimationFrame(this.render.bind(this));
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  render() {
    this.t += 1 / 60;

    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Demo drawing: rotating lines like a Whitney reference
    const cx = width / 2;
    const cy = height / 2;
    const r = 200;
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 0.8;

    for (let i = 0; i < 40; i++) {
      const angle = this.t * 0.5 + i * 0.2;
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      this.ctx.stroke();
    }

    requestAnimationFrame(this.render.bind(this));
  }
}

customElements.define('glow-canvas', GlowCanvas);
