#!/bin/sh
# Small copies of the Showcase montages and the services scenes for the /people CRT wall
# (public/people/wall). Each TV screen there is ~250px wide, so the full-size clips were 8 MB of
# video for pictures that small. 480px wide, 24fps, at most 12s, no audio.
# Re-run after a montage or a services clip changes.
set -e
cd "$(dirname "$0")/../public"
OUT=people/wall/clips
mkdir -p "$OUT"
for src in showcase/parflow/montage.mp4 showcase/organic/montage.mp4 showcase/relay/montage.mp4 \
  showcase/moneybee/montage.mp4 showcase/rainpulse/montage.mp4 showcase/ralsonics/montage.mp4 \
  showcase/kitse/montage.mp4 showcase/yoinkd/montage.mp4 showcase/gov/montage.mp4 \
  services/3d-bunker.mp4 services/3d-neon-sign.mp4 services/web-tunnel.mp4 services/web-dissolve.mp4; do
  name=$(echo "$src" | sed -E 's#^showcase/([^/]+)/montage\.mp4$#\1#; s#^services/(.+)\.mp4$#\1#')
  ffmpeg -v error -y -i "$src" -t 12 -an -vf "scale=480:-2:flags=lanczos,fps=24" \
    -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart "$OUT/$name.mp4"
  printf "%-14s %5dKB -> %4dKB\n" "$name" $(($(wc -c <"$src")/1024)) $(($(wc -c <"$OUT/$name.mp4")/1024))
done
