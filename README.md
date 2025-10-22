# G.L.O.W. (Geometric Light Oscillation Workstation)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![Web MIDI API](https://img.shields.io/badge/Web%20MIDI%20API-supported-green)
![Web HID API](https://img.shields.io/badge/Web%20HID%20API-supported-green)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

A generative visual playground for sound-reactive geometry

G.L.O.W. is a lightweight, modular, MIDI and HID reactive visual engine that draws inspiration from early computer graphics, kinetic art, geometric abstraction, and pioneers like Jesús Rafael Soto, Gego,  John Whitney and Thomas Wilfred. It allows musicians, performers, and artists to visualize sound through structured, evolving geometries in real time.

## Demo

Play with it: https://glow-visualizer.netlify.app/

## Architecture

**Core Modules:**
- **Main Script**: Application orchestration and animation loop with track-based luminode management
- **MIDI Manager**: Device connections and note tracking with multi-device support
- **Track Manager**: MIDI channel routing and track management
- **Trajectory System**: Whitney-style motion patterns for spatial animation
- **Side Panel**: Unified GUI for tracks, tablet, and canvas settings
- **Tablet Manager**: HID device support for getting events from a drawing tablet.
- **Canvas Drawer**: Centralized drawing operations
- **UI Manager**: Interface and event handling
- **Project Manager**: Scene saving and state management (In development)

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
| **Diamond** | 3D diamond shape with geometric facets |
| **Cube** | 3D wireframe cube with rotation and scaling |

### Art-Inspired
| Luminode | Description |
|----------|-------------|
| **Gego Net** | Dynamic node networks with organic connections |
| **Gego Shape** | Geometric constructions with structural connections |
| **Soto Grid** | Animated striped grids with moire effects |
| **Whitney Lines** | Radial line patterns with rotational motion |
| **Clavilux** | Thomas Wilfred-inspired light compositions with organic shapes |

### Natural Patterns
| Luminode | Description |
|----------|-------------|
| **Phyllotaxis** | Spiral dot patterns based on golden angle |
| **Moire Circles** | Concentric circles with interference patterns |

### Abstract Structures
| Luminode | Description |
|----------|-------------|
| **Woven Net** | Interlaced geometric mesh structures |

*Note: The Lumia Effect is a global canvas filter, separate from the individual luminode patterns.*

## Canvas Effects

G.L.O.W. includes additional canvas-level effects that enhance the visual experience:

### Grid Overlay
- **Configurable grid lines** - Adjust X and Y line counts (2-50)
- **Custom grid color** - Choose any color for the grid

### CRT Effect
- **Retro monitor simulation** - Classic CRT display aesthetics
- **Intensity control** - Adjust CRT effect strength (0-100%)

### Noise Overlay
- **Animated grain texture** - Adds film grain aesthetic to the canvas
- **Pattern controls** - Adjust width and height of noise patterns (50-200px)
- **Opacity control** - Fine-tune grain intensity (1-20%)
- **Density settings** - Control grain density (0.5-2x)
- **Grain size** - Adjust individual grain width and height (0.5-3px)
- **Animation toggle** - Enable/disable animated grain movement

*Thanks to [grained.js](https://github.com/bfred-it/grained) for their elegant noise implementation.*

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
| **Lissajous Curves** | Balanced harmonic motion | `x = A * sin(a*t + δ1)`, `y = B * sin(b*t + δ2)` |
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

## Design Philosophy

G.L.O.W. follows a set of core principles that guide its development and design decisions. These principles ensure the project remains focused, elegant, and true to its artistic roots.

📖 **[Read the Zen of G.L.O.W. →](ZEN_OF_GLOW.md)**  
*The guiding principles that shape every aspect of the project*

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
