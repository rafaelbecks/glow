# Breadboard wiring — mux pots + joystick + encoder + shift-register buttons

Matches `mux-pots-joystick-test.ino`.

Two protoboards is fine: **share 5V and GND** between both boards and the UNO.

## Power rails first

```
UNO 5V  ──►  both breadboard + rails
UNO GND ──►  both breadboard − rails
```

---

## Overview

```
                    ┌─────────────┐
                    │ Arduino UNO │
                    │             │
         D2 ────────┤ mux S0      │
         D3 ────────┤ mux S1      │
         D4 ────────┤ mux S2      │
         D5 ────────┤ mux S3      │
         A0 ────────┤ mux SIG     │
         GND ───────┤ mux EN      │
                    │             │
         A1 ────────┤ Joy VRx     │
         A2 ────────┤ Joy VRy     │
         D6 ────────┤ Joy SW      │
                    │             │
         D7 ────────┤ Enc CLK     │  ← keep direct (not on shift reg)
         D8 ────────┤ Enc DT      │
         D9 ────────┤ Enc SW      │
                    │             │
         D10 ───────┤ 165 /PL     │  ← buttons board
         D11 ───────┤ 165 CP      │
         D12 ───────┤ 165 Q7      │
         5V/GND ────┤ everything  │
                    └─────────────┘
```

---

## 1. 74HC4067 (pots board)

```
                    notch
                 ┌───┴───┐
          C0 Y0 ─┤1   24├─ VCC  → +5V
          C1 Y1 ─┤2   23├─ Y15  (unused)
          C2 Y2 ─┤3   22├─ Y14
          C3 Y3 ─┤4   21├─ Y13
             Y4 ─┤5   20├─ Y12
             Y5 ─┤6   19├─ Y11
             Y6 ─┤7   18├─ Y10
             Y7 ─┤8   17├─ Y9
     EN ← GND ───┤9   16├─ Y8
     S0 ← D2 ────┤10  15├─ Z/SIG → A0
     S1 ← D3 ────┤11  14├─ GND
     S2 ← D4 ────┤12  13├─ S3 ← D5
                 └───────┘
```

| Mux | UNO / rail |
|-----|------------|
| VCC | 5V |
| GND | GND |
| EN | GND |
| S0–S3 | D2–D5 |
| SIG | A0 |
| Y0–Y3 | pot wipers |

### Pots

Each pot: outer legs **5V** + **GND**, wiper → mux **C0–C3**.

---

## 2. Joystick

| Joystick | UNO |
|----------|-----|
| VCC | 5V |
| GND | GND |
| VRx | **A1** |
| VRy | **A2** |
| SW | **D6** |

---

## 3. Rotary encoder — keep on direct pins

| Encoder | UNO |
|---------|-----|
| CLK / A | **D7** |
| DT / B | **D8** |
| SW | **D9** |
| + | 5V (if module) |
| GND | GND |

### Should the encoder go on the shift register?

**No — not the CLK/DT (A/B) lines.**

A rotary encoder needs fast edge detection. A 74HC165 is polled in a slow serial burst; you will miss detents and get wrong direction. Leave **CLK + DT on D7/D8**.

The **push button (SW)** *could* sit on the 165 later to free D9, but with only 6 buttons it is not worth it — keep SW on D9.

---

## 4. Second board: 74HC165 + 6 buttons

Use a **74HC165** (parallel-in / serial-out). A 74HC595 is for *outputs* (LEDs), not buttons.

### Chip pinout (DIP-16)

```
                 notch
              ┌───┴───┐
   /PL ← D10 ─┤1   16├─ VCC → 5V
    CP ← D11 ─┤2   15├─ Q7\ (unused)
         D4 ──┤3   14├─ D3  → btn3
         D5 ──┤4   13├─ D2  → btn2
         D6 ──┤5   12├─ D1  → btn1
         D7 ──┤6   11├─ D0  → btn0
/CE ← GND ────┤7   10├─ DS  → GND (no cascade)
        GND ──┤8    9├─ Q7  → D12
              └───────┘
```

| 165 pin | Goes to |
|--------:|---------|
| 16 VCC | 5V |
| 8 GND | GND |
| 7 /CE | **GND** |
| 10 DS | **GND** (unused serial-in) |
| 1 /PL | UNO **D10** |
| 2 CP | UNO **D11** |
| 9 Q7 | UNO **D12** |
| 11–14, 3–4 | buttons (below) |
| 5–6 D6/D7 | tie to **5V** if unused |

### Each button

```
  5V ── 10k ──┬── 165 Dx (D0…D5)
              │
             btn  (momentary NO)
              │
             GND
```

| Button | 165 input | Serial label |
|--------|-----------|--------------|
| 1 | **D0** (pin 11) | `btn0` |
| 2 | **D1** (pin 12) | `btn1` |
| 3 | **D2** (pin 13) | `btn2` |
| 4 | **D3** (pin 14) | `btn3` |
| 5 | **D4** (pin 3) | `btn4` |
| 6 | **D5** (pin 4) | `btn5` |

Pressed = LOW on the chip → sketch reports `127`.

---

## 5. Full checklist

| From | To |
|------|----|
| UNO 5V / GND | both boards’ rails |
| D2–D5, A0 | mux S0–S3, SIG |
| A1 A2 D6 | joystick |
| D7 D8 D9 | encoder CLK DT SW |
| D10 D11 D12 | 165 /PL CP Q7 |
| 165 /CE, DS | GND |
| Pot wipers | mux C0–C3 |
| Buttons | 165 D0–D5 + 10k pull-ups |

---

## 6. Layout sketch (two boards)

```
  BOARD A (analog)                         BOARD B (buttons)
  ────────────────                         ─────────────────
  74HC4067 + 4 pots                        74HC165 + 6 buttons
  Joystick                                 (10k pull-ups)
  Encoder

       │ 5V GND D2-D5 A0 A1 A2 D6-D9              │ 5V GND D10 D11 D12
       └──────────────────┬───────────────────────┘
                          │
                     Arduino UNO
```

---

## Smoke test

1. Flash the sketch  
2. Serial **115200**, newline  
3. Send `btn0,btn1,btn2,btn3,btn4,btn5` — press each → `btnN: 127` / `0`  
4. Send `pot0` — should be quieter than before (more averaging + deadband)  
5. Bridge: `hardware/serial-to-midi/serial_to_midi.py` (`btn0`… → CC 29–34)

---

## Pot wobble (why joystick is stable and pots are not)

Mostly **both** breadboard + mux — not “broken code.”

| | Joystick | Pots via 4067 |
|--|----------|----------------|
| Path | Direct to A1/A2 | Mux switch → shared SIG → A0 |
| Extra noise | Low | Channel switch, settle, charge injection, long jumpers |
| Contacts | Module pins | Often loose pot leads on breadboard |

**Typical causes of “almost steady but drifts a few MIDI steps”**
1. Loose pot / rail jumpers on the breadboard (most common)  
2. Mux settle / crosstalk (sketch now waits longer + averages more)  
3. USB 5V noise (affects everything a bit; pots through mux show it more)

**What to try**
1. Reseat pot power and wiper wires; short thick GND between boards  
2. Test: short mux **C0** to a fixed mid voltage (two 10k as divider) — if that still wanders, blame mux/wiring; if solid, blame the pot contact  
3. Optional: move pots off the mux onto free analogs **A3 A4 A5** (+ one still on mux) for a cleaner test  
4. Later (PCB): 100nF from each wiper to GND helps a lot
