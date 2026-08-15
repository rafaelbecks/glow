#!/usr/bin/env bash
# One-time Raspberry Pi setup for GLOW Chromium kiosk.
set -euo pipefail

REPO_URL="${GLOW_REPO_URL:-}"
GLOW_DIR="${GLOW_DIR:-$HOME/glow}"
GLOW_BRANCH="${GLOW_BRANCH:-main}"
GLOW_PORT="${GLOW_PORT:-8080}"
GLOW_ORIGIN="http://127.0.0.1:${GLOW_PORT}"

if [[ "$(id -u)" -eq 0 ]]; then
  echo "Run as the desktop user (not root)."
  exit 1
fi

echo "==> Installing packages"
sudo apt-get update
sudo apt-get install -y \
  git \
  curl \
  ca-certificates \
  python3 \
  chromium-browser \
  unclutter \
  x11-xserver-utils \
  || sudo apt-get install -y \
    git curl ca-certificates python3 chromium unclutter x11-xserver-utils

# Node.js 20 (NodeSource) if missing / too old
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v//;s/\..*//')" -lt 18 ]]; then
  echo "==> Installing Node.js 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

if [[ -n "$REPO_URL" ]]; then
  if [[ ! -d "$GLOW_DIR/.git" ]]; then
    echo "==> Cloning $REPO_URL → $GLOW_DIR"
    git clone --branch "$GLOW_BRANCH" "$REPO_URL" "$GLOW_DIR"
  fi
elif [[ ! -d "$GLOW_DIR/.git" ]]; then
  echo "Set GLOW_REPO_URL to clone, or place the repo at $GLOW_DIR"
  exit 1
fi

cd "$GLOW_DIR"
git fetch origin || true
git checkout "$GLOW_BRANCH"
git pull --ff-only origin "$GLOW_BRANCH" || true

echo "==> Building offline dist"
npm run build

echo "==> Installing Chromium managed policies (MIDI / HID / mic / autoplay)"
POLICY_DIR="/etc/chromium/policies/managed"
# Some Pi images use chromium-browser paths
if [[ ! -d /etc/chromium ]] && [[ -d /etc/chromium-browser ]]; then
  POLICY_DIR="/etc/chromium-browser/policies/managed"
fi
sudo mkdir -p "$POLICY_DIR"
TMP_POLICY="$(mktemp)"
sed "s|http://127.0.0.1:8080|${GLOW_ORIGIN}|g" \
  "$GLOW_DIR/kiosk/chromium-policies.json" > "$TMP_POLICY"
sudo cp "$TMP_POLICY" "$POLICY_DIR/glow-kiosk.json"
rm -f "$TMP_POLICY"

echo "==> Disabling screen blanking (X11)"
mkdir -p "$HOME/.config/autostart"
cat > "$HOME/.config/autostart/glow-no-blank.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=GLOW Disable Blanking
Exec=sh -c "xset s off; xset -dpms; xset s noblank"
X-GNOME-Autostart-enabled=true
EOF

echo "==> Installing autostart kiosk entry"
BOOT_SCRIPT="$GLOW_DIR/kiosk/boot.sh"
chmod +x "$GLOW_DIR/kiosk/"*.sh
cat > "$HOME/.config/autostart/glow-kiosk.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=GLOW Kiosk
Exec=bash -lc '$BOOT_SCRIPT'
X-GNOME-Autostart-enabled=true
EOF

# Optional systemd user service (enable only if autostart is unreliable):
#   systemctl --user enable --now glow-kiosk.service
mkdir -p "$HOME/.config/systemd/user"
cat > "$HOME/.config/systemd/user/glow-kiosk.service" <<EOF
[Unit]
Description=GLOW Chromium kiosk
After=graphical-session.target network-online.target
Wants=network-online.target

[Service]
Type=simple
Environment=GLOW_DIR=$GLOW_DIR
Environment=GLOW_BRANCH=$GLOW_BRANCH
Environment=GLOW_PORT=$GLOW_PORT
Environment=DISPLAY=:0
ExecStart=$BOOT_SCRIPT
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload

echo
echo "Setup complete."
echo "  Repo:   $GLOW_DIR"
echo "  Origin: $GLOW_ORIGIN"
echo "Reboot to launch kiosk (autostart), or run: $BOOT_SCRIPT"
echo "Optional: systemctl --user enable --now glow-kiosk.service"
echo
echo "Tip: set Raspberry Pi OS to auto-login to this user (raspi-config → System → Auto Login)."
