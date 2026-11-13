#!/bin/sh
# Capture a seekable study page (window.renderAt(t), window.__ready) frame by frame.
#   sh capture.sh <path?query> <width> <height> <seconds> <frames_dir>
#   e.g. sh capture.sh "ooh/screen?t=0" 1320 654 8 frames   (?t= stops the live loop; frames_dir relative to this folder)
# Viewport at 2x; frames land as <frames_dir>/f_00000.png ... at 30 fps. Own browser session.
set -e
P="$1"; W="$2"; H="$3"; SEC="$4"; OUT="$5"; FPS=30
export AGENT_BROWSER_SESSION="${AGENT_BROWSER_SESSION:-fork-d}"
DIR="$(cd "$(dirname "$0")" && pwd)"; mkdir -p "$DIR/$OUT"; OUT="$(cd "$DIR/$OUT" && pwd)"
agent-browser set viewport "$W" "$H" 2 >/dev/null
agent-browser open "https://brand.blank-agency.localhost:1355/study/$P" >/dev/null
i=0; until [ "$(agent-browser eval '!!window.__ready' 2>/dev/null)" = "true" ] || [ $i -gt 120 ]; do sleep 0.5; i=$((i+1)); done
N=$(python3 -c "print(int($SEC*$FPS))")
i=0
while [ $i -lt $N ]; do
  t=$(python3 -c "print($i/$FPS)")
  agent-browser eval "window.renderAt($t)" >/dev/null
  agent-browser screenshot "$OUT/f_$(printf %05d $i).png" >/dev/null
  i=$((i+1))
done
echo "$OUT ($N frames)"
