## Geometric Light Oscillation Workstation

*A generative visual playground for sound-reactive geometry*

---

## What is G.L.O.W.?

G.L.O.W. is a real-time visual instrument that transforms your music into geometric light patterns. Inspired by pioneers of kinetic art like Jesús Rafael Soto, Gego, and John Whitney, it creates structured, evolving geometries that renders with your sound (MIDI input) in real time.


## Getting Started

### Quick Setup
1. **Open the application** in Chrome browser
2. **Click "Start Visualizer"** to initialize MIDI
3. **Connect your MIDI device** (keyboard, controller, etc.)
4. **Map a track with a visual pattern (luminodes)** and watch the geometry unfold!

### System Requirements
- Modern web browser (Chrome recommended)
- MIDI device (keyboard, controller, or software)
- Optional: Drawing tablet for additional control
- File API support (for scene saving/loading)

---

## How It Works

### The Track System
G.L.O.W. works like a digital audio workstation (DAW) with **4 independent tracks**:

- **Each track** can control a different luminodes
- **Assign any MIDI device** to any track
- **Mute or solo tracks** for creative control
- **Mix and match** different visual patterns

### Visual Effects (Luminodes)
Choose from 16 unique visual patterns, each inspired by geometric art:

**Classic Patterns:**
- **Lissajous Curves** - Elegant harmonic relationships
- **Harmonograph** - Complex patterns with natural damping
- **Sine Waves** - Pure harmonic visualizations
- **Triangle** - Rotating triangular animations
- **Polygons** - Stacked multi-sided shapes with organic deformation

**3D Geometry:**
- **Sphere** - Wireframe sphere with 3D rotation and deformation
- **Noise Valley** - 3D terrain with noise-based height fields
- **Catenoid** - 3D minimal surface with parametric deformation

**Art-Inspired Patterns:**
- **Soto Grid** - Inspired by kinetic artist Jesús Rafael Soto
- **Gego Networks** - Based on Gego's wire sculptures
- **Gego Shapes** - Geometric constructions with structural connections
- **Whitney Lines** - Radial patterns from computer animation pioneer John Whitney

**Natural Patterns:**
- **Phyllotaxis** - Spiral patterns found in nature
- **Moire Circles** - Concentric circles with optical effects

**Abstract Structures:**
- **Woven Net** - Interlaced geometric structures

---

## Using the Interface

### Main Controls
- **🎛️ Track Panel** - Open the track management interface
- **🎨 Canvas Tab** - Adjust canvas and color settings
- **⚙️ Tablet Tab** - Configure drawing tablet settings
- **💾 Save Scene** - Export your current configuration
- **C** - Clear the canvas
- **Cmd+S / Ctrl+S** - Quick save scene

### Track Management
1. **Open the track panel** by clicking the 🎛️ button
2. **Assign MIDI devices** to tracks using the dropdown menus
3. **Choose visual effects** for each track
4. **Use M to mute** or **S to solo** tracks
5. **Solo overrides mute** - soloed tracks will always play
6. **Multiple tracks can share the same MIDI device** - perfect for layering different visual effects

### Trajectory Motion System
Each track features spatial motion controls inspired by John Whitney's non-central motion principles:

**Motion Controls (per track):**
- **Enable Motion** - Toggle trajectory motion on/off (disabled by default)
- **Type** - Choose from three motion patterns:
  - **Whitney Oscillations** - Elegant coupled harmonic motion
  - **Lissajous Curves** - Musical harmonic relationships
  - **Precessing Orbit** - Non-central circular motion with moving centers
- **Rate** - Motion speed (0.01 - 2.0x)
- **Amplitude** - Spatial range (0 - 200 pixels)
- **Ratio A/B/C** - Harmonic frequency relationships (0.1 - 5.0)

**How to Use:**
1. **Select a track** and choose a luminode
2. **Check "Enable Motion"** to activate trajectory movement
3. **Choose a trajectory type** from the dropdown
4. **Adjust parameters** using the sliders:
   - Higher **Rate** = faster motion
   - Higher **Amplitude** = larger movement range
   - Different **Ratios** = unique harmonic relationships
5. **Experiment** with different combinations for unique motion patterns

**Motion Examples:**
- **Whitney Oscillations** with ratios 1:2:3 create elegant figure-8 patterns
- **Lissajous Curves** with ratios 3:4 create complex harmonic loops
- **Precessing Orbit** creates mesmerizing spiral-like motion

### Canvas & Color Settings
Access the **🎨 Canvas tab** to customize your visual experience:

**Canvas Settings:**
- **Clear Alpha** - Controls the ghostly trail effect (0-1)
- **Background Color** - Change the canvas background color

**Color Palettes:**
- **Soto Palette** - Main color scheme for geometric luminodes
- **Polygon Colors** - Specific colors for polygon shapes

**Pitch to Color Generator:**
- **Hue Factor** - Adjust how MIDI notes map to colors (1-100)
- **Real-time preview** - See how different notes will be colored
- **Affects multiple luminodes** - Harmonograph, Lissajous, Sinewave, Triangle, Woven Net, Whitney Lines, Moire Circles, Phyllotaxis, Noise Valley, Catenoid

### Drawing Tablet Support
- **Connect a drawing tablet** for pressure-sensitive control
- **Draw directly on screen** to influence visuals
- **Pressure affects** visual intensity and parameters

### Scene Management
Save and share your visual configurations:

**Saving Scenes:**
1. **Click the Save Scene button** (💾) or press `Cmd+S` / `Ctrl+S`
2. **Enter a scene name** in the dialog
3. **Click "Save Scene"** to download a `.glow` file

**What Gets Saved:**
- **Track configurations** - MIDI device assignments and luminode mappings
- **Trajectory motion settings** - Motion types, rates, amplitudes, and ratios per track
- **Luminode settings** - Only for active luminodes (optimized file size)
- **Canvas settings** - Background color, clear alpha, CRT effects
- **Color palettes** - Custom color schemes and pitch-to-color mapping
- **Tablet settings** - Line width, geometric modes, connection preferences
- **MIDI configuration** - Output device settings and octave ranges

**Scene Files:**
- **Format**: JSON files with `.glow` extension
- **Naming**: Automatic unix timestamp naming (e.g., `glow-scene-1704096000.glow`)
- **Size**: Optimized to only include active configurations

---

## Inspiration & Background

G.L.O.W. draws inspiration from the pioneers of geometric and kinetic art:

- **Jesús Rafael Soto** - Venezuelan kinetic artist known for interactive installations
- **Gego (Gertrud Goldschmidt)** - German-Venezuelan artist who created intricate wire sculptures
- **John Whitney** - Father of computer animation and abstract geometric films, whose non-central motion principles inspired the trajectory system
- **Early Computer Graphics** - The aesthetic of 1960s-80s computer art

Each visual pattern is designed to honor these artistic traditions while providing modern, real-time control for contemporary musicians and artists. The trajectory motion system specifically implements Whitney's mathematical approach to harmonic motion, allowing luminodes to move through space with the same elegant precision found in his pioneering computer animations.

## Repository

**G.L.O.W.** is an open-source project built by **Rafael Becerra**

- **GitHub Repository**: [https://github.com/rafaelbecks/glow](https://github.com/rafaelbecks/glow)
- **Live Demo**: [https://glow-visualizer.netlify.app/](https://glow-visualizer.netlify.app/)
