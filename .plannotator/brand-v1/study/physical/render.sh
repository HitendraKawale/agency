#!/bin/sh
# Render emboss.html scenes at 2x into mockups/out/study/<scene>.png
#   sh render.sh keycap tag wordmark   (portrait 960x1080)   sh render.sh device (landscape 1600x900)
set -e
export AGENT_BROWSER_SESSION=fork-c
DIR="$(cd "$(dirname "$0")" && pwd)"; OUT="$DIR/../../mockups/out/study"; mkdir -p "$OUT"
for s in "$@"; do
  case "$s" in device) agent-browser set viewport 1600 900 2 >/dev/null ;; *) agent-browser set viewport 960 1080 2 >/dev/null ;; esac
  agent-browser open "https://brand.blank-agency.localhost:1355/study/physical/emboss?s=$s" >/dev/null
  i=0; until [ "$(agent-browser get title 2>/dev/null)" = "ready" ] || [ $i -gt 120 ]; do sleep 0.5; i=$((i+1)); done
  [ "$(agent-browser get title 2>/dev/null)" = "ready" ] || { echo "$s: not ready" >&2; agent-browser console 2>/dev/null | tail -5 >&2; exit 1; }
  agent-browser screenshot "$OUT/$s.png" >/dev/null
  echo "$OUT/$s.png"
done
