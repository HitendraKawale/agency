#!/bin/sh
# Capture the mono tree loop (8 s) frame by frame at 2x into mono.mp4 (1920 x 2160, 30 fps).
#   AGENT_BROWSER_SESSION=fork-e sh capture.sh
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"; TMP="$DIR/frames"; rm -rf "$TMP"; mkdir -p "$TMP"; FPS=30; N=240
agent-browser set viewport 960 1080 2 >/dev/null
agent-browser open "https://brand.blank-agency.localhost:1355/study/mono/?t=0" >/dev/null
i=0; until [ "$(agent-browser get title 2>/dev/null)" = "ready" ] || [ $i -gt 60 ]; do sleep 0.5; i=$((i+1)); done
i=0
while [ $i -lt $N ]; do
  agent-browser eval "renderAt($i/$FPS)" >/dev/null
  agent-browser screenshot "$TMP/$(printf %05d $i).png" >/dev/null
  i=$((i+1))
done
ffmpeg -v error -y -framerate $FPS -i "$TMP/%05d.png" -c:v libx264 -crf 14 -preset slow -pix_fmt yuv420p -movflags +faststart "$DIR/mono.mp4"
rm -rf "$TMP"; echo "$DIR/mono.mp4"
