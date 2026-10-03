#!/usr/bin/env bash
# Assembles dist/: the exact set of files that should be public.
# An explicit allowlist, so repo tooling can never leak onto the site by accident.
# There is no build step for development: serve the repo root directly.
#
# Deploy with tools/deploy.sh (builds origin/main in a clean worktree; see
# README, Deploy). Do not deploy this script's dist/ directly: it is built from
# whatever the working copy holds, which may not be main.
set -euo pipefail
cd "$(dirname "$0")/.."

# The Content-Security-Policy in _headers has no 'unsafe-inline'. Refuse to build
# when a page carries something it would block: a style="" attribute (run
# tools/csp-inline-styles.py), or an inline <script> whose sha256 is not in
# _headers.
python3 - <<'EOF'
import base64, hashlib, re, sys
headers = open('_headers').read()
bad = 0
for page in ('index.html', '404.html'):
    text = open(page).read()
    for attrs, body in re.findall(r'<script([^>]*)>(.*?)</script>', text, re.S):
        if 'src=' in attrs or 'application/ld+json' in attrs:
            continue
        h = 'sha256-' + base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()
        if f"'{h}'" not in headers:
            print(f"CSP in _headers does not allow the inline script in {page} ('{h}')", file=sys.stderr)
            bad = 1
    if re.search(r'\sstyle="', text):
        print(f'{page} has a style="" attribute, which the CSP blocks', file=sys.stderr)
        bad = 1
    if re.search(r'\son[a-z]+="', text):
        print(f'{page} has an inline event handler, which the CSP blocks', file=sys.stderr)
        bad = 1
sys.exit(bad)
EOF

# Every image the stylesheet or the pages point at must exist. Refuse to ship a
# page whose images 404. (The design has no photo slots today; this keeps it
# honest if one is added.)
missing=0
for img in $( { grep -oE '/assets/[A-Za-z0-9/_.-]+\.(png|webp|jpg|jpeg|svg|avif)' assets/shoal.css index.html 404.html site.webmanifest || true; } | sed 's/^[^:]*://' | sort -u); do
  [ -s ".$img" ] || { echo "missing $img" >&2; missing=1; }
done
[ "$missing" = 0 ] || exit 1

rm -rf dist
mkdir -p dist

# top-level files
for f in index.html 404.html robots.txt sitemap.xml llms.txt site.webmanifest _headers _redirects; do
  cp "$f" dist/
done

# directories served as-is
for d in assets .well-known; do
  cp -R "$d" "dist/$d"
done

find dist -name '.DS_Store' -delete

# GitHub-only artwork: not part of the site.
rm -f dist/assets/readme-banner.png dist/assets/org-avatar.png

# Cache busting. Asset filenames are not content-hashed in the repo, so a deploy
# alone cannot invalidate a cached file. Stamp each reference with a short
# content hash here; _headers can then cache /assets/*.css and *.js immutably
# because the URL changes when the file does.
hash_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" | cut -c1-8
  else
    shasum -a 256 "$1" | cut -c1-8
  fi
}
# `sed -i` is not portable: GNU takes no argument, BSD demands one. Write beside the file and move.
stamp() { # file from to
  sed "s|$2|$3|g" "$1" > "$1.stamped" && mv "$1.stamped" "$1"
}

# Images first: every url("/assets/...") in the stylesheet gets the image's own
# hash, before the stylesheet itself is hashed, so its stamp changes with them.
for img in $(grep -oE 'url\("/assets/[^"?]+"\)' dist/assets/shoal.css | sed -E 's/^url\("(.*)"\)$/\1/' | sort -u); do
  h=$(hash_of "dist$img")
  stamp dist/assets/shoal.css "$img\"" "$img?v=$h\""
  grep -q "$img?v=$h\"" dist/assets/shoal.css || { echo "cache stamp for $img did not apply" >&2; exit 1; }
done

# og.png in the pages' meta tags, so a re-rendered card reaches link previews.
h=$(hash_of dist/assets/og.png)
for page in dist/*.html; do stamp "$page" '/assets/og.png"' "/assets/og.png?v=$h\""; done
grep -q "/assets/og.png?v=$h\"" dist/index.html || { echo "cache stamp for og.png did not apply" >&2; exit 1; }

for f in shoal.css shoal.js; do
  h=$(hash_of "dist/assets/$f")
  for page in dist/*.html; do stamp "$page" "/assets/$f\"" "/assets/$f?v=$h\""; done
  # A sed that matches nothing exits 0. Fail instead of shipping an immutable
  # asset under a URL that never changes.
  grep -q "/assets/$f?v=$h\"" dist/index.html || { echo "cache stamp for $f did not apply" >&2; exit 1; }
done

echo "dist/ assembled:"
find dist -type f | sed 's|^dist/|  |' | sort
echo "  ($(find dist -type f | wc -l | tr -d ' ') files)"
