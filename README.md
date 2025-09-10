# G.L.O.W. (Geometric Light Oscillation Workstation)

A generative visual playground for sound-reactive geometry

G.L.O.W. is a lightweight, modular, MIDI and HID reactive visual engine that draws inspiration from early computer graphics, kinetic art, geometric abstraction, and pioneers like Jesús Rafael Soto, Gego and John Whitney. It allows musicians, performers, and artists to visualize sound through structured, evolving geometries in real time.

## Project Structure

```
glow-visualizer/
├── index.html              # Main HTML file with clean UI
├── main.js                 # Application bootstrap and orchestration
├── settings.js             # Configuration constants and utilities
├── midi.js                 # MIDI event handling and device management
├── tablet-manager.js       # HID device handling for drawing tablets
├── canvas-drawer.js        # Canvas drawing operations and utilities
├── ui.js                   # UI controls and event listeners
└── luminodes/              # Individual drawing modules
    ├── index.js                    # Luminode exports
    ├── lissajous.js               # Lissajous curves
    ├── harmonograph.js            # Harmonograph patterns
    ├── sphere.js                  # Wire sphere visualization
    ├── gego-net.js                # Gego network patterns
    ├── gego-shape.js              # Gego shape constructions
    ├── soto-grid.js               # Soto grid animations
    ├── whitney-lines.js           # Whitney line patterns
    ├── phyllotaxis.js             # Phyllotaxis spirals
    ├── moire-circles.js           # Moire circle patterns
    ├── woven-net.js               # Woven net structures
    ├── sinewave.js                # Sine wave visualizations
    ├── triangle.js                # Triangle animations
    ├── scanline-gradients.js      # Scanline gradient effects
    └── polygons.js                # Stacked polygon patterns
```

## Architecture Overview

### Main Components

1. **Main Script (`main.js`)**
   - Bootstraps the entire application
   - Orchestrates all modules
   - Handles the main animation loop
   - Manages module communication

2. **Settings (`settings.js`)**
   - Centralized configuration
   - Constants for all modules
   - Utility functions
   - MIDI channel mappings

3. **MIDI Manager (`midi.js`)**
   - Handles MIDI device connections
   - Manages note on/off events
   - Tracks active notes per channel
   - Provides clean API for note data

4. **Tablet Manager (`tablet-manager.js`)**
   - Handles HID device connections (UGEE Q6)
   - Manages tablet drawing functionality
   - Provides pressure-sensitive drawing
   - Handles stroke management

5. **Canvas Drawer (`canvas-drawer.js`)**
   - Centralized canvas operations
   - Drawing utilities and helpers
   - Canvas resizing and management
   - Common drawing functions

6. **UI Manager (`ui.js`)**
   - Handles all UI interactions
   - Event listener management
   - Status display and feedback
   - Control state management

7. **Luminodes (`luminodes/`)**
   - Individual drawing modules inspired by geometric art pioneers
   - Each module handles one visual pattern
   - Consistent interface across modules
   - Easy to add new visual patterns
   - **Available Luminodes:**
     - **Lissajous**: Classic Lissajous curves with harmonic relationships
     - **Harmonograph**: Complex harmonic patterns with damping
     - **Sphere**: Wireframe sphere with 3D rotation and deformation
     - **Gego Net**: Network patterns inspired by Gego's work
     - **Gego Shape**: Geometric shape constructions with connections
     - **Soto Grid**: Grid-based animations inspired by Jesús Rafael Soto
     - **Whitney Lines**: Radial line patterns inspired by John Whitney
     - **Phyllotaxis**: Spiral patterns based on natural phyllotaxis
     - **Moire Circles**: Concentric circle patterns with moire effects
     - **Woven Net**: Interlaced geometric structures
     - **Sinewave**: Harmonic wave visualizations
     - **Triangle**: Rotating triangle animations
     - **Scanline Gradients**: Gradient effects with scanline overlays
     - **Polygons**: Stacked polygon patterns with organic deformation

## Usage

1. Run `python3 -m http.server 8000`  and open http://localhost:8000/ in Chrome
2. Click "Start Visualizer" to initialize MIDI
3. Use the settings gear (⚙️) to access controls when no drawing is active
4. Connect tablet, adjust settings, and toggle color mode as needed
5. Press **Ctrl+Option+Y** to toggle status messages
6. Press **C** to clear the canvas

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

## Configuration

All configuration is centralized in `settings.js`:

- **Canvas settings**: Clear alpha, background color
- **MIDI settings**: Note constants, velocity scaling
- **Color palettes**: SOTO palette, polygon colors
- **Module settings**: Parameters for each luminode
- **Tablet settings**: Device IDs, coordinate ranges
- **Animation settings**: Timing and fade parameters

### MIDI Channel Mappings

G.L.O.W. supports 15 MIDI channels mapped to different luminodes:

- **Bus 1**: Lissajous curves
- **Bus 2**: Harmonograph patterns
- **Bus 3**: Wire sphere
- **Bus 4**: Gego network
- **Bus 5**: Sine wave
- **Bus 6**: Triangle animations
- **Bus 7**: Moire circles
- **Bus 8**: Gego shapes
- **Bus 9**: Soto grid
- **Bus 10**: Soto grid (rotated)
- **Bus 11**: Scanline gradients
- **Bus 12**: Phyllotaxis spirals
- **Bus 13**: Woven net
- **Bus 14**: Stacked polygons
- **Bus 15**: Whitney lines

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