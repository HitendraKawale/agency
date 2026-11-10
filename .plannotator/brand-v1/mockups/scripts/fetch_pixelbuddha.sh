#!/bin/sh
# Download a free Pixelbuddha product zip into psd/<name>/ without an account.
# usage: fetch_pixelbuddha.sh <product-slug e.g. 5356-stage-screen-mockup> <name>
# The site's /download/<slug> page calls /download/make-link/<slug>, which returns
# a 15-minute signed R2 URL as JSON. Only works for products marked Free.
set -eu
slug="$1"; name="$2"
here="$(cd "$(dirname "$0")/.." && pwd)"
dest="$here/psd/$name"; mkdir -p "$dest"
ua="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
jar="$dest/.cookies"
curl -sS -A "$ua" -c "$jar" -b "$jar" -o /dev/null "https://pixelbuddha.net/download/$slug"
url=$(curl -sS -A "$ua" -c "$jar" -b "$jar" -H "Accept: application/json" \
  -H "Referer: https://pixelbuddha.net/download/$slug" \
  "https://pixelbuddha.net/download/make-link/$slug" \
  | python3 -I -c 'import json,sys
d=json.load(sys.stdin)
if d.get("error"): sys.exit("pixelbuddha: "+d["error"])
print(d["url"])')
rm -f "$jar"
curl -sS -L --fail -o "$dest/$slug.zip" "$url"
unzip -q -o "$dest/$slug.zip" -d "$dest" -x '__MACOSX/*'
find "$dest" -iname '*.psd' -print
