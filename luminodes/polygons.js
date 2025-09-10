// Stacked polygons drawing module
import { SETTINGS, UTILS } from '../settings.js';

export class PolygonsLuminode {
  constructor(canvasDrawer) {
    this.canvasDrawer = canvasDrawer;
    this.ctx = canvasDrawer.getContext();
    this.dimensions = canvasDrawer.getDimensions();
    this.polygonShapes = [];
    this.lastPolySig = '';
  }

  draw(t, notes) {
    if (!notes || notes.length === 0) return;

    // Update dimensions in case canvas was resized
    this.dimensions = this.canvasDrawer.getDimensions();

    const sig = notes.map(n => n.midi).sort().join('-');
    if (sig !== this.lastPolySig) {
      this.polygonShapes = this.generatePolygonShapes(notes);
      this.lastPolySig = sig;
    }

    this.ctx.save();
    this.ctx.translate(this.dimensions.width / 2, this.dimensions.height / 2);

    this.polygonShapes.forEach(shape => this.canvasDrawer.drawWobblyContour(shape, t));

    this.ctx.restore();
  }

  generatePolygonShapes(notes) {
    const shapeCount = Math.max(3, notes.length);
    const maxSize = SETTINGS.MODULES.POLYGONS.MAX_SIZE;
    const spacing = SETTINGS.MODULES.POLYGONS.SPACING;
    const shapes = [];

    for (let i = 0; i < shapeCount; i++) {
      const layers = Math.floor(SETTINGS.MODULES.POLYGONS.BASE_LAYERS + Math.random() * (SETTINGS.MODULES.POLYGONS.MAX_LAYERS - SETTINGS.MODULES.POLYGONS.BASE_LAYERS));
      const size = maxSize - i * spacing;
      const angleOffset = Math.random() * Math.PI;

      const shape = {
        layers: [],
        baseAngle: angleOffset,
        color: SETTINGS.COLORS.POLYGON_COLORS[i % SETTINGS.COLORS.POLYGON_COLORS.length]
      };

      for (let j = 0; j < layers; j++) {
        shape.layers.push({
          radius: size - j * SETTINGS.MODULES.POLYGONS.LAYER_OFFSET,
          jitter: SETTINGS.MODULES.POLYGONS.JITTER_BASE + j * SETTINGS.MODULES.POLYGONS.JITTER_INCREMENT,
          sides: SETTINGS.MODULES.POLYGONS.BASE_SIDES + Math.floor(Math.random() * SETTINGS.MODULES.POLYGONS.SIDES_VARIATION)
        });
      }

      shapes.push(shape);
    }

    return shapes;
  }
}
