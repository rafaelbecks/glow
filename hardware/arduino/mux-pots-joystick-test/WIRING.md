# Breadboard wiring — mux pots + joystick + encoder → Arduino UNO

Matches `mux-pots-joystick-test.ino`.

## Power rails first

```
UNO 5V  ──►  breadboard + rail
UNO GND ──►  breadboard − rail
```

Everything below shares those rails.

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
         5V/GND ────┤ pots/joy/enc│
                    └─────────────┘
```

---

## 1. 74HC4067 (DIP-24 on breadboard)

Place the chip across the center gap. Notch / pin 1 at top-left.

```
                    notch
                 ┌───┴───┐
          C0 Y0 ─┤1   24├─ VCC  → +5V rail
          C1 Y1 ─┤2   23├─ Y15  (unused)
          C2 Y2 ─┤3   22├─ Y14  (unused)
          C3 Y3 ─┤4   21├─ Y13  (unused)
             Y4 ─┤5   20├─ Y12  (unused)
             Y5 ─┤6   19├─ Y11  (unused)
             Y6 ─┤7   18├─ Y10  (unused)
             Y7 ─┤8   17├─ Y9   (unused)
     EN ← GND ───┤9   16├─ Y8   (unused)
     S0 ← D2 ────┤10  15├─ Z/SIG → A0
     S1 ← D3 ────┤11  14├─ GND  → GND rail
     S2 ← D4 ────┤12  13├─ S3   ← D5
                 └───────┘
```

| Mux pin | Name | Goes to |
|--------:|------|---------|
| 24 | VCC | 5V |
| 14 | GND | GND |
| 9 | EN (/E) | GND (always on) |
| 10 | S0 | UNO **D2** |
| 11 | S1 | UNO **D3** |
| 12 | S2 | UNO **D4** |
| 13 | S3 | UNO **D5** |
| 15 | Z (SIG) | UNO **A0** |
| 1–4 | Y0–Y3 | pot wipers |

Breakout module: same Arduino pins; tie `EN` to GND.

---

## 2. Four potentiometers → mux C0–C3

```
  5V ──► pot left pin
 GND ──► pot right pin
 wiper (middle) ──► mux channel
```

| Pot | Wiper → mux |
|----:|-------------|
| Pot 0 | **C0 / Y0** |
| Pot 1 | **C1 / Y1** |
| Pot 2 | **C2 / Y2** |
| Pot 3 | **C3 / Y3** |

---

## 3. Joystick module

| Joystick | UNO |
|----------|-----|
| VCC | 5V |
| GND | GND |
| VRx | **A1** |
| VRy | **A2** |
| SW | **D6** |

---

## 4. Rotary encoder (KY-040 style: stepped + button)

| Encoder | UNO |
|---------|-----|
| CLK / A | **D7** |
| DT / B | **D8** |
| SW | **D9** |
| + / VCC | 5V |
| GND | GND |

```
  Encoder module
  ┌──────────────┐
  │  CLK ────────┼──► D7
  │  DT  ────────┼──► D8
  │  SW  ────────┼──► D9
  │  +   ────────┼──► 5V
  │  GND ────────┼──► GND
  └──────────────┘
```

Sketch uses internal pull-ups on CLK/DT/SW. Serial labels: `enc` (0–127 absolute), `encBtn` (0 / 127).

If direction feels reversed, swap the CLK and DT wires (or D7/D8).

---

## 5. Full connection checklist

| From | To |
|------|----|
| UNO 5V | rails, mux VCC, pots high, joy VCC, enc + |
| UNO GND | rails, mux GND, mux EN, pots low, joy GND, enc GND |
| UNO D2–D5 | mux S0–S3 |
| UNO A0 | mux SIG |
| UNO A1 / A2 | joy VRx / VRy |
| UNO D6 | joy SW |
| UNO D7 / D8 / D9 | enc CLK / DT / SW |
| Pot0–3 wipers | mux C0–C3 |

---

## 6. Breadboard layout sketch

```
  +5V rail ═══════════════════════════════════════════════════
           │         │              │ │ │ │
           │      ┌──┴──────────────┴─┴─┴─┴──┐
           │      │      74HC4067            │
           │      │  Y0 Y1 Y2 Y3 …  Z S0..S3 │
           │      └──┬──┬──┬──┬─────┬─┬─┬─┬──┘
           │         │  │  │  │     │ │ │ │
           │        P0 P1 P2 P3     │ │ │ └──► D2..D5
           │                        └─────────► A0
  GND rail ═╤══════════════════════════════════
            │
            ├── Joystick: VRx→A1  VRy→A2  SW→D6
            └── Encoder:  CLK→D7  DT→D8   SW→D9

              Arduino UNO (USB)
```

---

## Smoke test

1. Flash `mux-pots-joystick-test.ino`
2. Serial Monitor @ **115200**, line ending **Newline**
3. Send `all` (or e.g. `enc,encBtn`)
4. Turn pots / stick / encoder → labeled `name: 0..127` lines on change only
5. For MIDI: run `hardware/serial-to-midi/serial_to_midi.py`
