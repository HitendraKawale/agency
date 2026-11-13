#!/bin/sh
# Capture dune.html frame by frame at 2x and encode a 1080p video (supersampled edges).
#   sh capture.sh <query> <seconds> <out.mp4>      e.g. sh capture.sh "c=sand" 12 out/dune-sand.mp4
set -e
Q="$1"; SEC="$2"; OUT="$3"; FPS=30
DIR="$(cd "$(dirname "$0")" && pwd)"; TMP="$DIR/frames/dune-$$"; mkdir -p "$TMP"
URL="https://brand.blank-agency.localhost:1355/depth/dune?$Q&t=0"
agent-browser set viewport 1920 1080 2 >/dev/null
agent-browser open "$URL" >/dev/null
i=0; until [ "$(agent-browser eval '!!window.__ready' 2>/dev/null)" = "true" ] || [ $i -gt 120 ]; do sleep 0.5; i=$((i+1)); done
N=$(python3 -c "print(int($SEC*$FPS))")
i=0
while [ $i -lt $N ]; do
  t=$(python3 -c "print($i/$FPS)")
  agent-browser eval "window.renderAt($t)" >/dev/null
  agent-browser screenshot "$TMP/$(printf %05d $i).png" >/dev/null
  i=$((i+1))
done
ffmpeg -v error -y -framerate $FPS -i "$TMP/%05d.png" -vf "scale=1920:1080:flags=lanczos" -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -movflags +faststart "$OUT"
rm -rf "$TMP"
echo "$OUT"
