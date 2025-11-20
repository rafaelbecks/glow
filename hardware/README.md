# GLOW Hardware Controller

This document describes the goals, architecture, and development plan for creating a dedicated hardware device that runs **GLOW** as a standalone visual instrument.

![GLOW Hardware Sketch](GLOW%20HARDWARE.png)

---

## 1. Goal

Build a **self-contained visual instrument**—similar in spirit to the Organelle, OXI One, or Squarp devices—running GLOW on embedded hardware (e.g., Raspberry Pi) with:

* A **physical control surface** with fixed mappings.
* **MIDI → GLOW** mapping layer (GLOW acts as a MIDI-controlled engine).
* **Kiosk-mode boot** into GLOW (Electron or Chromium).
* **HDMI/VGA/RCA video output** for screens and projectors.
* **Project storage** (Save/Load).
* **LGO, Motion/Layout and FX slots**: The device should be a hands-on hardware synthesizer 
* **[Optional] OLED Screen on the device**: A version could be an standalone composition tool with a screen.

The hardware behaves essentially as a **MIDI controller + embedded visual engine**.

---

## 2. System Overview

### Hardware

* Raspberry Pi 4 or later.
* Custom controller (eventually): buttons, encoders, LEDs.
* Prototype: *any* MIDI controller mapped to GLOW.

### Software Stack

1. **Linux-based kiosk system**

   * Autostarts GLOW UI in fullscreen (Electron app or Chromium).
   * Optional ALSA/JACK MIDI.

2. **GLOW Engine Enhancements**

   * “Hardware mode” toggle.
   * Declarative mapping schema.
   * Exposed parameters for:

     * Tracks / Luminode Type
     * Layout / Motion
     * Per-Track Luminode Controls (A–F)
     * LFO1 & LFO2
     * FX Chain
     * Save / Load / Settings

3. **MIDI Mapping Layer**

   * JSON mapping file.
   * Example:

     ```json
     { "cc": 21, "param": "track[1].layout.xPos" }
     ```

---

## 3. Control Layout (Reference)

```
┌──────────────────────────────────────────────────────────────────┐
│ TRACKS                         LUMINODE SELECT                   │
│ [1] [2] [3] [4]               Enc LuminodeType ◄──────►          │
├──────────────────────────────────────────────────────────────────┤
│ LAYOUT SECTION (fixed)                                           │
│ Enc X-Pos      Enc Y-Pos      Enc Rotation                       │
├──────────────────────────────────────────────────────────────────┤
│ MOTION SECTION (fixed)                                           │
│ Enc Algorithm   Enc Rate      Enc Amplitude                      │
│ Enc Ratio1      Enc Ratio2    [Invert] (button)                  │
├──────────────────────────────────────────────────────────────────┤
│ LUMINODE CONTROL PANEL (per track)                               │
│ Enc A   Enc B   Enc C   Enc D   Enc E   Enc F                    │
├──────────────────────────────────────────────────────────────────┤
│ LFO SECTION (per track)                                          │
│ LFO1: Enc Rate • Enc Depth • WaveBtn • DestBtn                   │
│ LFO2: Enc Rate • Enc Depth • WaveBtn • DestBtn                   │
├──────────────────────────────────────────────────────────────────┤
│ FX CHAIN (2 slots)                                               │
│ FX1: Enc Select • Enc Param • [ON/OFF]                           │
│ FX2: Enc Select • Enc Param • [ON/OFF]                           │
│ (CRT / BLUR / DITHER / NOISE)                                    │
├──────────────────────────────────────────────────────────────────┤
│ SAVE ●    LOAD ●    SETTINGS (hold → system/project menu)        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Development Plan (Step-By-Step)

### Phase 1 — Foundations (Software)

1. Add **hardware mode** to GLOW.
2. Define **public parameter API** for all controllable parameters.
3. Implement **MIDI → GLOW mapping layer** (JSON).
4. Create **default mapping** for prototyping with any controller.
5. Implement Save/Load Hardware API (trigger existing save/load .glow projects).

### Phase 2 — Prototype (No hardware yet)

1. Install Raspberry Pi OS Lite.
2. Configure boot into kiosk (Chromium/Electron → GLOW).
3. Connect any MIDI controller.
4. Use mapping file to drive GLOW parameters.
5. Verify low-latency controls and stable rendering.

### Phase 3 — Hardware Control Surface (v0)

1. Choose enclosure + layout reference (horizontal, MS-20 style).
2. Select components:

   * 4 track buttons
   * 1 Luminode Type encoder
   * 3 Layout encoders
   * 5 Motion encoders + one button
   * 6 Luminode encoders
   * 2×(2 enc + 2 btn) LFO sections
   * 2×FX encoders + ON/OFF buttons
   * Save/Load/Settings buttons
3. Build a **custom USB-MIDI firmware** using:
   * RP2040
   * Arduino/PlatformIO
   * Teensy (optional)

### Phase 4 — Hardware Integration

1. Wire encoders & buttons → microcontroller → USB MIDI out.
2. Define fixed CC numbers based on the schema.
3. Connect to Raspberry Pi running GLOW in kiosk mode.
4. Validate full parameter control.

### Phase 5 — UX + Finishing

1. Add LED feedback per track (color-coded).
2. Add minimal silk-screen (labels + lines like MS2000/MS20).
3. Add preset storage buttons and long-press settings menu.
4. Test video output (HDMI, VGA adapters, RCA if needed).

## 6. Notes

* All hardware mappings must remain **deterministic and fixed** to avoid complexity.
* The engine should behave identically whether controlled via hardware or standard MIDI.
* All controls must be **declarative**, readable, and editable.