# G.L.O.W. (Geometric Light Oscillation Workstation)

A generative visual playground for sound-reactive geometry

G.L.O.W. is a lightweight, modular, MIDI and HID reactive visual engine that draws inspiration from early computer graphics, kinetic art, geometric abstraction, and pioneers like Jesús Rafael Soto, Gego and John Whitney. It allows musicians, performers, and artists to visualize sound through structured, evolving geometries in real time.

## Demo

Play with it: https://glow-visualizer.netlify.app/

## Architecture

**Core Modules:**
- **Main Script**: Application orchestration and animation loop
- **MIDI Manager**: Device connections and note tracking
- **Track Manager**: MIDI channel routing and track management
- **Tablet Manager**: HID device support with geometric shape detection
- **Tablet Panel**: Tablet configuration and geometric drawing controls
- **Canvas Drawer**: Centralized drawing operations
- **UI Manager**: Interface and event handling

**Luminodes (`luminodes/`):**
Individual drawing modules inspired by geometric art pioneers

| Luminode | Description |
|----------|-------------|
| **Lissajous** | Harmonic curves with frequency relationships |
| **Harmonograph** | Complex damped harmonic patterns |
| **Sphere** | 3D wireframe sphere with rotation and deformation |
| **Gego Net** | Dynamic node networks with organic connections |
| **Gego Shape** | Geometric constructions with structural connections |
| **Soto Grid** | Animated striped grids with moire effects |
| **Whitney Lines** | Radial line patterns with rotational motion |
| **Phyllotaxis** | Spiral dot patterns based on golden angle |
| **Moire Circles** | Concentric circles with interference patterns |
| **Woven Net** | Interlaced geometric mesh structures |
| **Sinewave** | Harmonic wave visualizations |
| **Triangle** | Rotating triangular animations |
| **Polygons** | Stacked multi-sided shapes with organic deformation |

## Local Usage

Run `python3 -m http.server 8000`  and open http://localhost:8000/ in Chrome.

## Adding New Luminodes

To add a new drawing module:

1. Create a new file in `luminodes/` (e.g., `my-pattern.js`)
2. Export a class that follows the luminode pattern:

```javascript
export class MyPatternLuminode {
  constructor(canvasDrawer) {
    this.canvasDrawer = canvasDrawer;
    this.ctx = canvasDrawer.getContext();
    this.dimensions = canvasDrawer.getDimensions();
  }

  draw(t, notes) {
    // Your drawing logic here
    // t = time in seconds
    // notes = array of active notes for this channel
  }
}
```

3. Add the export to `luminodes/index.js`
4. Import and instantiate in `main.js`
5. Add the channel mapping in `settings.js`

## Artistic Inspiration

G.L.O.W. draws inspiration from several pioneers of geometric and kinetic art:

- **Jesús Rafael Soto**: Venezuelan kinetic artist known for his interactive installations and geometric abstractions
- **Gego (Gertrud Goldschmidt)**: German-Venezuelan artist who created intricate wire sculptures and spatial drawings
- **Nelson Max**: Computer graphics pioneer who created some of the first computer-generated animations
- **John Whitney**: Father of computer animation, known for his abstract geometric films
- **Early Computer Graphics**: The aesthetic of 1960s-80s computer art and visualization
- **Kinetic Art**: Movement-based art that responds to viewer interaction or environmental factors

## Browser Requirements

- Modern browser with ES6 module support
- Web MIDI API support
- Web HID API support (for tablet functionality)
- Canvas 2D context support
