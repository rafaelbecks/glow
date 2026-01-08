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

function sendFifthChord() {
  const root = notes[Math.floor(Math.random() * notes.length)];
  const intervalNote = root + (useSixth ? 9 : 7);
  const intervalName = useSixth ? 'Sixth' : 'Fifth';
  
  console.log(`[${new Date().toISOString()}] ON  -> Root: ${root}, ${intervalName}: ${intervalNote}`);
  output.send('noteon', { note: root, velocity: 100, channel: 0 });
  output.send('noteon', { note: intervalNote, velocity: 100, channel: 0 });
  
  setTimeout(() => {
    console.log(`[${new Date().toISOString()}] OFF -> Root: ${root}, ${intervalName}: ${intervalNote}`);
    output.send('noteoff', { note: root, velocity: 0, channel: 0 });
    output.send('noteoff', { note: intervalNote, velocity: 0, channel: 0 });
  }, interval - 50);
}

setInterval(sendFifthChord, interval);
sendFifthChord();

process.on('SIGINT', () => {
  console.log('\nClosing MIDI connection...');
  output.close();
  process.exit(0);
});
