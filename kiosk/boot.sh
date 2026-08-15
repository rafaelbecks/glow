#!/usr/bin/env bash
# Boot: update repo → offline build → local server → Chromium kiosk.
set -euo pipefail

GLOW_DIR="${GLOW_DIR:-$HOME/glow}"
GLOW_BRANCH="${GLOW_BRANCH:-main}"
GLOW_PORT="${GLOW_PORT:-8080}"
GLOW_ORIGIN="http://127.0.0.1:${GLOW_PORT}"
GLOW_PROFILE="${GLOW_PROFILE:-$HOME/.glow-chromium}"
LOG_DIR="${GLOW_LOG_DIR:-$HOME/.glow-kiosk-logs}"
UPDATE_WAIT_SECS="${GLOW_NETWORK_WAIT_SECS:-45}"

mkdir -p "$LOG_DIR" "$GLOW_PROFILE"
exec > >(tee -a "$LOG_DIR/boot.log") 2>&1

echo "==== GLOW kiosk boot $(date -Is) ===="

cd "$GLOW_DIR"

# Wait briefly for network (git pull); continue offline if unavailable.
deadline=$((SECONDS + UPDATE_WAIT_SECS))
while (( SECONDS < deadline )); do
  if ping -c1 -W1 1.1.1.1 >/dev/null 2>&1 || ping -c1 -W1 8.8.8.8 >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Updating from remote ($GLOW_BRANCH)…"
  git fetch origin "$GLOW_BRANCH" && \
    git checkout "$GLOW_BRANCH" && \
    git reset --hard "origin/$GLOW_BRANCH" \
    || echo "WARN: git update failed — using existing tree"
else
  echo "WARN: $GLOW_DIR is not a git repo — skipping update"
fi

chmod +x "$GLOW_DIR/kiosk/"*.sh 2>/dev/null || true

echo "Building offline dist…"
if ! npm run build; then
  if [[ -f "$GLOW_DIR/dist/index.html" ]]; then
    echo "WARN: build failed — serving previous dist/"
  else
    echo "ERROR: build failed and no dist/ available"
    exit 1
  fi
fi

# Stop previous server if any
if [[ -f "$LOG_DIR/server.pid" ]]; then
  kill "$(cat "$LOG_DIR/server.pid")" 2>/dev/null || true
  rm -f "$LOG_DIR/server.pid"
fi
pkill -f "python3 -m http.server ${GLOW_PORT}" 2>/dev/null || true

echo "Starting local server on ${GLOW_ORIGIN}"
cd "$GLOW_DIR/dist"
python3 -m http.server "$GLOW_PORT" --bind 127.0.0.1 \
  >"$LOG_DIR/server.log" 2>&1 &
echo $! >"$LOG_DIR/server.pid"
cd "$GLOW_DIR"

# Wait until server answers
for _ in $(seq 1 30); do
  if curl -fsS "$GLOW_ORIGIN/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

# Hide cursor when idle
if command -v unclutter >/dev/null 2>&1; then
  pkill unclutter 2>/dev/null || true
  unclutter -idle 0.5 -root &
fi

# Disable blanking when X is available
if [[ -n "${DISPLAY:-}" ]] && command -v xset >/dev/null 2>&1; then
  xset s off || true
  xset -dpms || true
  xset s noblank || true
fi

CHROME_BIN=""
for candidate in chromium-browser chromium google-chrome; do
  if command -v "$candidate" >/dev/null 2>&1; then
    CHROME_BIN="$candidate"
    break
  fi
done
if [[ -z "$CHROME_BIN" ]]; then
  echo "ERROR: Chromium not found"
  exit 1
fi

# Kill previous kiosk instance
pkill -f "$CHROME_BIN.*--user-data-dir=${GLOW_PROFILE}" 2>/dev/null || true
sleep 1

echo "Launching $CHROME_BIN kiosk → $GLOW_ORIGIN"
exec "$CHROME_BIN" \
  --user-data-dir="$GLOW_PROFILE" \
  --kiosk \
  --start-fullscreen \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --no-first-run \
  --no-default-browser-check \
  --check-for-update-interval=31536000 \
  --disable-features=TranslateUI \
  --autoplay-policy=no-user-gesture-required \
  --enable-features=WebMIDI,WebHID,WebUSB \
  --unsafely-treat-insecure-origin-as-secure="$GLOW_ORIGIN" \
  --allow-running-insecure-content \
  --use-fake-ui-for-media-stream \
  --password-store=basic \
  --overscroll-history-navigation=0 \
  --disable-pinch \
  --ash-hide-shelf \
  "$GLOW_ORIGIN/"
