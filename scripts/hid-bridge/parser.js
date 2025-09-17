// HID data parser for UGEE Q6 tablet
export default function parseReport (data) {
  // data is a Node.js Buffer
  // Example layout from UGEE Q6 dump:
  // bits:
  // 0-3   buttons (tip, barrel, eraser, invert)
  // 5     inRange
  // 8-23  X
  // 24-39 Y
  // 40-55 pressure
  // 56-63 X tilt
  // 64-71 Y tilt

  const buttons = {
    tip: (data[0] & 0x01) !== 0,
    barrel: (data[0] & 0x02) !== 0,
    eraser: (data[0] & 0x04) !== 0,
    invert: (data[0] & 0x08) !== 0,
    inRange: (data[0] & 0x20) !== 0
  }

  const x = data.readUInt16LE(1)
  const y = data.readUInt16LE(3)
  const pressure = data.readUInt16LE(5)
  const tiltX = data.readInt8(7)
  const tiltY = data.readInt8(8)

  return { x, y, pressure, tiltX, tiltY, buttons }
}
