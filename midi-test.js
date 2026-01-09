import easymidi from 'easymidi';

const interval = parseInt(process.argv[2]) || 2000;
const deviceName = process.argv[3];
const useSixth = process.argv[4] === 'sixth';

console.log('Available MIDI outputs:', easymidi.getOutputs());

if (!deviceName) {
  console.error('Usage: node midi-test.js <interval_ms> <device_name> [sixth]');
  process.exit(1);
}

const output = new easymidi.Output(deviceName);
const intervalType = useSixth ? 'sixth' : 'fifth';
console.log(`Connected to: ${deviceName}`);
console.log(`Sending ${intervalType} chords every ${interval}ms\n`);

const notes = [60, 62, 64, 65, 67, 69, 71, 72]; // C major scale
const activeNotes = new Set(); // Track currently active notes
const timeouts = new Set(); // Track pending timeouts

function sendFifthChord() {
  const root = notes[Math.floor(Math.random() * notes.length)];
  const intervalNote = root + (useSixth ? 9 : 7);
  const intervalName = useSixth ? 'Sixth' : 'Fifth';
  
  console.log(`[${new Date().toISOString()}] ON  -> Root: ${root}, ${intervalName}: ${intervalNote}`);
  output.send('noteon', { note: root, velocity: 100, channel: 0 });
  output.send('noteon', { note: intervalNote, velocity: 100, channel: 0 });
  
  activeNotes.add(root);
  activeNotes.add(intervalNote);
  
  const timeoutId = setTimeout(() => {
    console.log(`[${new Date().toISOString()}] OFF -> Root: ${root}, ${intervalName}: ${intervalNote}`);
    output.send('noteoff', { note: root, velocity: 0, channel: 0 });
    output.send('noteoff', { note: intervalNote, velocity: 0, channel: 0 });
    
    // Remove from active notes
    activeNotes.delete(root);
    activeNotes.delete(intervalNote);
    timeouts.delete(timeoutId);
  }, interval - 50);
  
  timeouts.add(timeoutId);
}

const intervalId = setInterval(sendFifthChord, interval);
sendFifthChord();

function cleanup() {
  console.log('\nCleaning up...');
  
  clearInterval(intervalId);
  
  timeouts.forEach(timeoutId => clearTimeout(timeoutId));
  timeouts.clear();
  
  if (activeNotes.size > 0) {
    console.log(`Sending note off for ${activeNotes.size} active note(s)...`);
    activeNotes.forEach(note => {
      try {
        output.send('noteoff', { note: note, velocity: 0, channel: 0 });
        console.log(`  Note off: ${note}`);
      } catch (error) {
        console.error(`  Error sending note off for ${note}:`, error.message);
      }
    });
    activeNotes.clear();
  }
  
  try {
    output.close();
    console.log('MIDI connection closed.');
  } catch (error) {
    console.error('Error closing MIDI connection:', error.message);
  }
  
  process.exit(0);
}

process.on('SIGINT', cleanup);  // Ctrl+C
process.on('SIGTERM', cleanup); // Termination signal
process.on('exit', () => {
  if (activeNotes.size > 0) {
    activeNotes.forEach(note => {
      try {
        output.send('noteoff', { note: note, velocity: 0, channel: 0 });
      } catch (error) {
      }
    });
  }
});
