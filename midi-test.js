import easymidi from 'easymidi';

// args
const intervalMs = parseInt(process.argv[2]) || 2000;
const deviceName = process.argv[3];
const intervalMode = process.argv[4] || 'fifth'; // third | fourth | fifth | sixth
const numberOfNotes = parseInt(process.argv[5]) || 2;

console.log('Available MIDI outputs:', easymidi.getOutputs());

if (!deviceName) {
  console.error('Usage: node midi-test.js <interval_ms> <device_name> [third|fourth|fifth|sixth] <number_of_notes>');
  process.exit(1);
}

// MIDI setup
const output = new easymidi.Output(deviceName);

// interval map (semitones)
const INTERVALS = {
  third: 4,
  fourth: 5,
  fifth: 7,
  sixth: 9,
};

const step = INTERVALS[intervalMode] ?? INTERVALS.fifth;

console.log(`Connected to: ${deviceName}`);
console.log(`Interval: ${intervalMode} (${step} semitones)`);
console.log(`Notes per trigger: ${numberOfNotes}`);
console.log(`Trigger every ${intervalMs}ms\n`);

// --- note range ---
// chromatic range across 3 octaves
const MIN_NOTE = 48; // C3
const MAX_NOTE = 84; // C6

function randomRoot() {
  return Math.floor(Math.random() * (MAX_NOTE - MIN_NOTE + 1)) + MIN_NOTE;
}

const activeNotes = new Set();
const timeouts = new Set();

function generateNotes(root) {
  const notes = [];

  for (let i = 0; i < numberOfNotes; i++) {
    notes.push(root + step * i);
  }

  return notes;
}

function sendChord() {
  const root = randomRoot();
  const notesToPlay = generateNotes(root);

  console.log(`[${new Date().toISOString()}] ON ->`, notesToPlay);

  notesToPlay.forEach(note => {
    output.send('noteon', { note, velocity: 100, channel: 0 });
    activeNotes.add(note);
  });

  const timeoutId = setTimeout(() => {
    console.log(`[${new Date().toISOString()}] OFF ->`, notesToPlay);

    notesToPlay.forEach(note => {
      output.send('noteoff', { note, velocity: 0, channel: 0 });
      activeNotes.delete(note);
    });

    timeouts.delete(timeoutId);
  }, intervalMs - 50);

  timeouts.add(timeoutId);
}

const intervalId = setInterval(sendChord, intervalMs);
sendChord();

// cleanup
function cleanup() {
  console.log('\nCleaning up...');
  clearInterval(intervalId);

  timeouts.forEach(clearTimeout);
  timeouts.clear();

  activeNotes.forEach(note => {
    try {
      output.send('noteoff', { note, velocity: 0, channel: 0 });
    } catch {}
  });
  activeNotes.clear();

  try {
    output.close();
  } catch {}

  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', () => {
  activeNotes.forEach(note => {
    try {
      output.send('noteoff', { note, velocity: 0, channel: 0 });
    } catch {}
  });
});
