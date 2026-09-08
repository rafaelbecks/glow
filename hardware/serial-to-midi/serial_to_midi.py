#!/usr/bin/env python3
"""
Serial → MIDI bridge for the GLOW Arduino controller sketch.

Reads lines like `pot0: 64` from the UNO and sends MIDI CC messages
to an output device you pick interactively.

Setup (once):
  cd hardware/serial-to-midi
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt

Run:
  python serial_to_midi.py
  python serial_to_midi.py --list
  python serial_to_midi.py --serial /dev/cu.usbmodem1101 --midi "IAC Driver Bus 5"

Defaults to MIDI out "IAC Driver Bus 5" when that port exists.
"""

from __future__ import annotations

import argparse
import re
import sys
import time
from typing import Optional

try:
    import serial
    from serial.tools import list_ports
except ImportError:
    print("Missing pyserial. Run: pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)

try:
    import mido
except ImportError:
    print("Missing mido. Run: pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)

# Default MIDI destination (macOS IAC)
DEFAULT_MIDI_PORT = "IAC Driver Bus 5"

# Default CC map (channel 1 = MIDI channel 0 in mido)
DEFAULT_CC = {
    "pot0": 20,
    "pot1": 21,
    "pot2": 22,
    "pot3": 23,
    "joyX": 24,
    "joyY": 25,
    "joyBtn": 26,
    "enc": 27,
    "encBtn": 28,
}

LINE_RE = re.compile(r"^\s*([A-Za-z0-9_]+)\s*:\s*(\d+)\s*$")
BAUD = 115200


def pick(prompt: str, options: list[str]) -> str:
    if not options:
        raise SystemExit(f"No options available for: {prompt}")
    print(f"\n{prompt}")
    for i, name in enumerate(options, start=1):
        print(f"  [{i}] {name}")
    while True:
        raw = input("Select number: ").strip()
        if not raw.isdigit():
            print("Enter a number.")
            continue
        idx = int(raw)
        if 1 <= idx <= len(options):
            return options[idx - 1]
        print("Out of range.")


def serial_port_choices() -> list[str]:
    ports = list(list_ports.comports())
    if not ports:
        return []
    # Prefer likely Arduino USB serial devices in the listing order
    ranked = sorted(
        ports,
        key=lambda p: (
            0
            if any(
                s in (p.description or "").lower()
                for s in ("arduino", "usb serial", "usbmodem", "ch340", "cp210")
            )
            or "usbmodem" in (p.device or "").lower()
            else 1,
            p.device or "",
        ),
    )
    return [f"{p.device}  ({p.description})" for p in ranked]


def device_from_choice(choice: str) -> str:
    # " /dev/cu.xxx  (Arduino...)" → "/dev/cu.xxx"
    return choice.split()[0]


def resolve_midi_port(preferred: str, outputs: list[str]) -> Optional[str]:
    """Exact match first, then case-insensitive / substring (e.g. Bus 5)."""
    if preferred in outputs:
        return preferred
    pref = preferred.lower()
    for name in outputs:
        if name.lower() == pref:
            return name
    for name in outputs:
        if pref in name.lower() or name.lower() in pref:
            return name
    # "IAC Driver Bus 5" ↔ ports that contain both "iac" and "5"
    if "5" in pref and "iac" in pref:
        for name in outputs:
            n = name.lower()
            if "iac" in n and re.search(r"\b5\b", n):
                return name
    return None


def open_serial(port: str) -> serial.Serial:
    ser = serial.Serial(port, BAUD, timeout=0.05)
    # UNO resets on open; wait then enable streaming
    time.sleep(2.0)
    ser.reset_input_buffer()
    ser.write(b"all\n")
    ser.flush()
    return ser


def parse_line(line: str) -> Optional[tuple[str, int]]:
    m = LINE_RE.match(line)
    if not m:
        return None
    label, value_s = m.group(1), m.group(2)
    value = int(value_s)
    if value < 0 or value > 127:
        return None
    return label, value


def run(serial_port: str, midi_name: str, channel: int, quiet: bool) -> None:
    cc_map = dict(DEFAULT_CC)
    print(f"Serial: {serial_port} @ {BAUD}")
    print(f"MIDI out: {midi_name} (channel {channel + 1})")
    print("CC map:")
    for label, cc in cc_map.items():
        print(f"  {label:8} → CC {cc}")
    print("Ctrl+C to quit.\n")

    out = mido.open_output(midi_name)
    ser = open_serial(serial_port)
    buf = ""

    try:
        while True:
            chunk = ser.read(256)
            if chunk:
                buf += chunk.decode("utf-8", errors="ignore")
                while "\n" in buf:
                    line, buf = buf.split("\n", 1)
                    line = line.strip()
                    if not line:
                        continue
                    parsed = parse_line(line)
                    if not parsed:
                        if line.startswith("?"):
                            print(line)
                        continue
                    label, value = parsed
                    cc = cc_map.get(label)
                    if cc is None:
                        continue
                    msg = mido.Message(
                        "control_change", channel=channel, control=cc, value=value
                    )
                    out.send(msg)
                    if not quiet:
                        print(f"{label}: {value}  →  CC{cc}")
            else:
                time.sleep(0.001)
    except KeyboardInterrupt:
        print("\nStopping…")
    finally:
        try:
            ser.write(b"off\n")
            ser.flush()
        except Exception:
            pass
        ser.close()
        out.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Arduino Serial → MIDI CC bridge")
    parser.add_argument("--serial", help="Serial device path (e.g. /dev/cu.usbmodem*)")
    parser.add_argument("--midi", help="MIDI output port name (exact match)")
    parser.add_argument(
        "--channel", type=int, default=1, help="MIDI channel 1–16 (default 1)"
    )
    parser.add_argument("--list", action="store_true", help="List serial + MIDI ports and exit")
    parser.add_argument("-q", "--quiet", action="store_true", help="Don't print each CC")
    args = parser.parse_args()

    if not (1 <= args.channel <= 16):
        raise SystemExit("--channel must be 1–16")

    serial_choices = serial_port_choices()
    midi_outputs = mido.get_output_names()

    if args.list:
        print("Serial ports:")
        for c in serial_choices or ["  (none)"]:
            print(f"  {c}")
        print("\nMIDI outputs:")
        for name in midi_outputs or ["  (none)"]:
            print(f"  {name}")
        return

    if args.serial:
        serial_port = args.serial
    else:
        if not serial_choices:
            raise SystemExit("No serial ports found. Is the UNO plugged in?")
        serial_port = device_from_choice(pick("Serial port (Arduino UNO):", serial_choices))

    if args.midi:
        midi_name = resolve_midi_port(args.midi, midi_outputs)
        if midi_name is None:
            print("Available MIDI outputs:", file=sys.stderr)
            for name in midi_outputs:
                print(f"  {name}", file=sys.stderr)
            raise SystemExit(f"MIDI port not found: {args.midi!r}")
    else:
        if not midi_outputs:
            raise SystemExit(
                "No MIDI outputs found.\n"
                "On macOS enable IAC Driver in Audio MIDI Setup "
                f"and add a port named like {DEFAULT_MIDI_PORT!r}."
            )
        midi_name = resolve_midi_port(DEFAULT_MIDI_PORT, midi_outputs)
        if midi_name is None:
            print(f"Default {DEFAULT_MIDI_PORT!r} not found — pick a port.")
            midi_name = pick("MIDI output device:", midi_outputs)
        else:
            print(f"Using MIDI out: {midi_name}")

    run(serial_port, midi_name, args.channel - 1, args.quiet)


if __name__ == "__main__":
    main()
