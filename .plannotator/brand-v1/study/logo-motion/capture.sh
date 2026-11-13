#!/bin/sh
# Capture a study page frame by frame through window.renderAt(t) and encode 1920x1080 mp4.
# Used for study/logo-motion and study/typography.
#   sh capture.sh <page path under study/> <seconds> <out.mp4> [fps]     e.g. sh capture.sh logo-motion 8 out.mp4
#   sh capture.sh <page> stills <out_dir> "0 1.2 2.5"                    stills at the listed times
# Renders at 2x and downscales (supersampled edges). Uses agent-browser session $AGENT_BROWSER_SESSION (default fork-b).
set -e
export AGENT_BROWSER_SESSION="${AGENT_BROWSER_SESSION:-fork-b}"
PAGE="$1"; SEC="$2"; OUT="$3"; FPS="${4:-30}"
URL="https://brand.blank-agency.localhost:1355/study/$PAGE/?t=0"
agent-browser set viewport 1920 1080 2 >/dev/null
agent-browser open "$URL" >/dev/null
i=0; until [ "$(agent-browser eval '!!window.__ready' 2>/dev/null)" = "true" ] || [ $i -gt 120 ]; do sleep 0.5; i=$((i+1)); done
if [ "$SEC" = "stills" ]; then
  mkdir -p "$OUT"
  for t in $4; do
    agent-browser eval "window.renderAt($t)" >/dev/null
    agent-browser screenshot "$OUT/t$t.png" >/dev/null
  done
  echo "$OUT"; exit 0
fi
TMP="$(mktemp -d /tmp/studycap.XXXX)"
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
