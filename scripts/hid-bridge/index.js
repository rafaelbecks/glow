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

async function startBridge () {
  console.log('🔍 Searching for UGEE Q6 tablet...')

  // Find all devices with matching vendor/product ID (like frontend does)
  const deviceInfos = HID.devices().filter(
    (d) => d.vendorId === VENDOR_ID && d.productId === PRODUCT_ID
  )

  if (deviceInfos.length === 0) {
    console.error('❌ UGEE Q6 tablet not found.')
    console.log('Available HID devices:')
    HID.devices().forEach(device => {
      console.log(`  - ${device.product} (Vendor: 0x${device.vendorId.toString(16)}, Product: 0x${device.productId.toString(16)})`)
    })
    process.exit(1)
  }

  console.log(`✅ Found ${deviceInfos.length} UGEE Q6 device(s):`)
  deviceInfos.forEach((deviceInfo, index) => {
    console.log(`  ${index + 1}. ${deviceInfo.product} (Path: ${deviceInfo.path})`)
  })

  // Test each device to find the one that reports valid tablet data
  let activeDevice = null
  let activeDeviceInfo = null

  for (const deviceInfo of deviceInfos) {
    try {
      console.log(`🔍 Testing device: ${deviceInfo.product}`)
      const testDevice = new HID.HID(deviceInfo.path)
      
      // Set up a temporary listener to test for valid data
      let hasValidData = false
      const testTimeout = setTimeout(() => {
        if (!hasValidData) {
          console.log(`❌ Device ${deviceInfo.product} - no valid data received`)
          testDevice.close()
        }
      }, 3000) // 3 second timeout

      testDevice.on('data', (data) => {
        try {
          const parsed = parseReport(data)
          // Check if this looks like valid tablet data (has pressure or position data)
          if (parsed.pressure > 0 || parsed.x > 0 || parsed.y > 0) {
            hasValidData = true
            clearTimeout(testTimeout)
            console.log(`✅ Device ${deviceInfo.product} - valid tablet data detected`)
            activeDevice = testDevice
            activeDeviceInfo = deviceInfo
            return // Keep this device, don't close it
          }
        } catch (error) {
          // Invalid data, continue testing
        }
      })

      testDevice.on('error', (err) => {
        console.log(`❌ Device ${deviceInfo.product} - error: ${err.message}`)
        clearTimeout(testTimeout)
        testDevice.close()
      })

      // Wait a bit for data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (!hasValidData) {
        clearTimeout(testTimeout)
        testDevice.close()
      }
    } catch (error) {
      console.log(`❌ Device ${deviceInfo.product} - failed to open: ${error.message}`)
    }
  }

  if (!activeDevice) {
    console.error('❌ No UGEE Q6 device found that reports valid tablet data.')
    console.log('Try touching the tablet with the pen while the script is running.')
    process.exit(1)
  }

  console.log(`🎯 Using active device: ${activeDeviceInfo.product}`)
  const device = activeDevice
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
      // Check if this is a valid tablet report (first byte should match REPORT_ID)
      // Note: node-hid doesn't expose reportId directly, but we can check the data format
      if (data.length < 9) {
        return // Skip reports that are too short to be tablet data
      }

      // Parse the raw HID data
      const parsed = parseReport(data)

      // Additional validation: check if this looks like valid tablet data
      if (parsed.pressure === 0 && parsed.x === 0 && parsed.y === 0) {
        return // Skip reports with no meaningful data
      }

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
startBridge().catch(console.error)
