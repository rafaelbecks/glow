/*
  Mux pots + joystick + encoder + buttons — filtered Serial
  -----------------------------------------------------------------
  Silent until you enable a filter. Send labels (115200, newline):

    pot0,pot1
    btn0,btn1,btn2,btn3,btn8,btn9
    buttons       ← shortcut for the six wired buttons
    all
    diag          ← raw ADC dump every 200ms (mux debug)
    btndiag       ← raw HIGH/LOW of button pins every 200ms

  Blank / "off" / "stop" clears the filter / stops diag.

  Wired now (see WIRING.md) — all INPUT_PULLUP, no external resistors:
    btn0…btn3  4-button module → D10 D11 D12 A3
    btn8 btn9  discrete tacts  → A4 A5
    btn4…btn7  reserved (use 74HC165 later when you have 10k pull-ups)

  Note: avoid D13 for buttons — the onboard LED weakens INPUT_PULLUP.

  Also: pot0–pot3 joyX joyY joyBtn enc encBtn
*/

// --- Pin map ---------------------------------------------------------------
const uint8_t MUX_S0 = 2;
const uint8_t MUX_S1 = 3;
const uint8_t MUX_S2 = 4;
const uint8_t MUX_S3 = 5;
const uint8_t MUX_SIG = A0;

const uint8_t JOY_X = A1;
const uint8_t JOY_Y = A2;
const uint8_t JOY_BTN = 6;

const uint8_t ENC_CLK = 7;
const uint8_t ENC_DT = 8;
const uint8_t ENC_SW = 9;

// Direct buttons (INPUT_PULLUP). 74HC165 parked until 10k resistors available.
const uint8_t BTN0_PIN = 10;  // module K1
const uint8_t BTN1_PIN = 11;  // module K2
const uint8_t BTN2_PIN = 12;  // module K3
const uint8_t BTN3_PIN = A3;  // module K4 (not D13 — LED breaks pull-up)
const uint8_t BTN8_PIN = A4;  // discrete
const uint8_t BTN9_PIN = A5;  // discrete

const uint8_t POT_CHANNELS[4] = {0, 1, 2, 3};

const char* const LABELS[] = {
  "pot0", "pot1", "pot2", "pot3",
  "joyX", "joyY", "joyBtn",
  "enc", "encBtn",
  "btn0", "btn1", "btn2", "btn3", "btn4",
  "btn5", "btn6", "btn7", "btn8", "btn9"
};
const uint8_t NUM_CONTROLS = 19;
const uint8_t NUM_ANALOG = 6;
const uint8_t IDX_JOY_BTN = 6;
const uint8_t IDX_ENC = 7;
const uint8_t IDX_ENC_BTN = 8;
const uint8_t IDX_BTN0 = 9;
const uint8_t IDX_BTN8 = 17;
const uint8_t IDX_BTN9 = 18;

const uint8_t WIRED_BTN_PINS[] = {
  BTN0_PIN, BTN1_PIN, BTN2_PIN, BTN3_PIN, BTN8_PIN, BTN9_PIN
};
const uint8_t WIRED_BTN_IDX[] = {
  IDX_BTN0, IDX_BTN0 + 1, IDX_BTN0 + 2, IDX_BTN0 + 3, IDX_BTN8, IDX_BTN9
};
const uint8_t NUM_WIRED_BTNS = 6;

const unsigned long SCAN_INTERVAL_MS = 20;
const uint8_t MUX_SETTLE_US = 50;   // mux needs time after channel select
const uint8_t SAMPLE_COUNT = 16;
const uint16_t RAW_DEADBAND = 12;  // pots on mux are noisier than joy
const unsigned long BTN_DEBOUNCE_MS = 30;

const size_t LINE_MAX = 128;
char lineBuf[LINE_MAX];
uint8_t lineLen = 0;

bool watch[NUM_CONTROLS] = {false};
bool anyWatch = false;
bool diagMode = false;
bool btnDiagMode = false;

uint16_t lastRaw[NUM_ANALOG];
uint8_t lastMidi[NUM_CONTROLS];
bool primed = false;

uint8_t lastClk = HIGH;
uint8_t encMidi = 64;

uint8_t joyBtnStable = 0, encBtnStable = 0;
uint8_t joyBtnReading = 0, encBtnReading = 0;
unsigned long joyBtnDebounceAt = 0, encBtnDebounceAt = 0;

uint8_t wiredBtnStable[NUM_WIRED_BTNS] = {0};
uint8_t wiredBtnReading[NUM_WIRED_BTNS] = {0};
unsigned long wiredBtnDebounceAt[NUM_WIRED_BTNS] = {0};

// --- Analog helpers --------------------------------------------------------
void selectMuxChannel(uint8_t channel) {
  digitalWrite(MUX_S0, bitRead(channel, 0));
  digitalWrite(MUX_S1, bitRead(channel, 1));
  digitalWrite(MUX_S2, bitRead(channel, 2));
  digitalWrite(MUX_S3, bitRead(channel, 3));
  delayMicroseconds(MUX_SETTLE_US);
}

uint16_t readAnalogAveraged(uint8_t pin) {
  uint32_t sum = 0;
  for (uint8_t i = 0; i < SAMPLE_COUNT; i++) {
    sum += analogRead(pin);
  }
  return (uint16_t)(sum / SAMPLE_COUNT);
}

uint16_t readMuxChannel(uint8_t channel) {
  selectMuxChannel(channel);
  analogRead(MUX_SIG);
  delayMicroseconds(MUX_SETTLE_US);
  return readAnalogAveraged(MUX_SIG);
}

uint8_t toMidi(uint16_t raw) {
  return (uint8_t)map(constrain(raw, 0, 1023), 0, 1023, 0, 127);
}

int8_t labelIndex(const char* name) {
  for (uint8_t i = 0; i < NUM_CONTROLS; i++) {
    if (strcmp(name, LABELS[i]) == 0) {
      return (int8_t)i;
    }
  }
  return -1;
}

uint16_t readAnalogControlRaw(uint8_t index) {
  switch (index) {
    case 0:
    case 1:
    case 2:
    case 3:
      return readMuxChannel(POT_CHANNELS[index]);
    case 4:
      return readAnalogAveraged(JOY_X);
    case 5:
      return readAnalogAveraged(JOY_Y);
    default:
      return 0;
  }
}

uint8_t activeLowToMidi(uint8_t pin) {
  return digitalRead(pin) == LOW ? 127 : 0;
}

void debounceValue(uint8_t raw, uint8_t* reading, uint8_t* stable,
                   unsigned long* changedAt) {
  const unsigned long now = millis();
  if (raw != *reading) {
    *reading = raw;
    *changedAt = now;
  } else if (raw != *stable && (now - *changedAt) >= BTN_DEBOUNCE_MS) {
    *stable = raw;
  }
}

void debounceButton(uint8_t pin, uint8_t* reading, uint8_t* stable,
                    unsigned long* changedAt) {
  debounceValue(activeLowToMidi(pin), reading, stable, changedAt);
}

void pollWiredButtons() {
  for (uint8_t i = 0; i < NUM_WIRED_BTNS; i++) {
    debounceButton(
        WIRED_BTN_PINS[i], &wiredBtnReading[i], &wiredBtnStable[i],
        &wiredBtnDebounceAt[i]);
  }
}

void pollEncoder() {
  const uint8_t clk = digitalRead(ENC_CLK);
  if (clk != lastClk) {
    if (clk == HIGH) {
      int16_t next = (int16_t)encMidi;
      if (digitalRead(ENC_DT) == LOW) {
        next++;
      } else {
        next--;
      }
      if (next < 0) next = 0;
      if (next > 127) next = 127;
      encMidi = (uint8_t)next;
    }
    lastClk = clk;
  }
}

void trimInPlace(char* s) {
  char* start = s;
  while (*start == ' ' || *start == '\t') {
    start++;
  }
  if (start != s) {
    memmove(s, start, strlen(start) + 1);
  }
  size_t n = strlen(s);
  while (n > 0 && (s[n - 1] == ' ' || s[n - 1] == '\t' || s[n - 1] == '\r')) {
    s[--n] = '\0';
  }
}

void clearWatch() {
  for (uint8_t i = 0; i < NUM_CONTROLS; i++) {
    watch[i] = false;
  }
  anyWatch = false;
  primed = false;
  diagMode = false;
  btnDiagMode = false;
}

void runDiagDump() {
  Serial.print(F("mux0="));
  Serial.print(readMuxChannel(0));
  Serial.print(F(" mux1="));
  Serial.print(readMuxChannel(1));
  Serial.print(F(" mux2="));
  Serial.print(readMuxChannel(2));
  Serial.print(F(" mux3="));
  Serial.print(readMuxChannel(3));
  Serial.print(F(" joyX="));
  Serial.print(readAnalogAveraged(JOY_X));
  Serial.print(F(" S="));
  Serial.print(digitalRead(MUX_S0));
  Serial.print(digitalRead(MUX_S1));
  Serial.print(digitalRead(MUX_S2));
  Serial.println(digitalRead(MUX_S3));
}

void runBtnDiagDump() {
  // Idle = 1 (pulled up). Pressed = 0 (to GND). If idle flickers, wiring is wrong.
  for (uint8_t i = 0; i < NUM_WIRED_BTNS; i++) {
    if (i) {
      Serial.print(' ');
    }
    Serial.print(LABELS[WIRED_BTN_IDX[i]]);
    Serial.print('=');
    Serial.print(digitalRead(WIRED_BTN_PINS[i]));
  }
  Serial.println();
}

void watchAll() {
  for (uint8_t i = 0; i < NUM_CONTROLS; i++) {
    watch[i] = true;
  }
  anyWatch = true;
  primed = false;
}

void watchWiredButtons() {
  for (uint8_t i = 0; i < NUM_CONTROLS; i++) {
    watch[i] = false;
  }
  for (uint8_t i = 0; i < NUM_WIRED_BTNS; i++) {
    watch[WIRED_BTN_IDX[i]] = true;
  }
  anyWatch = true;
  primed = false;
  diagMode = false;
  btnDiagMode = false;
}

void setFilterFromLine(char* line) {
  trimInPlace(line);

  if (line[0] == '\0' || strcmp(line, "off") == 0 || strcmp(line, "stop") == 0) {
    clearWatch();
    return;
  }

  if (strcmp(line, "diag") == 0) {
    clearWatch();
    diagMode = true;
    Serial.println(F("diag on (raw ADC). off to stop."));
    return;
  }

  if (strcmp(line, "btndiag") == 0) {
    clearWatch();
    btnDiagMode = true;
    Serial.println(F("btndiag on (1=idle 0=pressed). off to stop."));
    return;
  }

  if (strcmp(line, "all") == 0) {
    diagMode = false;
    btnDiagMode = false;
    watchAll();
    return;
  }

  if (strcmp(line, "buttons") == 0) {
    watchWiredButtons();
    return;
  }

  bool nextWatch[NUM_CONTROLS] = {false};
  bool ok = false;

  char* token = strtok(line, ",");
  while (token != NULL) {
    trimInPlace(token);
    if (token[0] != '\0') {
      const int8_t idx = labelIndex(token);
      if (idx < 0) {
        Serial.print(F("? unknown: "));
        Serial.println(token);
      } else {
        nextWatch[idx] = true;
        ok = true;
      }
    }
    token = strtok(NULL, ",");
  }

  if (!ok) {
    clearWatch();
    return;
  }

  diagMode = false;
  btnDiagMode = false;
  for (uint8_t i = 0; i < NUM_CONTROLS; i++) {
    watch[i] = nextWatch[i];
  }
  anyWatch = true;
  primed = false;
}

void pollSerial() {
  while (Serial.available() > 0) {
    const char c = (char)Serial.read();
    if (c == '\n') {
      lineBuf[lineLen] = '\0';
      setFilterFromLine(lineBuf);
      lineLen = 0;
    } else if (c == '\r') {
      // ignore
    } else if (lineLen < LINE_MAX - 1) {
      lineBuf[lineLen++] = c;
    } else {
      lineLen = 0;
    }
  }
}

void emitIfChanged(uint8_t index, uint8_t value) {
  if (!watch[index] || value == lastMidi[index]) {
    return;
  }
  lastMidi[index] = value;
  Serial.print(LABELS[index]);
  Serial.print(F(": "));
  Serial.println(value);
}

void scanWatched() {
  debounceButton(JOY_BTN, &joyBtnReading, &joyBtnStable, &joyBtnDebounceAt);
  debounceButton(ENC_SW, &encBtnReading, &encBtnStable, &encBtnDebounceAt);
  pollWiredButtons();

  if (!anyWatch) {
    return;
  }

  uint16_t raw[NUM_ANALOG];
  for (uint8_t i = 0; i < NUM_ANALOG; i++) {
    if (watch[i]) {
      raw[i] = readAnalogControlRaw(i);
    } else {
      raw[i] = 0;
    }
  }

  if (!primed) {
    for (uint8_t i = 0; i < NUM_ANALOG; i++) {
      if (watch[i]) {
        lastRaw[i] = raw[i];
        lastMidi[i] = toMidi(raw[i]);
      }
    }
    lastMidi[IDX_JOY_BTN] = joyBtnStable;
    lastMidi[IDX_ENC] = encMidi;
    lastMidi[IDX_ENC_BTN] = encBtnStable;
    for (uint8_t i = 0; i < NUM_WIRED_BTNS; i++) {
      lastMidi[WIRED_BTN_IDX[i]] = wiredBtnStable[i];
    }
    primed = true;
    return;
  }

  for (uint8_t i = 0; i < NUM_ANALOG; i++) {
    if (!watch[i]) {
      continue;
    }

    const int delta = abs((int)raw[i] - (int)lastRaw[i]);
    if (delta < (int)RAW_DEADBAND) {
      continue;
    }

    const uint8_t midi = toMidi(raw[i]);
    lastRaw[i] = raw[i];
    emitIfChanged(i, midi);
  }

  emitIfChanged(IDX_JOY_BTN, joyBtnStable);
  emitIfChanged(IDX_ENC, encMidi);
  emitIfChanged(IDX_ENC_BTN, encBtnStable);
  for (uint8_t i = 0; i < NUM_WIRED_BTNS; i++) {
    emitIfChanged(WIRED_BTN_IDX[i], wiredBtnStable[i]);
  }
}

void setup() {
  pinMode(MUX_S0, OUTPUT);
  pinMode(MUX_S1, OUTPUT);
  pinMode(MUX_S2, OUTPUT);
  pinMode(MUX_S3, OUTPUT);

  pinMode(JOY_BTN, INPUT_PULLUP);
  pinMode(ENC_CLK, INPUT_PULLUP);
  pinMode(ENC_DT, INPUT_PULLUP);
  pinMode(ENC_SW, INPUT_PULLUP);

  for (uint8_t i = 0; i < NUM_WIRED_BTNS; i++) {
    pinMode(WIRED_BTN_PINS[i], INPUT_PULLUP);
  }

  lastClk = digitalRead(ENC_CLK);
  joyBtnStable = joyBtnReading = activeLowToMidi(JOY_BTN);
  encBtnStable = encBtnReading = activeLowToMidi(ENC_SW);
  pollWiredButtons();
  for (uint8_t i = 0; i < NUM_WIRED_BTNS; i++) {
    wiredBtnStable[i] = wiredBtnReading[i];
  }

  Serial.begin(115200);
  clearWatch();
}

void loop() {
  static unsigned long lastScan = 0;

  pollSerial();
  pollEncoder();

  const unsigned long now = millis();
  if (diagMode || btnDiagMode) {
    if (now - lastScan < 200) {
      return;
    }
    lastScan = now;
    if (diagMode) {
      runDiagDump();
    } else {
      runBtnDiagDump();
    }
    return;
  }

  if (now - lastScan < SCAN_INTERVAL_MS) {
    return;
  }
  lastScan = now;

  scanWatched();
}
