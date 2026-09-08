# Breadboard wiring — mux pots + joystick + encoder + buttons

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
         D7 ────────┤ Enc CLK     │
         D8 ────────┤ Enc DT      │
         D9 ────────┤ Enc SW      │
                    │             │
         D10 ───────┤ btn0 / K1   │  ← 4-button module (direct)
         D11 ───────┤ btn1 / K2   │
         D12 ───────┤ btn2 / K3   │
         A3 ────────┤ btn3 / K4   │  ← not D13 (LED breaks pull-up)
         A4 ────────┤ btn8        │  ← 2 discrete tacts
         A5 ────────┤ btn9        │
         5V/GND ────┤ everything  │
                    └─────────────┘
```

**Note:** The 74HC165N is parked for now. Without pull-up resistors its inputs float
(random presses / one button affecting others). Use it later when you have 10ks.
**Do not use D13** for a pull-up button — the built-in LED loads the pin.

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

The **push button (SW)** *could* sit on a 165 later to free D9 — keep SW on D9 for now.

---

## 4. Buttons — direct UNO pins (no resistors, no 165)

**Why:** Your module almost certainly has **no onboard pull-ups**. On a 74HC165 those
inputs float → random `btnN` chatter and pressing one line coupling into others.
UNO `INPUT_PULLUP` fixes that without external 10ks.

### 4-button module → D10 D11 D12 A3

| Module | UNO | Label |
|--------|-----|-------|
| Common | **GND** | |
| K1 / Out1 | **D10** | `btn0` |
| K2 / Out2 | **D11** | `btn1` |
| K3 / Out3 | **D12** | `btn2` |
| K4 / Out4 | **A3** | `btn3` |

**Disconnect the 165** from D10/D11/D12 and from the module while testing this way.
Skip **D13** for buttons — the onboard LED makes `INPUT_PULLUP` unreliable.

### 2 discrete tacts → A4 / A5

```
  UNO A4 ── btn8 ── GND
  UNO A5 ── btn9 ── GND
```

One leg to the pin, other leg to **GND** (same breadboard − rail as UNO GND).
Which side of the switch is which does not matter.

### Later: 74HC165 (needs 10k pull-ups)

When you have resistors, you can put the module (or more tacts) back on the 165:
`/PL`→D10, `CP`→D11, `Q7`→D12, each Dx with `5V—10k—Dx` and button to GND.
Until then, leave the chip unpowered / unwired.

---

## 5. Full checklist

| From | To |
|------|----|
| UNO 5V / GND | both boards’ rails |
| D2–D5, A0 | mux S0–S3, SIG |
| A1 A2 D6 | joystick |
| D7 D8 D9 | encoder CLK DT SW |
| Pot wipers | mux C0–C3 |
| Module Common | GND |
| Module K1–K4 | **D10 D11 D12 A3** |
| Discrete btn8 / btn9 | **A4** / **A5** → GND |

---

## 6. Layout sketch (two boards)

```
  BOARD A (analog)                         BOARD B (buttons)
  ────────────────                         ─────────────────
  74HC4067 + 4 pots                        4-button module → D10–D12, A3
  Joystick                                 2 tact → A4 / A5
  Encoder                                  (74HC165 unused for now)

       │ 5V GND D2-D5 A0 A1 A2 D6-D9              │ GND D10 D11 D12 A3 A4 A5
       └──────────────────┬───────────────────────┘
                          │
                     Arduino UNO
```

---

## Smoke test

1. Flash the sketch  
2. Serial **115200**, newline  
3. Send `btndiag` — idle should show all `=1`; press one → only that line `=0`  
4. Send `buttons` — press each → `btnN: 127` / `0`  
5. Bridge: `hardware/serial-to-midi/serial_to_midi.py`  
   - `btn0`…`btn3` → CC 29–32 → GLOW tracks 1–4  
   - `btn8` → CC 37 → deformation pot bank  
   - `btn9` → CC 38 → dither on + sat/RGB pots  
   - Load preset **Custom Hardware** in GLOW (Cmd/Ctrl+M); enable Hardware Mode

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
