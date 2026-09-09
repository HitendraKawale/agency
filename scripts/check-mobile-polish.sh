#!/usr/bin/env bash
set -eu
url=${1:?Usage: bash scripts/check-mobile-polish.sh http://localhost:3000}
export AGENT_BROWSER_SESSION="agency-polish-check-$$"
trap 'agent-browser close >/dev/null 2>&1 || true' EXIT
agent-browser set viewport 390 844
agent-browser open "$url"
agent-browser wait '#top'
agent-browser snapshot -i
agent-browser eval --stdin <<'JS'
const links = [...document.querySelectorAll('.hih-navigation a')];
if (!links.length || links.some(a => a.getBoundingClientRect().height < 44))
  throw new Error('Mobile primary links must be visible with 44px targets');
if (document.documentElement.scrollWidth > innerWidth)
  throw new Error('Homepage overflows horizontally');
sessionStorage.setItem('mobileTvHeight', document.querySelector('.atv-scope').offsetHeight);
JS
agent-browser scrollintoview '#team'
agent-browser wait '.air-gallery'
agent-browser eval --stdin <<'JS'
const gallery = document.querySelector('.air-gallery');
const captions = document.querySelector('.team-captions');
if (getComputedStyle(gallery).columnGap !== getComputedStyle(captions).columnGap)
  throw new Error('Portrait and caption gaps differ');
const photos = [...document.querySelectorAll('.air-slot')];
const names = [...captions.children];
if (photos.some((photo, i) => Math.abs(photo.getBoundingClientRect().left - names[i].getBoundingClientRect().left) > 1))
  throw new Error('Portraits and names do not align');
JS
agent-browser set viewport 1440 844
agent-browser eval --stdin <<'JS'
if (document.querySelector('.atv-scope').offsetHeight <= Number(sessionStorage.getItem('mobileTvHeight')))
  throw new Error('Mobile TV sequence must be shorter than desktop');
JS
printf 'PASS: mobile navigation, overflow, team alignment, and TV pacing\n'
agent-browser errors --json | node -e '
let input = "";
process.stdin.on("data", chunk => input += chunk);
process.stdin.on("end", () => {
  const result = JSON.parse(input);
  if (!result.success || result.data.errors.length) {
    console.error(result.data?.errors || result.error);
    process.exitCode = 1;
  }
});'
agent-browser eval 'document.documentElement.style.scrollBehavior = "auto"'
agent-browser scrollintoview '.atv-control'
agent-browser wait --text 'Pause animation'
agent-browser find role button click --name 'Pause animation'
agent-browser eval --stdin <<'JS'
(async () => {
  const video = document.querySelector('video');
  const time = video.currentTime;
  await new Promise(resolve => setTimeout(resolve, 200));
  if (!video.paused || video.currentTime !== time)
    throw new Error('Pause must stop playback, not just change the label');
})();
JS
agent-browser find role button click --name 'Play animation'
agent-browser wait --text 'Pause animation'
printf 'PASS: TV pause and resume\n'
agent-browser set media reduced-motion
agent-browser eval --stdin <<'JS'
(async () => {
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  if (!document.querySelector('video').paused)
    throw new Error('Reduced motion must pause the TV');
  const hiddenLines = [...document.querySelectorAll('.rise-line')].filter(line => {
    const transform = getComputedStyle(line).transform;
    return transform !== 'none' && new DOMMatrix(transform).m42 > 1;
  });
  if (hiddenLines.length)
    throw new Error(`Reduced motion leaves ${hiddenLines.length} heading lines hidden`);
})();
JS
printf 'PASS: live reduced-motion toggle keeps headings readable\n'
agent-browser reload
agent-browser wait '.atv-control'
agent-browser eval --stdin <<'JS'
if (!document.querySelector('video').paused || document.querySelector('.rise-line'))
  throw new Error('Reduced-motion page load must start static and readable');
if (getComputedStyle(document.querySelector('.atv-sticky')).position === 'sticky')
  throw new Error('Reduced-motion TV must not pin the page');
JS
agent-browser close
agent-browser --args '--disable-webgl' open "$url"
agent-browser wait '.atv-status'
agent-browser eval --stdin <<'JS'
const heading = document.querySelector('.hih-heading');
if (heading.getBoundingClientRect().height < 40 || getComputedStyle(heading).clipPath !== 'none')
  throw new Error('WebGL failure must leave the brand heading visible');
if (!document.querySelector('.atv-control').disabled || document.querySelector('.atv-scope').offsetHeight > innerHeight)
  throw new Error('Unavailable TV must disable playback and collapse its scroll scope');
JS
printf 'PASS: static initial state and WebGL fallback\n'
agent-browser close
agent-browser open about:blank
agent-browser network route '**/hero-footage.mp4' --abort
agent-browser open "$url"
agent-browser wait '.hih-halftone[data-ready="true"]'
agent-browser wait '.atv-status'
agent-browser eval --stdin <<'JS'
if (!document.querySelector('.atv-control').disabled || document.querySelector('.atv-scope').offsetHeight > innerHeight)
  throw new Error('Blocked video must show a compact, non-interactive fallback');
JS
printf 'PASS: blocked video fallback\n'
