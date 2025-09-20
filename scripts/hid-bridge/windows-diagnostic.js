// Windows HID Diagnostic Script
// Run this to diagnose HID device issues on Windows

import HID from 'node-hid'
import { SETTINGS } from '../../src/settings.js'

const VENDOR_ID = SETTINGS.TABLET.VENDOR_ID
const PRODUCT_ID = SETTINGS.TABLET.PRODUCT_ID

console.log('🔍 Windows HID Diagnostic Tool')
console.log('==============================')
console.log('')

// Check if running on Windows
const isWindows = process.platform === 'win32'
console.log(`Platform: ${process.platform} ${isWindows ? '(Windows detected)' : ''}`)
console.log('')

// List all HID devices with detailed info
console.log('📋 All HID Devices:')
console.log('-------------------')
const allDevices = HID.devices()

if (allDevices.length === 0) {
  console.log('❌ No HID devices found!')
  console.log('')
  console.log('💡 Troubleshooting steps:')
  console.log('1. Make sure the tablet is connected via USB')
  console.log('2. Check if Windows recognizes the device in Device Manager')
  console.log('3. Try a different USB port')
  console.log('4. Check if the device appears under "Human Interface Devices" in Device Manager')
  process.exit(1)
}

allDevices.forEach((device, index) => {
  console.log(`\n${index + 1}. Device: ${device.product || 'Unknown Product'}`)
  console.log(`   Vendor ID: 0x${device.vendorId.toString(16).toUpperCase()}`)
  console.log(`   Product ID: 0x${device.productId.toString(16).toUpperCase()}`)
  console.log(`   Path: ${device.path}`)
  console.log(`   Interface: ${device.interface}`)
  console.log(`   Usage Page: ${device.usagePage || 'N/A'}`)
  console.log(`   Usage: ${device.usage || 'N/A'}`)
  console.log(`   Manufacturer: ${device.manufacturer || 'N/A'}`)
  console.log(`   Serial Number: ${device.serialNumber || 'N/A'}`)
  console.log(`   Release: ${device.release || 'N/A'}`)
})

// Filter for UGEE devices
console.log('\n🎯 UGEE Q6 Devices:')
console.log('-------------------')
const ugeeDevices = allDevices.filter(
  (d) => d.vendorId === VENDOR_ID && d.productId === PRODUCT_ID
)

if (ugeeDevices.length === 0) {
  console.log('❌ No UGEE Q6 devices found!')
  console.log('')
  console.log('💡 This could mean:')
  console.log('1. The tablet is not connected')
  console.log('2. The tablet is using a different vendor/product ID')
  console.log('3. The tablet is not recognized as a HID device')
  console.log('4. A driver is preventing HID access')
  console.log('')
  console.log('🔍 Look for devices with similar names in the list above')
  console.log('   (e.g., "UGEE", "Tablet", "Pen", "Digitizer")')
} else {
  console.log(`✅ Found ${ugeeDevices.length} UGEE Q6 device(s):`)
  ugeeDevices.forEach((device, index) => {
    console.log(`\n${index + 1}. ${device.product}`)
    console.log(`   Path: ${device.path}`)
    console.log(`   Interface: ${device.interface}`)
    console.log(`   Usage Page: ${device.usagePage || 'N/A'}`)
    console.log(`   Usage: ${device.usage || 'N/A'}`)
  })
}

// Test device access
console.log('\n🧪 Testing Device Access:')
console.log('-------------------------')

if (ugeeDevices.length > 0) {
  for (let i = 0; i < ugeeDevices.length; i++) {
    const deviceInfo = ugeeDevices[i]
    console.log(`\nTesting device ${i + 1}: ${deviceInfo.product}`)
    
    try {
      const device = new HID.HID(deviceInfo.path)
      console.log('✅ Device opened successfully')
      
      // Set up a quick test
      let testDataReceived = false
      const testTimeout = setTimeout(() => {
        if (!testDataReceived) {
          console.log('⚠️  No data received in 2 seconds (this might be normal)')
          console.log('   Try touching the tablet with the pen while running the main script')
        }
        device.close()
      }, 2000)
      
      device.on('data', (data) => {
        testDataReceived = true
        console.log('✅ Data received!')
        console.log(`   Data length: ${data.length} bytes`)
        console.log(`   First few bytes: ${Array.from(data.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`)
        clearTimeout(testTimeout)
        device.close()
      })
      
      device.on('error', (err) => {
        console.log(`❌ Device error: ${err.message}`)
        clearTimeout(testTimeout)
        device.close()
      })
      
    } catch (error) {
      console.log(`❌ Failed to open device: ${error.message}`)
      console.log('')
      console.log('💡 Common causes:')
      console.log('1. Device is already in use by another application')
      console.log('2. Insufficient permissions (try running as Administrator)')
      console.log('3. Driver conflict - try uninstalling UGEE driver')
      console.log('4. Device is not properly recognized by Windows')
    }
  }
} else {
  console.log('❌ No UGEE devices to test')
}

console.log('\n📋 Windows-Specific Troubleshooting:')
console.log('------------------------------------')
console.log('1. Open Device Manager (devmgmt.msc)')
console.log('2. Look for your tablet under "Human Interface Devices"')
console.log('3. If you see "UGEE" or similar, right-click → Properties')
console.log('4. Go to Power Management tab')
console.log('5. Uncheck "Allow the computer to turn off this device to save power"')
console.log('6. If you see yellow warning icons, try updating the driver')
console.log('7. Try uninstalling any UGEE-specific drivers and let Windows use generic HID driver')
console.log('')
console.log('🔧 Alternative: Try running as Administrator')
console.log('   Right-click Command Prompt → "Run as administrator"')
console.log('   Then run: node scripts/hid-bridge/index.js')
