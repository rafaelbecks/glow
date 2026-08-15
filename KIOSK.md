# GLOW Raspberry Pi kiosk

Offline Chromium kiosk: boot pulls the repo, builds a self-contained `dist/`, serves it locally, then opens fullscreen Chromium with MIDI/HID/mic permissions.

## Project (dev machine)

```bash
npm run build          # writes offline dist/ (vendors CDN deps into vendor/ cache)
npm run serve:dist     # http://127.0.0.1:8080
```

`scripts/build.mjs` copies the app into `dist/`, downloads CodeMirror / gpu-io / marked / grained / ionicons / Inconsolata into `vendor/` (cached), and rewrites HTML/JS to local paths.

## Pi — one-time setup

1. Flash **Raspberry Pi OS** (desktop), enable **auto-login** (`raspi-config` → System Options → Auto Login).
2. Clone and run setup (replace the repo URL):

```bash
export GLOW_REPO_URL="https://github.com/YOUR_USER/glow.git"
export GLOW_DIR="$HOME/glow"
export GLOW_BRANCH="main"    # optional
export GLOW_PORT="8080"      # optional

git clone --branch "$GLOW_BRANCH" "$GLOW_REPO_URL" "$GLOW_DIR"
bash "$GLOW_DIR/kiosk/setup-pi.sh"
```

Or if the repo is already on the Pi:

```bash
GLOW_DIR="$HOME/glow" bash "$HOME/glow/kiosk/setup-pi.sh"
```

Setup installs Chromium, Node, git, disables screen blanking, installs Chromium **managed policies** (auto-allow mic / MIDI / WebHID), and enables boot via `~/.config/autostart` + a user systemd unit.

3. Reboot. On each boot, `kiosk/boot.sh`:

- waits briefly for network
- `git fetch` + hard reset to `origin/$GLOW_BRANCH`
- `npm run build` (uses cached `vendor/` when offline)
- serves `dist/` on `127.0.0.1:8080`
- launches Chromium `--kiosk` fullscreen

## Useful commands

```bash
# Manual launch
bash ~/glow/kiosk/boot.sh

# Logs
less ~/.glow-kiosk-logs/boot.log

# Stop kiosk + server
pkill -f chromium; pkill -f "http.server 8080"
```

## Notes

- First build needs network (to fill `vendor/`). Later boots can still run offline if git/build fail — previous `dist/` is kept.
- Point `GLOW_BRANCH` at the branch you deploy.
- Policies live in `/etc/chromium/policies/managed/glow-kiosk.json` (or `chromium-browser`).
- For MIDI/HID hardware, plug in before or after boot; reload the page if the device appears late (`Ctrl+R` exits kiosk focus — use a keyboard, or reboot).
