## Geometric Light Oscillation Workstation

*A generative visual playground for sound-reactive geometry*

---

## What is G.L.O.W.?

G.L.O.W. is a real-time visual instrument that transforms your music into geometric light patterns. Inspired by early computer artists such as Vera Molnár, John Whitney, and kinetic artists like Gego and Soto, it creates structured, evolving geometries that render with your sound (MIDI input) in real time.

**Demos & Luminodes Showcase**: [YouTube Playlist](https://www.youtube.com/playlist?list=PLPLNsAMGizPvOxgBN0TJDBIRIPvcY6njN)

## Getting Started

### Quick Setup
1. **Connect your MIDI device** (keyboard, controller, etc.)
2. **Open the application** in Chrome browser
3. **Click "Start"** to initialize MIDI
4. **Click the cube icon** on the top right to open the side panel. Assign a MIDI device and luminode to a track, then play — geometry follows your notes.
5. **Read this manual** via the triangle icon on the top right

### System Requirements
- Modern web browser (Chrome recommended)
- MIDI device (keyboard, controller, or software)
- File API support (for scene saving/loading)
- Optional / experimental: drawing tablet (see [Tablet Support](#tablet-support-experimental))

---

## How It Works

### The Track System
G.L.O.W. works like a digital audio workstation (DAW) with **4 independent tracks**:

- **Each track** can control a different luminode (visual pattern)
- **Multiple tracks can use the same luminode type** — e.g. four Lissajous curves with different positioning
- **Assign any MIDI device** to any track
- **Mute or solo tracks** for creative control
- **Mix and match** different visual patterns
- **Each luminode instance is independent** — positioning, motion, and configuration

**Selecting a luminode:** In the Tracks tab, click the **Luminode** control to open a picker organized by category (Classic Patterns, 3D Geometry, Art-Inspired, Natural Patterns). Hover a card for a live preview, then click to assign it.

### Modulation System
G.L.O.W. includes a modulation system that works like LFOs (Low-Frequency Oscillators) on synthesizers. It automatically animates luminode parameters over time, creating evolving visual effects.

**Access the Modulation tab:**
- Open the side panel and click **Modulation**
- Add as many modulators as you need

**Modulator Controls:**
- **Waveform** — sine, square, triangle, or sawtooth (with visual preview)
- **Track** — which track to modulate (uses that track’s luminode)
- **Parameter** — numeric luminode params, or canvas filters such as Clear Alpha, Lumia Effect, Invert, and Dither
- **Rate** — oscillation speed (0.001–2 Hz)
- **Depth** — modulation intensity (0–100%)
- **Offset** — base value shift within the parameter range
- **Enable/Disable** — toggle without removing the modulator

### MIDI Mappings

G.L.O.W. supports custom MIDI CC mappings for hardware controllers. This allows you to control tracks, luminodes, layout, and motion parameters directly from your MIDI controller.

**How It Works:**
- Mapping files are JSON configurations stored in the `midi-mappings/` directory
- Map CC numbers to track selection, luminode selection, layout (X/Y/rotation), and motion parameters
- Each mapping file can target a specific MIDI device
- Luminode parameters can be mapped to CC ranges for hands-on control

**Available Mappings:**
- `example-mapping.json` — reference configuration showing all available mappings
- `arturia-keylab-essential-49-mk3.json` — preset for Arturia KeyLab Essential 49 mk3

*Note: MIDI mapping system is a work in progress and subject to changes.*

---

## Canvas Tab

Open the side panel → **Canvas**. This is where you shape the look of the whole scene: trails, color, post effects, shader backgrounds, glass overlays, palettes, and snapshots.

### Canvas Settings

| Control | What it does |
|---|---|
| **Clear Alpha** | How fast previous frames fade. Lower values leave longer trails; higher values clear faster. |
| **Background Color** | Solid background (and page color) when shader backgrounds are off. |
| **CRT Mode** | Retro CRT overlay (scanlines, color separation, flicker). **Intensity** appears when enabled. |
| **Lumia Effect** | Soft blur / glow on the main canvas (0–100 px). |
| **Background Grid** | Reference grid under luminodes. Set **X Lines**, **Y Lines**, and **Grid Color**. |
| **Noise Overlay** | Film-grain layer. Tune animate, opacity, pattern size, density, and grain size. |
| **Dither Overlay** | Bayer-style dither of the scene. Adjust saturation and per-channel table values. |
| **Chromatic Aberration** | RGB channel offset with contrast control. |
| **Invert Filter** | Invert amount on the main canvas (works together with Lumia). |

Clear Alpha, Lumia Effect, Invert Filter, and Dither can also be driven from the **Modulation** tab.

### Color

- **Color Palettes** — Soto palette and polygon color options for luminodes that use them
- **Pitch to Color Generator** — maps MIDI pitch to hue (**Hue Factor** plus a C-scale preview)

### Shader Background

Enable **Shader Background** for a full-screen GPU layer behind your luminodes.

**Fluid simulation modes** (gpu-io):

| Mode | Look |
|---|---|
| **Fluid** | Particle / fluid trails |
| **Pressure** | Pressure-field visualization |
| **Velocity** | Velocity-field visualization |

Shared fluid controls include trail length, background/trail colors, pressure/velocity colors, and **Cursor Mode** (pointer injects force into the simulation).

**Procedural modes** (WebGL2 fragment shaders under `src/shaders/background/`):

| Mode | Look |
|---|---|
| **Portal** | Animated kaleidoscopic portal |
| **Disco Sun Vortex** | Psychedelic sun / vortex field |
| **Balatro** | Spinning liquid / card-style field |
| **Chroma gradients** | Soft noise chroma fields with grain |

Each mode exposes its own parameter folder (time, palette, spin, noise scales, colors, etc.). New procedural modes can be registered — see `src/shaders/background/README.md`.

### Shader Overlays

The **Shader overlays** folder adds a glass / rain layer on top of the scene:

| Effect | What it does |
|---|---|
| **Glass (single)** | One refraction glass panel (size, thickness, IOR, blur, tint, shadow, …) |
| **Glass (bricks)** | Tiled glass bricks with size, offset, and gap |
| **Rain screen** | Distorted rain-like screen (distortion, drop scale, time, drift, sharpness) |

Toggle **Enabled**, then pick an **Effect**.

### Export / Snapshots

Folder **Export (⌘P / Ctrl+P → PNG)**:

- **Format** — PNG or SVG
- **Output scale** — 1–3× for PNG
- **Download snapshot** — saves the frame

PNG composites shader background, luminodes, tablet layer, and enabled overlays (noise, dither, chromatic aberration, glass). SVG captures the drawing layer as vectors (not the full GPU overlay stack). Hotkey **⌘P / Ctrl+P** exports PNG at 2×.

---

## Tablet Support (Experimental)

The **Tablet** tab is **experimental / in development**. Behavior and UI may change; treat it as optional and incomplete.

When available it can include:

- **Connect Tablet (WebHID)** — pair a supported drawing tablet (Chrome; typically macOS/Linux)
- **Drawing** — line width and clear
- **Geometric Pencil** — polygon strokes with fade
- **MIDI Output** — optionally send tablet gestures as MIDI

Do not rely on tablet features for live shows until they stabilize.

---

## Repository

**G.L.O.W.** is an open-source project built by **Rafael Becerra**

- **GitHub Repository**: [https://github.com/rafaelbecks/glow](https://github.com/rafaelbecks/glow)
- **Live Demo**: [https://glow.luminode.studio](https://glow.luminode.studio/)
