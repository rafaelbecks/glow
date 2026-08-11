## Geometric Light Oscillation Workstation

*A generative visual playground for sound-reactive geometry*

---

## What is G.L.O.W.?

G.L.O.W. is a real-time visual instrument that transforms your music into geometric light patterns. Inspired by early computer artists such as Vera Molnár, John Whitney, and kinetic artists like Gego and Soto, it creates structured, evolving geometries that render with your sound (MIDI input) in real time.

**GLOW is hackable.** Luminodes are modular drawing modules, open their source in the **Luminode Lab**, fork them, or write your own and play them on tracks like any built-in pattern.

**Demos & Luminodes Showcase**: [YouTube Playlist](https://www.youtube.com/playlist?list=PLPLNsAMGizPvOxgBN0TJDBIRIPvcY6njN)

## Getting Started

### Quick Setup
1. **Open the application** in Chrome
2. **Click "Start"** to initialize (requests MIDI access)
3. **Click the cube icon** on the top right to open the side panel and assign a luminode to a track
4. Feed notes with either:
   - **MIDI device** — connect a keyboard, controller, or software/virtual port, assign it to a track, then play
   - **Generate mode** — External tab → Add Generator (up to one per track; no device needed). Remove/disable a generator before using real MIDI on that track.
5. **Read this manual** via the help icon (bottom right)
6. **Open Luminode Lab** via the flask icon (bottom right, before Help) to hack luminodes

### System Requirements
- Modern web browser (Chrome recommended)
- MIDI device *or* Generate Mode (External tab) for note input
- File API support (for scene saving/loading)
- Optional / experimental: drawing tablet (see [External Systems](#external-systems))

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

**Selecting a luminode:** In the Tracks tab, click the **Luminode** control to open a picker organized by category (Classic Patterns, 3D Geometry, Art-Inspired, Natural Patterns). Hover a card for a live preview, then click to assign it. You can also open **Luminode Lab** from the picker footer.

### Luminode Lab

GLOW is modular by design — **Luminode Lab** is the in-app workshop for inspecting and inventing luminodes without leaving the browser.

**Open it from:**
- The **flask** icon in the bottom-right corner (before Help)
- The luminode picker footer (**Luminode Lab**)

**What you can do:**
- Start from a blank template or open a built-in luminode’s source
- Edit with live preview (and drive the preview with sample notes or the Lab’s MIDI generator)
- Tweak `MODULE` settings in the Settings tab; browse helpers in Utils
- **Save** your luminode locally (browser storage) so it appears in the picker and can be assigned to tracks
- **Fork** a saved user luminode when you want a new copy to experiment with
- Import / export source for sharing or backup

Built-ins stay read-only in the Lab — save or fork to keep your own version. User luminodes live in this browser until you clear site data or delete them from the Lab.

### Modulation System
G.L.O.W. includes a modulation system that works like LFOs (Low-Frequency Oscillators) on synthesizers. It automatically animates luminode parameters over time, creating evolving visual effects. Sources include LFOs, MIDI note count / velocity, and live audio analysis.

**Access the Modulation tab:**
- Open the side panel and click **Modulation**
- Add as many modulators as you need

**Modulator types:**
- **LFO** — classic low-frequency oscillator (sine, square, triangle, sawtooth, cubic bezier)
- **Number of Notes** / **Velocity** — map active MIDI notes into a parameter
- **Audio** — map a live audio input (microphone / interface) through FFT analysis into a parameter

**Common controls:**
- **Destination** — Track luminode params, canvas filters, or shader overlays
- **Parameter** — which value to drive (e.g. sphere Base Radius)
- **Enable/Disable** — toggle without removing the modulator
- **Monitor** — live waveform of the modulation signal being applied

**LFO controls:**
- **Waveform** — sine, square, triangle, sawtooth, or cubic bezier
- **Rate** — oscillation speed (0.001–1 Hz)
- **Depth** — modulation intensity (0–100%)
- **Offset** — base value shift within the parameter range

**Audio controls:**
- **Source** — Live Input (`getUserMedia`) or Audio File
- **Audio Input** — choose an input device (use **Refresh Inputs** after plugging hardware in)
- **Audio File** — load a file, play it with the built-in HTML5 player, and optionally **Loop**
- **Channel** — when the device/file exposes multiple channels, pick which one to analyze
- **Analysis** — RMS, Peak, Bass, Mid, Treble, Presence, or a custom frequency band
- **Smoothing** / **Multiplier** / **Easing** — shape how reactive the mapping feels
- **Depth** / **Offset** — unipolar mapping: louder signal adds `depth × range` on top of the base value (`offset` shifts within the range)

Audio modulator settings (source type, device label, file data, loop, channel, analysis mode, etc.) are saved in the project `.glow` file. On load, Glow reconnects matching live inputs and restores embedded audio files when available.
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

## External Systems

Open the side panel → **External**. This tab groups MIDI utilities and experimental tablet support.

### MIDI — Generators

Use generators when you do not have a MIDI device connected (same idea as the Node `midi-test.js` script, but in-browser). You can add up to **four** generators — one per track — each with its own timing and chord settings.

1. Assign luminodes to the tracks you want to drive
2. Open **External** → click **Add Generator**
3. Pick the **Track**, then tweak:
   - **Interval (ms)** — how often a new chord fires
   - **Musical Interval** — third / fourth / fifth / sixth (semitone stack)
   - **Notes** — notes per chord
   - **Velocity** — base note-on velocity (1–127)
   - **Vel. Random ±** — random offset around velocity
4. Optional **MIDI Output** — send generated notes to a MIDI output device (useful for recording; the stream is random, not musical)

Generators swap chords without a note-off gap, so visuals stay continuous (unlike hardware MIDI note gaps). While a generator is enabled on a track, hardware MIDI notes for that track are ignored. Other tracks can still use real MIDI. Disable or remove the generator to return that track to hardware input.

Tracks driven by a generator do not need a MIDI device assigned — luminode assignment is enough.

### Tablet (Experimental)

The **Tablet** folder under External is **experimental / in development**. Behavior and UI may change; treat it as optional and incomplete.

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
