# G.L.O.W. (Geometric Light Oscillation Workstation)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![Web MIDI API](https://img.shields.io/badge/Web%20MIDI%20API-supported-green)
![Web HID API](https://img.shields.io/badge/Web%20HID%20API-supported-green)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

A generative visual playground for sound-reactive geometry

G.L.O.W. is a lightweight, modular, MIDI and HID reactive visual engine that draws inspiration from early computer graphics, kinetic art, geometric abstraction, and pioneers like Jesús Rafael Soto, Gego and John Whitney. It allows musicians, performers, and artists to visualize sound through structured, evolving geometries in real time.

## Demo

Play with it: https://glow-visualizer.netlify.app/

## Architecture

**Core Modules:**
- **Main Script**: Application orchestration and animation loop with track-based luminode management
- **MIDI Manager**: Device connections and note tracking with multi-device support
- **Track Manager**: MIDI channel routing and track management with trajectory motion
- **Trajectory System**: Whitney-style motion patterns for spatial animation
- **Side Panel**: Unified interface for tracks, tablet, and canvas settings
- **Tablet Manager**: HID device support with geometric shape detection
- **Canvas Drawer**: Centralized drawing operations
- **UI Manager**: Interface and event handling
- **Project Manager**: Scene saving and state management

**Luminodes (`luminodes/`):**
Individual drawing modules inspired by geometric art pioneers.
### Classic Patterns
| Luminode | Description |
|----------|-------------|
| **Lissajous** | Harmonic curves with frequency relationships |
| **Harmonograph** | Complex damped harmonic patterns |
| **Sinewave** | Harmonic wave visualizations |
| **Triangle** | Rotating triangular animations |
| **Polygons** | Stacked multi-sided shapes with organic deformation |

### 3D Geometry
| Luminode | Description |
|----------|-------------|
| **Sphere** | 3D wireframe sphere with rotation and deformation |
| **Noise Valley** | 3D terrain with noise-based height fields |
| **Catenoid** | 3D minimal surface with parametric deformation |
| **Line Cylinder** | 3D cylinder with vertical lines that opens and closes |

### Art-Inspired
| Luminode | Description |
|----------|-------------|
| **Gego Net** | Dynamic node networks with organic connections |
| **Gego Shape** | Geometric constructions with structural connections |
| **Soto Grid** | Animated striped grids with moire effects |
| **Whitney Lines** | Radial line patterns with rotational motion |

### Natural Patterns
| Luminode | Description |
|----------|-------------|
| **Phyllotaxis** | Spiral dot patterns based on golden angle |
| **Moire Circles** | Concentric circles with interference patterns |

### Abstract Structures
| Luminode | Description |
|----------|-------------|
| **Woven Net** | Interlaced geometric mesh structures |

## Track-Based Luminode System

G.L.O.W. uses a track-based luminode system that creates individual instances for each track:

### Features
- **Instance-Based**: Each track gets its own luminode instance when assigned
- **Multiple Instances**: Support for multiple tracks using the same luminode type (e.g., 4 lissajous curves)
- **Independent Configuration**: Each instance has its own positioning, layout, and trajectory motion

## Trajectory Motion System

G.L.O.W. features a trajectory motion system inspired by John Whitney's non-central motion principles. Each track can have its luminodes move through space using mathematically precise motion patterns:

### Motion Types
| Trajectory | Description | Formula |
|------------|-------------|---------|
| **Whitney Oscillations** | Coupled harmonic motion with cos/sin combinations | `x = R1 * cos(a*t + φ1)`, `y = R2 * sin(b*t + φ2)` |
| **Lissajous Curves** | Balanced harmonic motion perfect for musical coupling | `x = A * sin(a*t + δ1)`, `y = B * sin(b*t + δ2)` |
| **Precessing Orbit** | Non-central motion with moving centers (nested circular orbits) | Moving center with orbiting elements |
| **X-Axis Movement** | Simple horizontal oscillation | `x = A * sin(a*t + φ)` |
| **Y-Axis Movement** | Simple vertical oscillation | `y = A * sin(a*t + φ)` |
| **Triangle Wave** | Linear sawtooth motion in X and Y | Triangle wave function |
| **Circular Motion** | Perfect circular motion in XY plane | `x = A * cos(a*t + φ)`, `y = A * sin(a*t + φ)` |

### Per-Track Controls
- **Enable Motion** - Toggle trajectory motion on/off
- **Motion Rate** - Speed control (0.01 - 2.0x)
- **Amplitude** - Spatial range (0 - 200 pixels)
- **Ratio A/B/C** - Harmonic frequency relationships (0.1 - 5.0)
- **Trajectory Type** - Choose from 7 motion patterns (Whitney, Lissajous, Orbit, X-Axis, Y-Axis, Triangle, Circle)
- **Invert Motion** - Mirror the trajectory for symmetric effects

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

  draw(t, notes, layout = { x: 0, y: 0, rotation: 0 }) {
    // Your drawing logic here
    // t = time in seconds
    // notes = array of active notes for this track
    // layout = track-specific positioning and rotation
    
    // Apply layout transform for positioning
    this.canvasDrawer.applyLayoutTransform(layout);
    
    // Your drawing code here
    
    // Restore transform
    this.canvasDrawer.restoreLayoutTransform();
  }
}
```

3. Add the export to `luminodes/index.js`
4. Add to the luminode factory in `main.js`:
   ```javascript
   this.luminodeFactory = {
     // ... existing luminodes
     myPattern: MyPatternLuminode
   }
   ```
5. Add to available luminodes in `track-manager.js`
6. Add configuration settings in `settings.js` if needed

The new luminode will automatically work with the track-based system, supporting multiple instances and efficient rendering.

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
- Web MIDI API support (for MIDI input/output)
- Web HID API support (for tablet functionality on macOS/Linux)
- Canvas 2D context support
- File API support (for scene saving/loading)

## Keyboard Shortcuts

- `Cmd+S` / `Ctrl+S`: Save current scene
- `C`: Clear canvas
- `I`: Toggle UI icons visibility
