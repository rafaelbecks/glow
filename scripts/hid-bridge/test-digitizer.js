// Test script to detect digitizer/pen input
// This helps verify if Windows recognizes your tablet as a digitizer

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

console.log('🧪 Testing digitizer/pen detection...')
console.log('')

async function testDigitizer() {
  try {
    const { stdout } = await execAsync(`
      Add-Type -TypeDefinition @"
      using System;
      using System.Runtime.InteropServices;

      public class Win32 {
          [DllImport("user32.dll")]
          public static extern bool GetCursorPos(out POINT lpPoint);
          
          [DllImport("user32.dll")]
          public static extern bool GetCursorInfo(out CURSORINFO pci);
          
          [StructLayout(LayoutKind.Sequential)]
          public struct POINT {
              public int X;
              public int Y;
          }
          
          [StructLayout(LayoutKind.Sequential)]
          public struct CURSORINFO {
              public int cbSize;
              public int flags;
              public IntPtr hCursor;
              public POINT ptScreenPos;
          }
          
          public const int CURSOR_SHOWING = 0x00000001;
      }
"@

      $point = New-Object Win32+POINT
      [Win32]::GetCursorPos([ref]$point)
      
      $cursorInfo = New-Object Win32+CURSORINFO
      $cursorInfo.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($cursorInfo)
      [Win32]::GetCursorInfo([ref]$cursorInfo)
      
      $isShowing = ($cursorInfo.flags -band [Win32]::CURSOR_SHOWING) -ne 0
      $cursorHandle = $cursorInfo.hCursor.ToInt64()
      
      Write-Output "Cursor Position: $($point.X), $($point.Y)"
      Write-Output "Cursor Showing: $isShowing"
      Write-Output "Cursor Handle: $cursorHandle"
      Write-Output "Cursor Type: $($cursorInfo.hCursor.GetType().Name)"
    `)
    
    console.log('✅ Digitizer detection working!')
    console.log('Result:')
    console.log(stdout.trim())
    console.log('')
    console.log('💡 Now test with your tablet:')
    console.log('1. Move your tablet pen around')
    console.log('2. Notice if the cursor changes to a pen/crosshair icon')
    console.log('3. Run: node scripts/hid-bridge/index-simple.js')
    console.log('4. You should see "Digitizer detected!" when using the tablet')
    
  } catch (error) {
    console.error('❌ Digitizer detection failed:', error.message)
    console.log('')
    console.log('💡 Troubleshooting:')
    console.log('1. Try running as administrator')
    console.log('2. Check if PowerShell is working: powershell -Command "Get-Date"')
    console.log('3. Check Windows execution policy: Get-ExecutionPolicy')
  }
}

testDigitizer()
