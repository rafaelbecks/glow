# 🎛️ Lizard Visualizer

A generative MIDI visualizer built with WebGL canvas, reactive to live MIDI input via the Web MIDI API.

- Real-time visuals reacting to live MIDI from up to 3 input buses (chords, lead, arpeggios).

### MIDI Routing Setup

Use IAC Driver (macOS) or loopMIDI (Windows) to create **3 virtual MIDI buses**:
- `Bus 1`: Chords
- `Bus 2`: Lead
- `Bus 3`: Arp

Route MIDI from your DAW (e.g. Ableton Live) into these buses.
