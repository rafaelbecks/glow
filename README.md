# G.L.O.W. (Geometric Light Oscillation Workstation)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
![Web MIDI API](https://img.shields.io/badge/Web%20MIDI%20API-supported-green)
![Web HID API](https://img.shields.io/badge/Web%20HID%20API-supported-green)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

A generative visual playground for sound-reactive geometry

G.L.O.W. is a lightweight, modular, MIDI and HID reactive visual engine that draws inspiration from early computer graphics, kinetic art, geometric abstraction, and pioneers like Jesús Rafael Soto, Gego,  John Whitney and Thomas Wilfred. It allows musicians, performers, and artists to visualize sound through structured, evolving geometries in real time.

## Demo

Play with it: https://glow.luminode.studio/

**Demos & Luminodes Showcase**: [YouTube Playlist](https://www.youtube.com/playlist?list=PLPLNsAMGizPvOxgBN0TJDBIRIPvcY6njN)

## Architecture

**Core Modules:**
- **Main Script**: Application orchestration and animation loop with track-based luminode management
- **MIDI Manager**: Device connections and note tracking with multi-device support
- **Track Manager**: MIDI channel routing and track management
- **Trajectory System**: Whitney-style motion patterns for spatial animation
- **Modulation System**: LFO-style parameter modulation for dynamic visual evolution
- **Side Panel**: Modular GUI with separated concerns:
  - `SidePanelBase`: Core panel functionality and coordination
  - `TrackUIManager`: Track rendering and controls
  - `LuminodeConfigManager`: Luminode configuration UI
  - `ModulationUIManager`: Modulation system controls and interface
  - `CanvasUIManager`: Canvas settings and effects
- **Tablet Manager**: HID device support for getting events from a drawing tablet
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
| **Trefoil Knot** | 3D mathematical knot with multiple laces, node mode for note-responsive lace count |

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

### Optical Patterns
| Luminode | Description |
|----------|-------------|
| **Spherical Lens** | Lens distortion with spherical aberration, creating caustic patterns and chromatic effects |

### Abstract Structures
| Luminode | Description |
|----------|-------------|
| **Woven Net** | Interlaced geometric mesh structures |


## Canvas Effects

G.L.O.W. includes additional canvas-level effects that enhance the visual experience:

### Lumia Effect
- **Global blur filter** - Applies blur effect to all luminodes (0-100px)

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

*Thanks to [grained.js](https://github.com/sarathsaleem/grained/) for their elegant noise implementation.*

### Dither Effect
- **Retro display simulation** - Applies ordered dithering for classic computer graphics aesthetic
- **Saturation control** - Adjust color saturation (0-1)
- **RGB table values** - Fine-tune dithering patterns for each color channel

## Track-Based Luminode System

G.L.O.W. uses a track-based luminode system that creates individual instances for each track:

### Features
- **Instance-Based**: Each track gets its own luminode instance when assigned
- **Multiple Instances**: Support for multiple tracks using the same luminode type (e.g., 4 lissajous curves)
- **Independent Configuration**: Each instance has its own positioning, layout, and trajectory motion

## Modulation System

G.L.O.W. includes a modulation system similar to LFOs (Low-Frequency Oscillators) on synthesizers. Each track can have up to 4 modulators that automatically animate specific luminode parameters over time.

**How It Works:**
- **Waveform Shapes**: Choose from sine, square, triangle, or sawtooth waveforms
- **Rate Control**: Adjust oscillation speed (0.001 - 2 Hz) for slow, evolving changes or rapid modulation
- **Depth Control**: Set modulation intensity (0-100%) to control how much the parameter varies
- **Offset**: Shift the base value up or down within the parameter's range
- **Per-Track Targeting**: Modulators automatically apply to the luminode assigned to their track
- **Parameter Selection**: Choose any numeric parameter (size, rotation speed, line width, etc.) to modulate

Think of it like an LFO modulating a filter cutoff or oscillator pitch - but here it's controlling visual parameters like size, rotation, or line width. Modulators are non-destructive and only affect rendering in real-time, preserving your base configuration values.

*Note: This is the first version of the modulation system and is under active development.*

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

## MIDI Mappings

G.L.O.W. supports custom MIDI CC mappings for hardware controllers. MIDI mappings allow you to control tracks, luminodes, layout, and motion parameters via MIDI Control Change messages.

**How It Works:**
- **Mapping files** - JSON configuration files in `midi-mappings/` directory
- **Track selection** - Map CC numbers to select active tracks
- **Luminode selection** - Control which luminode type is active
- **Layout control** - Map X/Y position and rotation
- **Motion control** - Control trajectory motion parameters
- **Luminode parameters** - Map CC ranges to luminode-specific controls

**Available Mappings:**
- `example-mapping.json` - Reference mapping configuration
- `arturia-keylab-essential-49-mk3.json` - Arturia KeyLab Essential 49 mk3 preset

*Note: MIDI mapping system is a work in progress and subject to changes.*

## Hardware Controller

As part of the G.L.O.W. project, a dedicated hardware controller is in development. The hardware controller will run G.L.O.W. as a standalone visual instrument with physical controls, embedded display, and MIDI integration.

📖 **[Hardware Documentation →](hardware/README.md)**  
*Goals, architecture, and development plan for the hardware controller*

## Keyboard Shortcuts

- `Cmd+S` / `Ctrl+S`: Save current scene
- `Cmd+U` / `Ctrl+U`: Clear canvas
- `Cmd+I` / `Ctrl+I`: Toggle UI icons and project name visibility
