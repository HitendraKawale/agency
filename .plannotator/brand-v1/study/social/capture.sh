#!/bin/sh
# Capture story.html frame by frame (window.renderAt) and encode a 1080 x 1920 mp4.
#   sh capture.sh out/stories.mp4 [seconds=14.2]
set -e
OUT="$1"; SEC="${2:-14.2}"; FPS=30
DIR="$(cd "$(dirname "$0")" && pwd)"; TMP="$DIR/frames-$$"; mkdir -p "$TMP"
export AGENT_BROWSER_SESSION="${AGENT_BROWSER_SESSION:-fork-a3}"
T() { perl -e 'alarm shift; exec @ARGV' "$@"; }   # no coreutils timeout on macOS
T 60 agent-browser set viewport 1080 1920 1 >/dev/null || true
# open can outlast its load wait while three.js streams in; the title check below is the real gate
T 120 agent-browser open "https://brand.blank-agency.localhost:1355/study/social/story?t=0" >/dev/null || true
i=0; until [ "$(T 30 agent-browser get title 2>/dev/null)" = "ready" ] || [ $i -gt 120 ]; do sleep 0.5; i=$((i+1)); done
N=$(python3 -c "print(int($SEC*$FPS))")
i=0
while [ $i -lt $N ]; do
  t=$(python3 -c "print($i/$FPS)")
  T 90 agent-browser eval "window.renderAt($t)" >/dev/null || T 90 agent-browser eval "window.renderAt($t)" >/dev/null
  T 90 agent-browser screenshot "$TMP/$(printf %05d $i).png" >/dev/null
  i=$((i+1))
done
ffmpeg -v error -y -framerate $FPS -i "$TMP/%05d.png" -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p -movflags +faststart "$DIR/$OUT"
rm -rf "$TMP"
echo "$DIR/$OUT"
