# G.L.O.W  (Geometric Light Oscillation Workstation)

*A generative visual playground for sound-reactive geometry*

G.L.O.W. is a lightweight, modular, MIDI and OSC-reactive visual engine that draws inspiration from early computer graphics, kinetic art, geometric abstraction, and pioneers like Jesús Rafael Soto, Gego, Nelson Max and John Whitney. It allows musicians, performers, and artists to visualize sound through structured, evolving geometries in real time.

[Modules Showcase](https://drive.google.com/file/d/1As9pnL4YNkaKi_vGCIl7vKHFa6XrFAox/view?usp=sharing)

## **Technical Implementation Plan**

### **Core Stack**

* **Frontend:** Pure WebGL (Canvas 2D/WebGL), Web MIDI, Web Audio API (second phase), Lit/Web Components for UI
* **Backend (Desktop app):** Tauri (Rust \+ WebView)
  * MIDI / OSC bridge handled in Rust
  * Local filesystem support (recording, presets, sessions)
  * `.glow` project format (JSON-based)

### **Features**

* Multi-track visual routing (per MIDI input/channel/OSC address)
* History & undo/redo (state snapshots)
* Preset/scene system
* High-quality WebGL recording (canvas export or ffmpeg backend)

## **Existing Modules**

| Module Name | Description |
| ----- | ----- |
| lissajousCurves | Dynamic Lissajous curves, reactive to MIDI intervals with color \+ phase motion |
| harmonographsLines | Multi-pendulum oscillation shapes, highly reactive to MIDI with evolving trails |
| wireSphere | Orthogonal-projected 3D wireframe sphere, deformed by chord complexity |
| gegoNet | Reactive tensegrity net, minimalistic bouncing lines with chord-based density |
| gegoShape | Geometric 3D-ish polyhedron with anchor rings that don’t intersect connections |
| moireCircles | Expanding radial/linear moiré circles from MIDI input |
| noteVisuals | Sine/triangle visuals per note, now with harmonic stacking and velocity depth |
| sotoGrid | Soto-style animation with moiré lines, solid blocks and note-based squares |
| scanlineGradients | Analog-style scanline gradients with colorful bursts triggered by notes |
| phyllotaxis | Whitney-style golden spiral of dots, grows with chords and rotates over time |
| wovenNet | Glitchy woven net/grid with randomized placement and MIDI-reactive color |
| stackedPolygons | Layered polygonal shapes with organic stroke, harmonic symmetry per note |

## **Architecture Overview**

![GLOW](https://github.com/rafaelbecks/glow/blob/main/public/GLOW.png?raw=true)

## **Initial UI Idea

![UI](https://github.com/rafaelbecks/glow/blob/main/public/UI.png?raw=true)

### **Domain Vocabulary for G.L.O.W.**

| Term | Description |
| :---- | ----- |
| **Scene** | The central visual output canvas (left panel) |
| **Tracks** | Horizontal layers or lanes where visual signals are routed (right panel) |
| **Buses** | MIDI/OSC input channels routed to Tracks |
| **Luminodes** | Modular visual units that generate geometry and light |
| **Compositonal field** | Space grid system to align/compose nodes in the scene. |
| **Parameters** | The editable settings for each Luminode |
| **Presets / Snapshots** | Saved states or scenes for quick recall |
| **.glow** | Project/session file format |
| **Render Mode** | Live display or recording mode (hi-res export) |

### **Compositional field**

The G.L.O.W. Scene is structured on a flexible compositional field that allows Luminodes to be positioned and scaled with intention. Artists can anchor each Luminode to logical or exact positions (e.g. left, right, center, 25% width, etc.), and scale them to overlap, pulse, or interact compositionally. This unlocks visual arrangements that go beyond centered symmetry, and creates opportunities for balance, tension, and layered motion across the entire field.
