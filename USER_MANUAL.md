## Geometric Light Oscillation Workstation

*A generative visual playground for sound-reactive geometry*

---

## What is G.L.O.W.?

G.L.O.W. is a real-time visual instrument that transforms your music into geometric light patterns. Inspired by pioneers of kinetic art like Jesús Rafael Soto, Gego, and John Whitney, it creates structured, evolving geometries that renders with your sound (MIDI input) in real time.

**Demos & Luminodes Showcase**: [YouTube Playlist](https://www.youtube.com/playlist?list=PLPLNsAMGizPvOxgBN0TJDBIRIPvcY6njN)

## Getting Started

### Quick Setup
1. **Connect your MIDI device** (keyboard, controller, etc.)
2. **Open the application** in Chrome browser
3. **Click "Start"** to initialize MIDI
4. **Click on the cube icon on the top right. Map a track with a visual pattern (luminodes)** and watch the geometry unfold!
5. **Read this manual on the triangle icon on the top right**

### System Requirements
- Modern web browser (Chrome recommended)
- MIDI device (keyboard, controller, or software)
- Optional: Drawing tablet for additional control
- File API support (for scene saving/loading)

---

## How It Works

### The Track System
G.L.O.W. works like a digital audio workstation (DAW) with **4 independent tracks**:

- **Each track** can control a different luminode (visual pattern)
- **Multiple tracks can use the same luminode type** - (e.g create 4 lissajous curves with different positioning).
- **Assign any MIDI device** to any track
- **Mute or solo tracks** for creative control
- **Mix and match** different visual patterns
- **Each luminode instance is independent** - different positioning, motion, and configuration


### Modulation System
G.L.O.W. includes a modulation system that works like LFOs (Low-Frequency Oscillators) on synthesizers. It automatically animates luminode parameters over time, creating evolving visual effects.

**Access the Modulation Tab:**
- Open the side panel (🎛️) and click the **"MODULATION"** tab
- Add as many modulators as you need

**Modulator Controls:**
- **Waveform** - Choose from sine, square, triangle, or sawtooth shapes (with visual preview)
- **Track** - Select which track to apply modulation to (automatically uses that track's luminode)
- **Parameter** - Pick any numeric parameter to modulate (size, rotation, line width, segments, etc.)
- **Rate** - Oscillation speed (0.001 - 2 Hz)
- **Depth** - Modulation intensity (0-100%)
- **Offset** - Base value shift within the parameter range
- **Enable/Disable** - Toggle modulation on/off without removing it


### MIDI Mappings

G.L.O.W. supports custom MIDI CC mappings for hardware controllers. This allows you to control tracks, luminodes, layout, and motion parameters directly from your MIDI controller.

**How It Works:**
- Mapping files are JSON configurations stored in the `midi-mappings/` directory
- Map CC numbers to track selection, luminode selection, layout (X/Y/rotation), and motion parameters
- Each mapping file can target a specific MIDI device
- Luminode parameters can be mapped to CC ranges for hands-on control

**Available Mappings:**
- `example-mapping.json` - Reference configuration showing all available mappings
- `arturia-keylab-essential-49-mk3.json` - Preset for Arturia KeyLab Essential 49 mk3

*Note: MIDI mapping system is a work in progress and subject to changes.*

## Repository

**G.L.O.W.** is an open-source project built by **Rafael Becerra**

- **GitHub Repository**: [https://github.com/rafaelbecks/glow](https://github.com/rafaelbecks/glow)
- **Live Demo**: [https://glow-visualizer.netlify.app/](https://glow-visualizer.netlify.app/)
