#!/usr/bin/env bash
# Records the /services 3D run: bunker-scene and neon-sign-scene from compronents' fullscreen
# /preview routes, as one camera orbit each so the clip loops without a cut.
# Needs compronents running at https://compronents.localhost:1355.
#
#   reference/scene-clips/record.sh
#
# Both scenes use a fov 10 camera, so a 1150x1000 view cuts the bunker's sign off on the left. The
# bunker's canvas is widened to 2400x1000 and shifted 250px left; the crop keeps the sign in frame
# for the whole orbit. The neon sign fits the plain 1150x1000 view.
#
# agent-browser's recorder falls behind on the scenes' film noise, so the canvas is recorded in the
# page with MediaRecorder and downloaded. The orbit period is 0.8 / golden ratio * 80 = 39.55s
# (FULL_ROTATION_DURATION in both scenes); recording starts 10s in, after the sign's flicker.
set -euo pipefail
OUT="$(cd "$(dirname "$0")" && pwd)/raw"
PUB="$(cd "$(dirname "$0")/../.." && pwd)/public/services"
BASE="https://compronents.localhost:1355/components"
PERIOD=39.55
mkdir -p "$OUT"
ab() { agent-browser --session scene-clips "$@"; }

HIDE="document.head.insertAdjacentHTML('beforeend', '<style>a[aria-label=\"Close fullscreen\"], nextjs-portal { display: none !important; }</style>');"
START="const c = document.querySelector('canvas'); const s = c.captureStream(30);
  const mt = ['video/mp4;codecs=avc1.640033', 'video/webm;codecs=vp9'].find((t) => MediaRecorder.isTypeSupported(t));
  window.__ch = []; window.__rec = new MediaRecorder(s, { mimeType: mt, videoBitsPerSecond: 40e6 });
  __rec.ondataavailable = (e) => __ch.push(e.data); __rec.start(1000); mt + ' ' + c.width + 'x' + c.height"
STOP="(async () => { await new Promise((r) => { __rec.onstop = r; __rec.stop(); });
  const b = new Blob(__ch, { type: __rec.mimeType }); const a = document.createElement('a');
  a.id = 'dl'; a.href = URL.createObjectURL(b); a.download = 'clip'; a.textContent = 'dl';
  Object.assign(a.style, { position: 'fixed', top: '0', left: '300px', zIndex: '99', background: '#fff', padding: '8px' });
  document.body.appendChild(a); return b.size + ' ' + b.type; })()"

# name, px the 2400px canvas shifts left (0 leaves it at the viewport size)
rec() {
  local n=$1 shift=$2
  ab open "$BASE/$n/preview" >/dev/null
  ab set viewport 1150 1000 >/dev/null
  ab wait 1500 >/dev/null
  ab eval "$HIDE const r = document.querySelector('canvas').parentElement; if ($shift) Object.assign(r.style, { position: 'fixed', top: '0', left: '-${shift}px', width: '2400px', height: '1000px', aspectRatio: 'auto', zIndex: '50' }); 1" >/dev/null
  ab wait 10000 >/dev/null
  ab eval "$START"
  ab wait 44000 >/dev/null
  ab eval "$STOP"
  ab download '#dl' "$OUT/$n.mp4"
}
rec bunker-scene 250
rec neon-sign-scene 0
ab close >/dev/null 2>&1 || true

# one orbit from 1s in. CRF 32 keeps the bunker's grain (36 smears it); the neon sign has less.
ffmpeg -v error -y -ss 1.0 -i "$OUT/bunker-scene.mp4" -t "$PERIOD" -vf "crop=1150:1000:250:0,fps=30,format=yuv420p" \
  -c:v libx264 -preset slow -crf 32 -an -movflags +faststart "$PUB/3d-bunker.mp4"
ffmpeg -v error -y -ss 1.0 -i "$OUT/neon-sign-scene.mp4" -t "$PERIOD" -vf "scale=720:626:flags=lanczos,fps=30,format=yuv420p" \
  -c:v libx264 -preset slow -crf 30 -an -movflags +faststart "$PUB/3d-neon-sign.mp4"
for n in 3d-bunker 3d-neon-sign; do ffmpeg -v error -y -i "$PUB/$n.mp4" -frames:v 1 -q:v 3 "$PUB/$n.jpg"; done
ls -la "$PUB"/3d-bunker.* "$PUB"/3d-neon-sign.*
