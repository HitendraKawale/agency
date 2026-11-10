#!/bin/sh
# Download a direct-link mockup archive into psd/<name>/ and unpack it there.
# usage: fetch_zip.sh <url> <name> [referer]
# The archive is data only: it is listed and unzipped, never executed.
set -eu
url="$1"; name="$2"; ref="${3:-}"
here="$(cd "$(dirname "$0")/.." && pwd)"
dest="$here/psd/$name"; mkdir -p "$dest"
ua="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
file="$dest/$(basename "${url%%\?*}")"
if [ -n "$ref" ]; then
  curl -sS -L --fail -A "$ua" -e "$ref" -o "$file" "$url"
else
  curl -sS -L --fail -A "$ua" -o "$file" "$url"
fi
case "$(file -b "$file")" in
  Zip*) unzip -q -o "$file" -d "$dest" -x '__MACOSX/*' ;;
  *) echo "not a zip: $(file -b "$file")" >&2; exit 1 ;;
esac
find "$dest" \( -iname '*.psd' -o -iname '*.psb' \) -print
