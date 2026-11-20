#!/usr/bin/env bash
# Records the /services Websites run: compronents scroll components from their fullscreen
# /preview routes, scrolled with a rAF scroll of each component's own scroller while
# agent-browser records. Needs compronents running at https://compronents.localhost:1355.
#
#   reference/web-clips/record.sh [name...]   # default: all three
#
# Each clip is name:start:stop:ms:ease. start and stop are scroll positions in px (stop 0 = the
# bottom), ms is how long the scroll takes, ease is "inout" (cubic) or "linear". The ranges hold
# each clip on its effect: the showreel ends at full size; the dissolve's progress is
# scroll / 750 * 2, and its visible part runs from about 200 to 350px, so it crosses that slowly.
set -euo pipefail
OUT="$(cd "$(dirname "$0")" && pwd)/raw"
BASE="https://compronents.localhost:1355/components"
mkdir -p "$OUT"
CLIPS=(
  shader-tunnel-slider:0:0:7000:inout
  showreel-zoom-scroll:0:950:5000:inout
  webgl-dissolve-scroll:170:380:5000:linear
)
# the component's own scroller: the last element that overflows vertically
FIND='[...document.querySelectorAll("*")].filter((e) => e.scrollHeight > e.clientHeight + 20 && getComputedStyle(e).overflowY !== "visible").pop()'

for clip in "${CLIPS[@]}"; do
  IFS=: read -r n START STOP MS EASE <<<"$clip"
  if [ $# -gt 0 ] && [[ ! " $* " =~ " $n " ]]; then continue; fi

  agent-browser open "$BASE/$n/preview" >/dev/null
  agent-browser set viewport 1150 1000 >/dev/null
  agent-browser wait 3000 >/dev/null
  # hide the preview's close button and Next's dev badge, and park the scroller at the start
  agent-browser eval "document.head.insertAdjacentHTML('beforeend', '<style>a[aria-label=\"Close fullscreen\"], nextjs-portal { display: none !important; }</style>'); ($FIND).scrollTop = $START; 1" >/dev/null
  agent-browser wait 1500 >/dev/null
  agent-browser record start "$OUT/$n.webm" --fps 30 >/dev/null
  echo "$n: $(agent-browser eval "(async () => {
    const s = $FIND;
    await new Promise((r) => setTimeout(r, 900));
    const end = Math.min(s.scrollHeight - s.clientHeight, $STOP || Infinity), t0 = performance.now();
    const ease = '$EASE' === 'linear' ? (x) => x : (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    await new Promise((done) => {
      const step = (now) => {
        const p = Math.min(1, (now - t0) / $MS);
        s.scrollTop = $START + ease(p) * (end - $START);
        p < 1 ? requestAnimationFrame(step) : done();
      };
      requestAnimationFrame(step);
    });
    return 'scrolled $START to ' + end;
  })()")"
  agent-browser wait 1200 >/dev/null
  agent-browser record stop >/dev/null
done
agent-browser close >/dev/null 2>&1 || true
ls -la "$OUT"
