// HID Bridge Utility for Glow
// This script bridges HID raw data from a drawing tablet (like UGEE Q6) to WebSockets
// for platforms where WebHID does not expose all events (e.g., Windows)

import HID from 'node-hid'
import WebSocket, { WebSocketServer } from 'ws'
import parseReport from './parser.js'

// Import settings from the main project
import { SETTINGS } from '../../src/settings.js'

const VENDOR_ID = SETTINGS.TABLET.VENDOR_ID
const PRODUCT_ID = SETTINGS.TABLET.PRODUCT_ID
const WS_PORT = process.env.WS_PORT || 5678
const WS_HOST = process.env.WS_HOST || 'localhost'

function startBridge () {
  console.log('🔍 Searching for UGEE Q6 tablet...')

  const deviceInfo = HID.devices().find(
    (d) => d.vendorId === VENDOR_ID && d.productId === PRODUCT_ID
  )

  if (!deviceInfo) {
    console.error('❌ UGEE Q6 tablet not found.')
    console.log('Available HID devices:')
    HID.devices().forEach(device => {
      console.log(`  - ${device.product} (Vendor: 0x${device.vendorId.toString(16)}, Product: 0x${device.productId.toString(16)})`)
    })
    process.exit(1)
  }

  console.log(`✅ Found tablet: ${deviceInfo.product}`)

  const device = new HID.HID(deviceInfo.path)
  const wss = new WebSocketServer({ port: WS_PORT, host: WS_HOST })

  wss.on('connection', (ws, req) => {
    console.log(`🔗 WebSocket client connected from ${req.socket.remoteAddress}`)

    ws.on('close', () => {
      console.log('🔌 WebSocket client disconnected')
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  })

  device.on('data', (data) => {
    try {
      // Parse the raw HID data
      const parsed = parseReport(data)

      // Create payload similar to WebHID format
      const payload = {
        type: 'tabletData',
        data: {
          x: parsed.x,
          y: parsed.y,
          pressure: parsed.pressure,
          tiltX: parsed.tiltX,
          tiltY: parsed.tiltY,
          buttons: parsed.buttons,
          timestamp: Date.now()
        }
      }

      // Broadcast to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(payload))
        }
      })
    } catch (error) {
      console.error('Error parsing HID data:', error)
    }
  })

  device.on('error', (err) => {
    console.error('❌ HID device error:', err)
  })

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down HID bridge...')
    device.close()
    wss.close()
    process.exit(0)
  })

  console.log(`🚀 HID bridge running on ws://${WS_HOST}:${WS_PORT}`)
  console.log('Press Ctrl+C to stop')
}

// Start the bridge
startBridge()
