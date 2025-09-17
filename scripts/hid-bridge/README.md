# HID Bridge Utility for Glow

This script bridges **HID raw data** from a drawing tablet (like UGEE Q6) to **WebSockets**, so the frontend can receive input data even on platforms where `WebHID` does not expose all events (e.g., Windows).

## Features

- Connects to the UGEE Q6 tablet (or any HID tablet) using `node-hid`
- Reads **raw HID input reports** (position, pressure, tilt, etc.)
- Broadcasts events via **WebSocket** to clients
- Modular: Frontend just listens for events, same format as WebHID
- Automatic reconnection support
- Cross-platform compatibility

## Installation

The dependencies are already included in the main project. Install them with:

```bash
npm install
```

## Usage

### Start the HID Bridge

```bash
npm run hid-bridge
```

### Environment Variables

You can customize the WebSocket server settings:

```bash
WS_HOST=localhost WS_PORT=5678 npm run hid-bridge
```

### In the Glow Frontend

1. Open the tablet controls panel
2. Select "WebSocket (Windows)" connection mode
3. Configure the host and port (default: localhost:5678)
4. Click "Connect Tablet"

## How It Works

1. **HID Detection**: The script scans for HID devices matching the UGEE Q6 vendor/product IDs
2. **Data Parsing**: Raw HID reports are parsed to extract position, pressure, and tilt data
3. **WebSocket Broadcasting**: Parsed data is sent to all connected WebSocket clients
4. **Frontend Integration**: The Glow frontend connects to the WebSocket and processes tablet events

## Data Format

The WebSocket sends JSON messages in this format:

```json
{
  "type": "tabletData",
  "data": {
    "x": 16384,
    "y": 16384,
    "pressure": 32767,
    "tiltX": 0,
    "tiltY": 0,
    "buttons": {
      "tip": true,
      "barrel": false,
      "eraser": false,
      "invert": false,
      "inRange": true
    },
    "timestamp": 1703123456789
  }
}
```

## Troubleshooting

### Tablet Not Found
- Make sure the tablet is connected via USB
- Check that the tablet is recognized by your system
- Verify the vendor/product IDs in `src/settings.js`

### Connection Issues
- Ensure the WebSocket server is running (`npm run hid-bridge`)
- Check that the host and port match between server and client
- Verify firewall settings allow the WebSocket connection

### Permission Issues (Linux/macOS)
- You may need to run with elevated permissions: `sudo npm run hid-bridge`
- Or add your user to the appropriate group for HID device access

## Development

The HID bridge is designed to be modular and extensible:

- `index.js`: Main bridge script with WebSocket server
- `parser.js`: HID data parsing logic
- Configuration comes from `src/settings.js`

To modify the HID parsing for different tablets, update the `parseReport` function in `parser.js`.
