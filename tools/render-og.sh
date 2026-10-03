#!/usr/bin/env bash
# Regenerates assets/og.png, assets/readme-banner.png, assets/org-avatar.png and
# the app icons from tools/og-render.html, tools/banner-render.html,
# tools/avatar-render.html and assets/favicon.svg, using headless Chrome
# (ImageMagick cannot rasterize these correctly). All three use
# tools/shoal-field.js for the still shoal of fish.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

shoot() { # src w h out [scale]
  "$CHROME" --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --allow-file-access-from-files \
    --force-device-scale-factor="${5:-1}" --window-size="$2,$3" \
    --virtual-time-budget=10000 --screenshot="$4" "file://$1" >/dev/null 2>&1
}

# Open Graph card
shoot "$ROOT/tools/og-render.html" 1200 630 "$ROOT/assets/og.png"

# README banner, rendered at 2x so it stays crisp on retina
shoot "$ROOT/tools/banner-render.html" 1280 400 "$ROOT/assets/readme-banner.png" 2

# GitHub organization avatar. GitHub has no avatar API, so this PNG is
# uploaded by hand at github.com/organizations/shoal-ing/settings/profile
shoot "$ROOT/tools/avatar-render.html" 512 512 "$ROOT/assets/org-avatar.png"

# Icon: Chrome ignores window widths under ~500px, so render at 512 and downscale.
cat > "$TMP/icon.html" <<HTML
<!DOCTYPE html><meta charset="utf-8">
<style>html,body{margin:0;background:#04121C;width:512px;height:512px}
svg{display:block;width:512px;height:512px}</style>
$(cat "$ROOT/assets/favicon.svg")
HTML
shoot "$TMP/icon.html" 512 512 "$TMP/icon512.png"
cp "$TMP/icon512.png" "$ROOT/assets/icon-512.png"
sips -z 180 180 "$TMP/icon512.png" --out "$ROOT/assets/apple-touch-icon.png" >/dev/null

for f in og.png readme-banner.png org-avatar.png apple-touch-icon.png icon-512.png; do
  printf '%-22s %s\n' "$f" "$(sips -g pixelWidth -g pixelHeight "$ROOT/assets/$f" | tail -2 | tr -d ' \n')"
done
