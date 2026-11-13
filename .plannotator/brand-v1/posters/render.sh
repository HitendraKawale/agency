#!/bin/sh
# Render series.html posters at 2x (2262 x 3200) into out/series/<name>.png
#   sh render.sh launch lineage roadster cybertruck
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
agent-browser set viewport 1131 1600 2 >/dev/null
for p in "$@"; do
  agent-browser open "https://brand.blank-agency.localhost:1355/posters/series?p=$p" >/dev/null
  i=0; until [ "$(agent-browser get title 2>/dev/null)" = "ready" ] || [ $i -gt 120 ]; do sleep 0.5; i=$((i+1)); done
  agent-browser screenshot "$DIR/out/series/$p.png" >/dev/null
  echo "$DIR/out/series/$p.png"
done
