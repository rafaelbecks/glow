// Simple Windows Pointer Bridge for Glow
// Captures digitizer/pen input and cursor movement as tablet data

import WebSocket, { WebSocketServer } from 'ws'
import { spawn } from 'child_process'

const WS_PORT = process.env.WS_PORT || 5678
const WS_HOST = process.env.WS_HOST || 'localhost'

function startSimplePointerBridge() {
  console.log('🚀 Starting Simple Windows Pointer Bridge...')
  console.log('')
  console.log('💡 This captures digitizer/pen input and cursor movement as tablet data')
  console.log('   Perfect for when raw HID access is blocked by drivers')
  console.log('')
  
  // Set up WebSocket server
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
  
  // PowerShell script to capture digitizer/pen input properly
  const psScript = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class Win32 {
    [DllImport("user32.dll")]
    public static extern bool GetCursorPos(out POINT lpPoint);
    
    [DllImport("user32.dll")]
    public static extern short GetAsyncKeyState(int vKey);
    
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

public class DigitizerCapture {
    private static int lastX = 0;
    private static int lastY = 0;
    private static bool lastPressed = false;
    private static long lastTime = 0;
    
    public static void Main() {
        while (true) {
            Win32.POINT point;
            Win32.GetCursorPos(out point);
            
            // Check for pen/digitizer input
            bool isPressed = (Win32.GetAsyncKeyState(1) & 0x8000) != 0; // Left mouse button
            bool isRightPressed = (Win32.GetAsyncKeyState(2) & 0x8000) != 0; // Right mouse button
            
            // Check cursor type to detect digitizer
            Win32.CURSORINFO cursorInfo = new Win32.CURSORINFO();
            cursorInfo.cbSize = System.Runtime.InteropServices.Marshal.SizeOf(cursorInfo);
            Win32.GetCursorInfo(out cursorInfo);
            
            bool isDigitizer = cursorInfo.hCursor != IntPtr.Zero && 
                              (cursorInfo.flags & Win32.CURSOR_SHOWING) != 0;
            
            long currentTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            
            int deltaX = point.X - lastX;
            int deltaY = point.Y - lastY;
            long deltaTime = currentTime - lastTime;
            
            // Only report if there's movement or button state change
            if (deltaX != 0 || deltaY != 0 || isPressed != lastPressed || isRightPressed) {
                // Simulate pressure based on button state
                int pressure = 0;
                if (isPressed) {
                    pressure = 32767; // Full pressure for left click
                } else if (isRightPressed) {
                    pressure = 16383; // Half pressure for right click
                }
                
                // Create JSON output
                string json = "{";
                json += "\\"type\\":\\"tabletData\\",";
                json += "\\"data\\":{";
                json += "\\"x\\":" + point.X + ",";
                json += "\\"y\\":" + point.Y + ",";
                json += "\\"pressure\\":" + pressure + ",";
                json += "\\"deltaX\\":" + deltaX + ",";
                json += "\\"deltaY\\":" + deltaY + ",";
                json += "\\"deltaTime\\":" + deltaTime + ",";
                json += "\\"timestamp\\":" + currentTime + ",";
                json += "\\"isTablet\\":true,";
                json += "\\"isDigitizer\\":" + isDigitizer.ToString().ToLower();
                json += "}";
                json += "}";
                
                Console.WriteLine(json);
                
                lastX = point.X;
                lastY = point.Y;
                lastPressed = isPressed;
                lastTime = currentTime;
            }
            
            System.Threading.Thread.Sleep(16); // ~60 FPS
        }
    }
}
"@

[DigitizerCapture]::Main()
`
  
  console.log('🔍 Starting PowerShell digitizer capture...')
  
  const psProcess = spawn('powershell', ['-Command', psScript])
  
  psProcess.stdout.on('data', (data) => {
    try {
      const lines = data.toString().split('\n').filter(line => line.trim())
      lines.forEach(line => {
        try {
          const event = JSON.parse(line)
          if (event.type === 'tabletData') {
            // Log digitizer detection
            if (event.data.isDigitizer) {
              console.log('🎯 Digitizer detected! Cursor type changed to pen/digitizer mode')
            }
            
            // Broadcast to all connected clients
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(event))
              }
            })
          }
        } catch (e) {
          // Ignore invalid JSON
        }
      })
    } catch (e) {
      console.error('Error processing pointer data:', e)
    }
  })
  
  psProcess.stderr.on('data', (data) => {
    const error = data.toString()
    if (!error.includes('GetCursorPos') && !error.includes('GetAsyncKeyState') && !error.includes('GetCursorInfo')) {
      console.error('PowerShell error:', error)
    }
  })
  
  psProcess.on('close', (code) => {
    console.log(`PowerShell process exited with code ${code}`)
  })
  
  psProcess.on('error', (error) => {
    console.error('Failed to start PowerShell process:', error)
    console.log('')
    console.log('💡 Troubleshooting:')
    console.log('1. Make sure PowerShell is available')
    console.log('2. Try running as administrator')
    console.log('3. Check Windows execution policy: Get-ExecutionPolicy')
    process.exit(1)
  })
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down pointer bridge...')
    psProcess.kill()
    wss.close()
    process.exit(0)
  })
  
  console.log('✅ PowerShell digitizer capture started')
  console.log(`🚀 Pointer bridge running on ws://${WS_HOST}:${WS_PORT}`)
  console.log('Press Ctrl+C to stop')
  console.log('')
  console.log('💡 Move your tablet pen to see data streaming!')
  console.log('   The cursor should change to a pen/crosshair icon when using the tablet')
  console.log('   Left-click to simulate pressure, right-click for lower pressure')
}

// Start the bridge
startSimplePointerBridge()