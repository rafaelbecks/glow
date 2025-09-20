// Test script to help debug HID device detection
// Run this to see what devices are available and which ones report data

import HID from 'node-hid'
import { SETTINGS } from '../../src/settings.js'

const VENDOR_ID = SETTINGS.TABLET.VENDOR_ID
const PRODUCT_ID = SETTINGS.TABLET.PRODUCT_ID

console.log('🔍 HID Device Detection Test')
console.log('============================')

// List all HID devices
console.log('\n📋 All HID devices:')
const allDevices = HID.devices()
allDevices.forEach((device, index) => {
  console.log(`  ${index + 1}. ${device.product || 'Unknown'} (Vendor: 0x${device.vendorId.toString(16)}, Product: 0x${device.productId.toString(16)})`)
  console.log(`     Path: ${device.path}`)
  console.log(`     Interface: ${device.interface}`)
  console.log('')
})

// Filter for UGEE Q6 devices
console.log(`\n🎯 UGEE Q6 devices (Vendor: 0x${VENDOR_ID.toString(16)}, Product: 0x${PRODUCT_ID.toString(16)}):`)
const ugeeDevices = allDevices.filter(
  (d) => d.vendorId === VENDOR_ID && d.productId === PRODUCT_ID
)

if (ugeeDevices.length === 0) {
  console.log('❌ No UGEE Q6 devices found')
} else {
  ugeeDevices.forEach((device, index) => {
    console.log(`  ${index + 1}. ${device.product} (Path: ${device.path})`)
  })
}

console.log('\n💡 To test data reporting, run the main HID bridge script and touch the tablet with the pen.')
console.log('   The script will automatically detect which device reports valid tablet data.')
