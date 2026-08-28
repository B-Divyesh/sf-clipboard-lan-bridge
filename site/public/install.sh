#!/bin/sh
set -eu

REPO="B-Divyesh/sf-clipboard-lan-bridge"
MANIFEST="https://github.com/$REPO/releases/latest/download/latest.json"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT INT TERM

OS="$(uname -s)"
ARCH="$(uname -m)"
case "$OS" in
  Darwin) PLATFORM="macos"; KIND="dmg" ;;
  Linux) PLATFORM="linux"; KIND="appimage" ;;
  *) echo "Clipboard LAN Bridge supports macOS and Linux through this installer." >&2; exit 1 ;;
esac
case "$ARCH" in arm64|aarch64) WANTED_ARCH="aarch64" ;; *) WANTED_ARCH="x86_64" ;; esac

curl -fsSL "$MANIFEST" -o "$TMP_DIR/latest.json"
ASSET_LINE="$(awk -v p="$PLATFORM" -v a="$WANTED_ARCH" -v k="$KIND" '
  BEGIN { RS="\\{"; FS="\"" }
  $0 ~ "\"platform\"[[:space:]]*:[[:space:]]*\"" p "\"" && $0 ~ "\"kind\"[[:space:]]*:[[:space:]]*\"" k "\"" && ($0 ~ "\"arch\"[[:space:]]*:[[:space:]]*\"" a "\"" || p == "linux") {
    for(i=1;i<=NF;i++){if($i=="url")u=$(i+2);if($i=="sha256")s=$(i+2)} if(u&&s){print u " " s;exit}
  }' "$TMP_DIR/latest.json")"
[ -n "$ASSET_LINE" ] || { echo "No matching $PLATFORM package in the latest release." >&2; exit 1; }
URL="${ASSET_LINE% *}"; EXPECTED="${ASSET_LINE##* }"; FILE="$TMP_DIR/${URL##*/}"
curl -fL "$URL" -o "$FILE"
if command -v sha256sum >/dev/null 2>&1; then ACTUAL="$(sha256sum "$FILE" | awk '{print $1}')"; else ACTUAL="$(shasum -a 256 "$FILE" | awk '{print $1}')"; fi
[ "$ACTUAL" = "$EXPECTED" ] || { echo "Checksum mismatch; nothing was installed." >&2; exit 1; }

if [ "$PLATFORM" = "linux" ]; then
  DEST="${XDG_BIN_HOME:-$HOME/.local/bin}"; mkdir -p "$DEST"; cp "$FILE" "$DEST/clipboard-lan-bridge"; chmod 755 "$DEST/clipboard-lan-bridge"
  echo "Installed and verified Clipboard LAN Bridge at $DEST/clipboard-lan-bridge"
  echo "If needed, add $DEST to PATH. Run: clipboard-lan-bridge"
else
  MOUNT="$TMP_DIR/mount"; mkdir -p "$MOUNT"; hdiutil attach "$FILE" -mountpoint "$MOUNT" -nobrowse -quiet
  APP="$(find "$MOUNT" -maxdepth 1 -name '*.app' -print -quit)"; [ -n "$APP" ] || { hdiutil detach "$MOUNT" -quiet; echo "App not found in image." >&2; exit 1; }
  cp -R "$APP" /Applications/; hdiutil detach "$MOUNT" -quiet
  echo "Installed and verified Clipboard LAN Bridge in /Applications. The build is unsigned; right-click it and choose Open the first time."
fi
