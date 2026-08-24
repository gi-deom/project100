#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.local/bin" "$HOME/.local/share/applications" "$HOME/.config/systemd/user"
install -m 755 "$PROJECT_DIR/northlight-wallpaper.py" "$HOME/.local/bin/northlight-wallpaper.py"
sed "s#%h/.local/bin/northlight-wallpaper.py#$HOME/.local/bin/northlight-wallpaper.py#" "$PROJECT_DIR/northlight-wallpaper.service" > "$HOME/.config/systemd/user/northlight-wallpaper.service"
cp "$PROJECT_DIR/northlight-wallpaper.timer" "$HOME/.config/systemd/user/northlight-wallpaper.timer"
sed "s#\"\$(dirname \"%k\")\"#\"$PROJECT_DIR\"#" "$PROJECT_DIR/northlight.desktop" > "$HOME/.local/share/applications/northlight.desktop"
systemctl --user daemon-reload
systemctl --user enable --now northlight-wallpaper.timer
echo "Gidlight installed. Launch it from your applications menu as Gidlight Wallpaper."