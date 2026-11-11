#!/bin/sh
# Download a free Mockups-Design (mockups-design.com) product zip into psd/<name>/.
# usage: fetch_mockupsdesign.sh <product-slug e.g. macbook-on-a-black-table-mockup> <name>
# The product page links /download/<id>/, which redirects to /download-in-progress?dlm-dp-dl=<id>;
# that page carries a one-time "force" link (Download Monitor plugin) that returns the zip.
set -eu
slug="$1"; name="$2"
here="$(cd "$(dirname "$0")/.." && pwd)"
dest="$here/psd/$name"; mkdir -p "$dest"
ua="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"
jar="$dest/.cookies"; page="https://mockups-design.com/$slug/"
id=$(curl -sSL -A "$ua" -c "$jar" -b "$jar" "$page" | grep -oE 'mockups-design\.com/download/[0-9]+/' | head -1 | grep -oE '[0-9]+')
[ -n "$id" ] || { echo "no download link on $page" >&2; exit 1; }
force=$(curl -sSL -A "$ua" -c "$jar" -b "$jar" -e "$page" "https://mockups-design.com/download-in-progress?dlm-dp-dl=$id" \
  | grep -oE "https://mockups-design\.com/download/$id/[^\"']*dlm-dp-dl-force=1[^\"']*" | head -1 | sed 's/&#038;/\&/g')
[ -n "$force" ] || { echo "no force link for download $id" >&2; exit 1; }
curl -sSL --fail -A "$ua" -c "$jar" -b "$jar" -e "https://mockups-design.com/download-in-progress?dlm-dp-dl=$id" -o "$dest/$slug.zip" "$force"
rm -f "$jar"
case "$(file -b "$dest/$slug.zip")" in
  Zip*) unzip -q -o "$dest/$slug.zip" -d "$dest" -x '__MACOSX/*' ;;
  *) echo "not a zip: $(file -b "$dest/$slug.zip")" >&2; exit 1 ;;
esac
find "$dest" \( -iname '*.psd' -o -iname '*.psb' \) -print
