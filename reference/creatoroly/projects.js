// All projects — hero (things that open videos, Instagram phone), quick view, reveal-on-scroll.

const R2 = 'https://pub-553844d9241346ff91d8995eba5558c7.r2.dev/VIds/';
const VIDEOS = [
  { name: 'Airbuds',   file: 'squarevids/FINALairbuds.mp4',   poster: 'poster-FINALairbuds.jpg' },
  { name: 'Typo tab',  file: 'squarevids/finaltypotab.mp4',   poster: 'poster-finaltypotab.jpg' },
  { name: 'Tepai',     file: 'squarevids/finaltepai.mp4',     poster: 'poster-finaltepai.jpg' },
  { name: 'Ask AI',    file: 'FinalAskAI.mp4',                poster: 'poster-finalaskai.jpg' },
  { name: 'Skroll',    file: 'squarevids/finalskroll.mp4',    poster: 'poster-finalskroll.jpg' },
  { name: 'Satellite', file: 'squarevids/finalsattelite.mp4', poster: 'poster-finalsattelite.jpg' },
  { name: 'Mobbin',    file: 'squarevids/finalmobbin.mp4',    poster: 'poster-finalmobbin.jpg' },
  { name: 'Pool',      file: 'poolweb.mp4',                   poster: 'poster-poolweb.jpg', aspect: 16 / 9 },
  { name: 'Alien',     file: 'squarevids/finalalienfolder.mp4', poster: 'poster-finalalienfolder.jpg' },
];
const POSTERS = '/assets/projects/';
const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SAFARI = document.documentElement.classList.contains('is-safari');   // lighter effects there
let qvOpen = false;                                    // quick view state

// ---------- latest projects come in a new order on every visit ----------
// (never the same one on top twice in a row; the window/text sides keep alternating)
{
  const list = [...document.querySelectorAll('#latest .pj-project')];   // (not the Editucation block)
  if (list.length > 1) {
    const parent = list[0].parentElement, anchor = list[list.length - 1].nextSibling;
    let lastTop = null;
    try { lastTop = localStorage.getItem('oly_top_project'); } catch {}
    let order;
    do {
      order = [...list];
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    } while (order[0].id === lastTop);
    try { localStorage.setItem('oly_top_project', order[0].id); } catch {}
    order.forEach((p, i) => { p.classList.toggle('is-flipped', i % 2 === 1); parent.insertBefore(p, anchor); });
  }
}

// ---------- artboard scaling (same as the other pages, but this one grows with its content) ----------
const stage = document.getElementById('stage');
let scale = 1;
const fit = () => {
  const w = document.documentElement.clientWidth;   // visible width (without the scrollbar)
  if (w < 768) {
    scale = 1;
    stage.style.transform = stage.style.width = stage.parentElement.style.height = '';
    document.querySelector('.pj-hero')?.style.setProperty('--hs', w / 600);   // phone hero: 600px composition → screen width
  } else {
    scale = w <= 1440 ? w / 1920 : (1440 + (w - 1440) * 0.3) / 1920;
    stage.style.width = `${w / scale}px`;
    stage.style.transform = `scale(${scale})`;
    stage.parentElement.style.height = `${stage.offsetHeight * scale}px`;
  }
  fitFlow();
};
new ResizeObserver(() => {
  if (window.innerWidth >= 768) stage.parentElement.style.height = `${stage.offsetHeight * scale}px`;
}).observe(stage);
window.addEventListener('resize', fit);
// the scrollbar appears only once the page is long → the visible width shrinks without a resize event
let lastW = document.documentElement.clientWidth;
new ResizeObserver(() => {
  const w = document.documentElement.clientWidth;
  if (w !== lastW) { lastW = w; fit(); placeBar(); }
}).observe(document.documentElement);

// the top bar (and its island) stays pinned to the top of the screen. It's moved out of the scaled
// artboard and made position:fixed, so the browser keeps it in place while scrolling (no lag at all).
const topBarEl = document.querySelector('.top');
document.body.appendChild(topBarEl);
topBarEl.classList.add('pj-fixed-top');
// the avatar + pill group is centred on the page (measured, so it stays exact)
const barCentre = () => {
  // layout offsets (not screen rects), so the bar's own entrance animation can't skew the measurement
  const box = el => { let x = 0, n = el; while (n && n !== topBarEl) { x += n.offsetLeft; n = n.offsetParent; } return [x, x + el.offsetWidth]; };
  const [a0, a1] = box(topBarEl.querySelector('.avatar')), [s0, s1] = box(topBarEl.querySelector('.status'));
  return (Math.min(a0, s0) + Math.max(a1, s1)) / 2;        // group centre, in the bar's own px
};
const placeBar = () => {
  const c = barCentre();
  if (window.innerWidth < 768) {
    Object.assign(topBarEl.style, { left: `calc(50% - ${barCentre()}px)`, top: '10px', transform: 'none', transformOrigin: '' });   // phones: the Oly logo + notch together in the middle
    { const a = topBarEl.querySelector(".avatar").getBoundingClientRect(), s = topBarEl.querySelector(".status").getBoundingClientRect(); const d = document.documentElement.clientWidth / 2 - (Math.min(a.left, s.left) + Math.max(a.right, s.right)) / 2; topBarEl.style.left = `${(parseFloat(getComputedStyle(topBarEl).left) + d).toFixed(1)}px`; }   // phones: measured as drawn, nudged to the exact middle
  } else {
    Object.assign(topBarEl.style, {
      left: `calc(50% - ${c * scale}px)`, top: `${22 * scale}px`,
      transform: `scale(${scale})`, transformOrigin: '0 0',
    });
  }
};
window.addEventListener('resize', placeBar);

// ---------- hero ----------
// The flower hill appears behind a wave of pixels that sweeps across it from left to right: ahead of
// the wave nothing, in the wave big blocks getting finer, behind it the clean photo. Then the phone
// comes up and the plane, alien, pool, satellite and book pop out — each one opens a video.
const hill = document.querySelector('.hx-hill');
const hillImg = hill.querySelector('.hx-hill-img');
const hillPix = hill.querySelector('.hx-hill-pix');
const revealHill = () => {
  if (still) { hill.classList.add('is-done'); return; }
  // the wave is drawn at half the photo's resolution (it only lasts a moment); the real photo takes over after
  const w = Math.round(hillImg.naturalWidth / 2), h = Math.round(hillImg.naturalHeight / 2);
  hillPix.width = w; hillPix.height = h;
  const ctx = hillPix.getContext('2d');
  // the photo pre-pixelated at a few block sizes (finest first = right behind the clean part)
  const BLOCKS = [3, 6, 12, 22, 36].map(b => Math.round(b * w / 1774));
  const layers = BLOCKS.map(b => {
    const tiny = document.createElement('canvas');
    tiny.width = Math.ceil(w / b); tiny.height = Math.ceil(h / b);
    tiny.getContext('2d').drawImage(hillImg, 0, 0, tiny.width, tiny.height);
    const big = document.createElement('canvas');
    big.width = w; big.height = h;
    const bctx = big.getContext('2d');
    bctx.imageSmoothingEnabled = false;
    bctx.drawImage(tiny, 0, 0, tiny.width * b, tiny.height * b);
    return big;
  });
  const clean = document.createElement('canvas');
  clean.width = w; clean.height = h;
  clean.getContext('2d').drawImage(hillImg, 0, 0, w, h);
  // the wave runs from the bottom up
  const BAND = h * 0.45;                                     // height of the pixel wave
  const ZONE = BAND / BLOCKS.length;
  const STRIP = Math.round(w / 40);                          // the wave front bends a little per column strip
  const DUR = 1900, START = 0;
  const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  let t0 = null;
  const frame = now => {
    if (t0 === null) t0 = now;
    const k = Math.min(1, Math.max(0, (now - t0 - START) / DUR));
    const front = -BAND * 0.2 + easeInOut(k) * (h + BAND * 1.4);   // distance of the leading edge from the bottom
    ctx.clearRect(0, 0, w, h);
    for (let x = 0; x < w; x += STRIP) {
      const sw = Math.min(STRIP, w - x);
      const f = front;                                        // a straight, clean edge
      // measured from the bottom: the clean photo grows upwards, the pixel band rides on top of it
      const solid = Math.max(0, Math.min(h, f - BAND));
      if (solid > 0) ctx.drawImage(clean, x, h - solid, sw, solid, x, h - solid, sw, solid);
      for (let z = 0; z < BLOCKS.length; z++) {
        const d0 = Math.max(0, f - BAND + z * ZONE), d1 = Math.min(h, f - BAND + (z + 1) * ZONE);
        if (d1 > d0) ctx.drawImage(layers[z], x, h - d1, sw, d1 - d0, x, h - d1, sw, d1 - d0);
      }
    }
    if (k < 1) requestAnimationFrame(frame);
    else hill.classList.add('is-done');
  };
  requestAnimationFrame(frame);
};
// (after the loading screen, if there is one, so the reveal isn't missed under it)
(window.olyLoaderDone || Promise.resolve()).then(() => {
  if (hillImg.complete && hillImg.naturalWidth) revealHill(); else hillImg.addEventListener('load', revealHill, { once: true });
});

// each thing hides a video: click → it grows into the quick view player
document.querySelectorAll('.hx-thing').forEach(thing => {
  const v = VIDEOS.find(x => x.name === thing.dataset.video);
  if (!v) return;
  const video = document.createElement('video');
  video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
  video.dataset.src = R2 + v.file;
  video.poster = POSTERS + v.poster;
  video.hidden = true;
  thing.appendChild(video);
  thing.addEventListener('click', () => openQuickView(video, thing, v.aspect || 1));
});
// the plane leaves a soft grey trail behind its tail while it flies; once it stops the last puffs fade slowly
const plane = document.querySelector('.hx-plane');
const smoke = document.querySelector('.hx-smoke');
if (plane && smoke && !still) {
  const TAIL = [65.1, 24.9];                               // tail tip, from the plane's centre (px, unrotated)
  let flying = false, last = 0, began = 0;
  const TRAIL_FOR = 1000;                                    // ms of the 2.3s flight that leave a trail (it stops early, but the trail it left stays a while)
  const puffAt = (x, y, life) => {
    const p = document.createElement('span');
    p.className = 'hx-puff';
    p.style.left = `${x}px`; p.style.top = `${y}px`;
    p.style.setProperty('--life', `${life}s`);
    p.style.setProperty('--dx', `${(Math.random() * 16 + 6).toFixed(1)}px`);       // drifts back a little
    p.style.setProperty('--dy', `${(Math.random() * 14 - 4).toFixed(1)}px`);
    p.style.width = p.style.height = `${(16 + Math.random() * 12).toFixed(0)}px`;
    p.addEventListener('animationend', () => p.remove());
    smoke.appendChild(p);
  };
  const tail = () => {
    const cs = getComputedStyle(plane);
    const [tx, ty] = cs.translate === 'none' ? [0, 0] : cs.translate.split(' ').map(parseFloat).concat(0).slice(0, 2);
    const sc = cs.scale === 'none' ? 1 : parseFloat(cs.scale);
    const r = (cs.rotate === 'none' ? 0 : parseFloat(cs.rotate)) * Math.PI / 180;
    const cx = plane.offsetLeft + plane.offsetWidth / 2 + tx, cy = plane.offsetTop + plane.offsetHeight / 2 + ty;
    const ox = TAIL[0] * sc, oy = TAIL[1] * sc;
    return [cx + ox * Math.cos(r) - oy * Math.sin(r), cy + ox * Math.sin(r) + oy * Math.cos(r), sc];
  };
  const loop = now => {
    if (!flying) return;
    const age = now - began;
    if (age > TRAIL_FOR) { flying = false; return; }
    if (now - last > 30) {                       // fewer and shorter puffs as it slows down
      last = now;
      const [x, y, sc] = tail();
      if (sc > 0.45) puffAt(x, y, 2.1 + Math.random() * 0.4);   // each puff hangs on longer → a longer trail
    }
    requestAnimationFrame(loop);
  };
  plane.addEventListener('animationstart', e => {
    if (!e.animationName.startsWith('hx-fly')) return;
    flying = true; began = performance.now(); requestAnimationFrame(loop);
  });

}

// satellite is an svg too: in as vector so Safari keeps it sharp (the pool is a light 3× png: as an
// 800 KB svg it loaded late on phones and popped in after its entrance)
document.querySelectorAll('.hx-sat > img').forEach(img => window.inlineSvg?.(img));
// (the book is written straight into the page as an svg: swapping it in later restarted its entrance in Safari)
// the hero's floating things only move while the hero is on screen
new IntersectionObserver(([e]) => document.querySelector('.pj-hero').classList.toggle('is-away', !e.isIntersecting))
  .observe(document.querySelector('.pj-hero'));
function place() {}
function fitFlow() {}


fit();



// ---------- reveal on scroll ----------
// nothing below the hero comes in on its own: it waits until you start scrolling, then comes in with it
// (only a real scroll by the visitor counts — wheel, trackpad, touch, keys or the scrollbar — not the
// browser putting the page back where it was on a refresh; the page always opens at the top anyway)
if ('scrollRestoration' in history && !new URLSearchParams(location.search).has('go')) {
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}
let scrolled = still;
const waiting = new Set();
const reveal = el => { el.classList.add('is-in'); io.unobserve(el); waiting.delete(el); };
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) { waiting.delete(e.target); continue; }
    if (scrolled) reveal(e.target); else waiting.add(e.target);
  }
}, { threshold: 0.18 });
const startScrolled = () => {
  if (scrolled) return;
  scrolled = true;
  waiting.forEach(reveal);
  onScrollSoon();
};
let userInput = false;
const markInput = () => { userInput = true; };
['wheel', 'touchmove', 'pointerdown'].forEach(t => window.addEventListener(t, markInput, { passive: true }));
window.addEventListener('keydown', e => { if (['ArrowDown', 'PageDown', 'End', ' ', 'Spacebar'].includes(e.key)) markInput(); });
window.addEventListener('scroll', () => { if (userInput && window.scrollY > 4) startScrolled(); }, { passive: true });
document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

// ---------- project windows (Maverick, Shotbase, …): play while on screen, 👀 + pixels on hover ----------
const isWindow = el => el.classList.contains('pj-window-video');
document.querySelectorAll('.pj-window-video:not(.pj-placeholder)').forEach(winBtn => {
  const winVideo = winBtn.querySelector('video');
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !qvOpen) {
      if (!winVideo.src) winVideo.src = winVideo.dataset.src;
      winVideo.play().catch(() => {});
    } else winVideo.pause();
  }, { threshold: 0.35 }).observe(winBtn);

  // 👀 follows the pointer over the video (it *is* the cursor there), softly trailing behind
  const eyes = winBtn.querySelector('.pj-eyes');
  const eyePos = { x: 0, y: 0, tx: 0, ty: 0, raf: null };
  const eyeStep = () => {
    eyePos.x += (eyePos.tx - eyePos.x) * 0.35;
    eyePos.y += (eyePos.ty - eyePos.y) * 0.35;
    eyes.style.left = `${eyePos.x}px`;
    eyes.style.top = `${eyePos.y}px`;
    eyePos.raf = Math.abs(eyePos.tx - eyePos.x) + Math.abs(eyePos.ty - eyePos.y) > 0.2 ? requestAnimationFrame(eyeStep) : null;
  };
  const eyeTarget = e => {
    const r = winBtn.getBoundingClientRect();
    const k = r.width / winBtn.offsetWidth || 1;          // the page is scaled
    eyePos.tx = (e.clientX - r.left) / k;
    eyePos.ty = (e.clientY - r.top) / k;
  };
  const touch = e => e.pointerType !== 'mouse' && e.pointerType !== 'pen';   // no hover effect from a finger
  winBtn.addEventListener('pointerenter', e => {
    if (touch(e)) return;
    eyeTarget(e); eyePos.x = eyePos.tx; eyePos.y = eyePos.ty;
    eyes.style.left = `${eyePos.x}px`; eyes.style.top = `${eyePos.y}px`;
    eyes.classList.remove('is-out'); void eyes.offsetWidth; eyes.classList.add('is-in');
  });
  winBtn.addEventListener('pointermove', e => { eyeTarget(e); if (!eyePos.raf) eyePos.raf = requestAnimationFrame(eyeStep); });
  winBtn.addEventListener('pointerleave', () => { eyes.classList.remove('is-in'); eyes.classList.add('is-out'); });

  // pixelated copy of the video while hovering (redrawn every frame into an 80×48 canvas)
  const pix = winBtn.querySelector('.pj-pixels');
  const pixCtx = pix.getContext('2d');
  let pixOn = false, pixOff = null;
  const pixDraw = () => {
    if (!pixOn) return;
    if (winVideo.readyState >= 2) pixCtx.drawImage(winVideo, 0, 0, pix.width, pix.height);
    requestAnimationFrame(pixDraw);
  };
  winBtn.addEventListener('pointerenter', e => { if (touch(e)) return; clearTimeout(pixOff); if (!pixOn) { pixOn = true; pixDraw(); } });
  winBtn.addEventListener('pointerleave', () => { pixOff = setTimeout(() => { pixOn = false; }, 160); });   // after the fade

  winBtn.addEventListener('click', () => {
    if (!winVideo.src) winVideo.src = winVideo.dataset.src;
    openQuickView(winVideo, winBtn, 16 / 9);
  });
});

// ---------- quick view: the video flies out to the middle, everything behind blurs ----------
const qv = document.getElementById('qv');
const qvPlayer = document.getElementById('qvPlayer');
const qvVideo = document.getElementById('qvVideo');
const qvSound = document.getElementById('qvSound');
const qvBar = document.getElementById('qvBar');
let qvSource = null, qvFrom = null;

const QV_PHONE = () => window.innerWidth < 768;        // phones: the player fills the width, square corners
const QV_R = () => (QV_PHONE() ? '0px' : '28px');
const targetRect = aspect => {
  if (QV_PHONE()) { const w = window.innerWidth, h = w / aspect; return { left: 0, top: (window.innerHeight - h) / 2, width: w, height: h }; }
  const maxW = Math.min(window.innerWidth * 0.86, 1280);
  const maxH = window.innerHeight * 0.8;
  let w = maxW, h = w / aspect;
  if (h > maxH) { h = maxH; w = h * aspect; }
  return { left: (window.innerWidth - w) / 2, top: (window.innerHeight - h) / 2, width: w, height: h };
};
// FLIP: put the player at its final spot, then animate from the card's rect to there
const flyFrom = (fromRect, to) => {
  const sx = fromRect.width / to.width, sy = fromRect.height / to.height;
  return `translate(${fromRect.left - to.left}px, ${fromRect.top - to.top}px) scale(${sx}, ${sy})`;
};

function openQuickView(sourceVideo, sourceEl, aspect) {
  if (qvOpen) return;
  qvOpen = true;
  qvSource = sourceEl;
  const from = sourceEl.getBoundingClientRect();
  const to = targetRect(aspect);
  qvFrom = from;
  Object.assign(qvPlayer.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` });

  qvVideo.poster = sourceVideo.poster || sourceEl.querySelector('img')?.src || '';
  qvVideo.src = sourceVideo.currentSrc || sourceVideo.src || sourceVideo.dataset.src;
  qvVideo.currentTime = sourceVideo.currentTime || 0;
  qvVideo.muted = false;                               // the click counts as a gesture → sound is allowed
  qvSound.classList.remove('is-muted');
  qvVideo.play().catch(() => { qvVideo.muted = true; qvSound.classList.add('is-muted'); qvVideo.play().catch(() => {}); });
  sourceVideo.pause();

  if (!sourceEl.classList.contains('hx-thing')) sourceEl.style.visibility = 'hidden';   // hero things stay where they are the whole time
  qv.classList.add('is-open');
  qv.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => qv.classList.add('is-shown'));
  if (still) return;
  const fromThing = sourceEl.classList.contains('hx-thing');
  qvPlayer.animate(
    fromThing
      ? [ // out of a hero thing: grows from it and fades in on the way
          { transform: flyFrom(from, to), borderRadius: '24px', opacity: 0 },
          { opacity: 1, offset: 0.35 },
          { transform: 'none', borderRadius: QV_R(), opacity: 1 },
        ]
      : [
          { transform: flyFrom(from, to), borderRadius: '14px' },
          { transform: 'none', borderRadius: QV_R() },
        ],
    { duration: fromThing ? 560 : 650, easing: 'cubic-bezier(.2, .9, .25, 1.06)' },
  );
}

let qvClosing = null;
function closeQuickView() {
  if (!qvOpen || qvClosing) return;
  const from = qvPlayer.getBoundingClientRect();
  const back = qvSource.getBoundingClientRect();     // where the card is now (page may have scrolled)
  qv.classList.remove('is-shown');                   // controls + blur fade out together with the flight
  // the source picks up where the big player was, so nothing jumps when it reappears
  const src = qvSource.querySelector('video');
  if (src && qvVideo.currentTime) { try { src.currentTime = qvVideo.currentTime; } catch (e) {} }

  const done = () => {
    qvSource.style.visibility = '';                  // show the card first…
    if (isWindow(qvSource)) qvSource.querySelector('video').play().catch(() => {});
    requestAnimationFrame(() => {                    // …then drop the overlay on the next frame (no flash)
      qv.classList.remove('is-open');
      qv.setAttribute('aria-hidden', 'true');
      qvClosing?.cancel();
      qvClosing = null;
      qvVideo.pause();
      qvVideo.removeAttribute('src');
      qvVideo.load();
      qvOpen = false;
      place();
    });
  };
  if (still) { done(); return; }
  // fly back by animating the real box (not a scale), so corners and the video never squash
  if (qvSource.classList.contains('hx-thing')) {
    const thing = qvSource;
    qvClosing = qvPlayer.animate(
      [
        { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: QV_R(), transform: 'none', opacity: 1 },
        { opacity: 1, offset: 0.35 },
        { left: `${back.left}px`, top: `${back.top}px`, width: `${back.width}px`, height: `${back.height}px`, borderRadius: '24px', transform: 'none', opacity: 0 },
      ],
      { duration: 340, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'forwards' },
    );
    // the little knock starts with the flight back, so it lands right as the video gets there
    thing.animate(
      [{ scale: 1 }, { scale: 1.06, offset: 0.35 }, { scale: 0.985, offset: 0.7 }, { scale: 1 }],
      { duration: 420, delay: 160, easing: 'ease-out' },
    );
    qvClosing.onfinish = done;
    return;
  }
  qvClosing = qvPlayer.animate(
    [
      { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px`, borderRadius: QV_R(), transform: 'none' },
      { left: `${back.left}px`, top: `${back.top}px`, width: `${back.width}px`, height: `${back.height}px`, borderRadius: isWindow(qvSource) ? '17px' : '14px', transform: 'none' },
    ],
    { duration: 480, easing: 'cubic-bezier(.3, .7, .2, 1)', fill: 'forwards' },
  );
  qvClosing.onfinish = done;
}

document.getElementById('qvClose').addEventListener('click', closeQuickView);
qv.querySelector('.qv-backdrop').addEventListener('click', closeQuickView);
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeQuickView(); });
qvVideo.addEventListener('click', () => (qvVideo.paused ? qvVideo.play() : qvVideo.pause()));
const qvRange = document.getElementById('qvRange');
const showVolume = () => {
  const v = qvVideo.muted ? 0 : qvVideo.volume;
  qvRange.value = v;
  qvRange.style.setProperty('--vol', `${v * 100}%`);
  qvSound.classList.toggle('is-muted', v === 0);
};
qvSound.addEventListener('click', () => {
  if (qvVideo.muted || qvVideo.volume === 0) { qvVideo.muted = false; if (qvVideo.volume === 0) qvVideo.volume = 0.6; }
  else qvVideo.muted = true;
  showVolume();
});
qvRange.addEventListener('input', () => {
  qvVideo.volume = +qvRange.value;
  qvVideo.muted = +qvRange.value === 0;
  showVolume();
});
qvVideo.addEventListener('volumechange', showVolume);
qvVideo.addEventListener('timeupdate', () => {
  if (qvVideo.duration) qvBar.style.width = `${(qvVideo.currentTime / qvVideo.duration) * 100}%`;
});

placeBar();   // after fit() has set the real scale

// ---------- scroll animation for the projects ----------
// each project gets --p: 0 when it's just entering at the bottom → 1 once it's well in view
const projects = [...document.querySelectorAll('.pj-project')];
const ease = t => 1 - Math.pow(1 - t, 3);
// (only writes when the value actually changes; once a project has settled at 1 its window drops
// the blur filter entirely, so a playing video isn't re-blurred every frame)
const lastP = new Map();
const onScroll = () => {
  scrollQueued = false;
  if (!scrolled) return;                                     // nothing moves in before the first scroll
  const vh = window.innerHeight;
  for (const p of projects) {
    const r = p.getBoundingClientRect();
    const t = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.75)));
    const v = still ? '1' : ease(t).toFixed(3);
    if (lastP.get(p) === v) continue;
    lastP.set(p, v);
    p.style.setProperty('--p', v);
    p.classList.toggle('is-settled', v === '1.000' || v === '1');
  }
};
let scrollQueued = false;
function onScrollSoon() { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); } }
window.addEventListener('scroll', () => {
  if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(onScroll); }
}, { passive: true });
window.addEventListener('resize', onScroll);
onScroll();

// ---------- phones: name above the video ----------
// order on phones: name, video, description, buttons — the name moves out of the text column to the
// top of its project (and back on wider screens)
{
  const phone = window.matchMedia('(max-width: 767px)');
  const place = () => document.querySelectorAll('.pj-project').forEach(pr => {
    const client = pr.querySelector('.pj-client'), info = pr.querySelector('.pj-info');
    if (!client || !info) return;
    if (phone.matches) pr.prepend(client); else info.prepend(client);
  });
  place();
  phone.addEventListener('change', place);
}

// ---------- descriptions ----------
// every letter is wrapped once (for the hover colour); when a project comes into view its
// paragraphs fade up softly, one after another
document.querySelectorAll('.pj-type').forEach(p => {
  const text = p.textContent;
  p.setAttribute('aria-label', text);
  p.innerHTML = [...text].map(ch => `<span class="tc done" aria-hidden="true">${ch === ' ' ? ' ' : ch.replace('<', '&lt;')}</span>`).join('');
});
const typeIO = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    typeIO.unobserve(e.target);
    e.target.querySelectorAll('.pj-type').forEach((p, i) => {
      p.style.transitionDelay = `${0.15 + i * 0.18}s`;
      p.classList.add('is-shown');
    });
  }
}, { threshold: 0.3 });
document.querySelectorAll('.pj-info').forEach(info => { if (info.querySelector('.pj-type')) typeIO.observe(info); });

// hover over a description: letters under the cursor light up in the project colour and fade back
document.querySelectorAll('.pj-type').forEach(p => p.addEventListener('pointerover', e => {
  const l = e.target;
  if (!l.classList || !l.classList.contains('tc') || !l.classList.contains('done')) return;
  l.classList.add('lit');
  requestAnimationFrame(() => requestAnimationFrame(() => l.classList.remove('lit')));
}));

// links that aren't live yet (e.g. Maverick on X): the black pill says so instead of opening anything
MESSAGES.soon = { title: 'Not posted yet', sub: 'Dropping it on X soon.' };
document.querySelectorAll('[data-soon]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  if (isl.mode === 'open') closeIsland();
  setTimeout(() => openIsland(0.6, 'soon'), isl.mode === 'open' ? 350 : 0);
}));

// arriving from a logo on the home page (/projects/?go=maverick …): the page opens at the top and
// then glides all the way down to that project's video. A query (not a #hash) is used so the browser
// doesn't jump there on its own first.
const go = new URLSearchParams(location.search).get('go');
const goTarget = go && document.getElementById(go);
if (goTarget && goTarget.classList.contains('pj-project')) {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  history.replaceState(null, '', location.pathname);       // a refresh later just opens the page
  startScrolled();                                         // the glide counts as scrolling
  window.scrollTo(0, 0);
  setTimeout(() => {
    const r = goTarget.getBoundingClientRect();             // the article itself isn't tilted, so it measures true
    const to = Math.min(document.documentElement.scrollHeight - window.innerHeight,
      window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
    if (still) { window.scrollTo(0, to); return; }
    const from = window.scrollY, dist = to - from;
    const dur = Math.min(1300, 600 + dist * 0.35);           // further projects take a little longer
    const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    let start = null, cancelled = false;
    const stop = () => { cancelled = true; };
    window.addEventListener('wheel', stop, { once: true, passive: true });      // the visitor takes over
    window.addEventListener('touchstart', stop, { once: true, passive: true });
    const step = t => {
      if (cancelled) return;
      if (start === null) start = t;
      const k = Math.min(1, (t - start) / dur);
      window.scrollTo(0, from + dist * easeInOut(k));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, 500);
}

// ---------- a lot more projects ----------
// An endless row that drifts by on its own across the whole width; hovering slows it right down.
// Near both screen edges the cards stretch, turn away a little and blur (like the home page logos).
{
  const more = document.getElementById('more');
  const row = more?.querySelector('.pj-more-row');
  if (row) {
    // the title: hovering its letters turns them into random project logos; leaving it brings the letters back
    {
      const title = more.querySelector('.pj-more-title');
      const LOGOS = ['logo-whop.svg', 'logo-editucation.svg', 'logo-apple.svg', 'logo-voiceos.svg']
        .map(f => `/assets/more/${f}`)
        .concat(['/assets/clientsicons/maverick.png', '/assets/clientsicons/shotabase.svg', '/assets/clientsicons/clyro.svg']);
      LOGOS.forEach(src => { const i = new Image(); i.src = src; });   // warm the cache so they pop in instantly
      let lastLogo = -1;
      const swap = ch => {
        if (ch.classList.contains('is-logo')) return;
        let n;
        do { n = Math.floor(Math.random() * LOGOS.length); } while (n === lastLogo);
        lastLogo = n;
        const img = document.createElement('img');
        img.className = 'pj-more-logo'; img.src = LOGOS[n]; img.alt = ''; img.draggable = false;
        img.style.left = `${ch.offsetLeft + ch.offsetWidth / 2}px`;
        img.style.top = `${ch.offsetTop + ch.offsetHeight * 0.56}px`;
        ch.classList.add('is-logo');
        ch.logo = img;
        title.appendChild(img);
      };
      title.style.position = 'relative';
      title.querySelectorAll('.ch').forEach(ch => ch.addEventListener('pointerenter', () => swap(ch)));
      title.addEventListener('pointerleave', () => {
        title.querySelectorAll('.ch.is-logo').forEach((ch, i) => setTimeout(() => {
          ch.classList.remove('is-logo');
          const img = ch.logo; ch.logo = null;
          if (img) { img.classList.add('out'); img.addEventListener('animationend', () => img.remove(), { once: true }); }
        }, i * 30));
      });
    }
    const originals = [...row.querySelectorAll('.pj-more-card')];
    const PHONE = window.innerWidth < 768;                    // phones: swipe with a finger, the middle card plays, no hover
    const CARD = PHONE ? 0.55 : 0.9;        // cards a little smaller than in Figma (on phones: one big card in the middle, the next ones peeking)
    const CW = 545 * CARD;                                    // card width on screen
    const STEP = CW + 24.5 * CARD;                            // card + gap
    const SPEED = 82;                                         // px per second
    const SLOW = 0.18;                                        // share of the speed while hovered
    let items = [];
    const build = () => {
      // enough copies to cover the widest artboard plus one card on each side
      const need = Math.ceil((stage.offsetWidth + STEP * 2) / (originals.length * STEP));
      row.querySelectorAll('.pj-more-card.is-clone').forEach(c => c.remove());
      for (let c = 1; c < need; c++) originals.forEach(o => {
        const k = o.cloneNode(true);
        k.classList.add('is-clone'); k.setAttribute('aria-hidden', 'true'); k.tabIndex = -1;
        row.appendChild(k);
      });
      items = [...row.querySelectorAll('.pj-more-card')].map(el => {
        el.item = { el, blur: -1, g: 0, h: false, grows: !!el.querySelector('video[data-src]') };
        return el.item;
      });
    };
    build();
    let stageW = stage.offsetWidth;
    window.addEventListener('resize', () => { stageW = stage.offsetWidth; });
    // card art + names as real vector (sharp in Safari), copies included
    row.querySelectorAll('img.pj-more-svg, img.pj-more-label').forEach(img => window.inlineSvg?.(img));
    let offset = 0, k = 1, hover = false, last = null, on = false, raf = null;
    row.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
    row.addEventListener('pointerleave', () => { hover = false; });
    // hovering a card with a video: it keeps its height and widens to 16:9 (545 → 1179 × 663), so the whole
    // video shows at full size, lined up with the other cards; the cards next to it move aside to make room
    const GROW = 663.19 * 16 / 9 / 545 - 1;
    const lay = () => {
      const W = stageW, total = items.length * STEP;           // (cached: no layout read inside the frame)
      // 1) where each card would be
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        let x = (i * STEP - offset) % total;
        if (x < -STEP) x += total;
        it.bx = x; it.x = x;
        it.w = CW * (1 + GROW * it.g);
      }
      // 2) room for a widened card: it grows from its middle, everything else steps aside
      for (const h of items) {
        if (h.g <= 0.001) continue;
        const ex = CW * GROW * h.g;
        for (const it of items) it.x += it === h || it.bx < h.bx ? -ex / 2 : ex / 2;
      }
      // 3) how much each card stretches near the edges
      for (const it of items) {
        const cx = it.x + it.w / 2;
        const d = Math.min(1, Math.abs(cx - W / 2) / (W / 2));  // 0 middle → 1 at an edge
        const e = Math.max(0, (d - 0.55) / 0.45);               // only the outer part reacts
        it.e = e; it.side = cx < W / 2 ? -1 : 1;
        it.s = 1 + 0.32 * e * e;                                 // stretch (outwards, from its inner side)
      }
      // 4) a card that stretches pushes the ones further out along, so nothing overlaps and the gaps stay equal
      for (const side of [1, -1]) {
        const list = items.filter(it => it.side === side).sort((a, b) => side * (a.x - b.x));
        let push = 0;
        for (const it of list) { it.dx = push * side; push += it.w * (it.s - 1); }
      }
      // 5) draw
      for (const it of items) {
        const turn = 22 * it.e * it.e * it.side;
        const elW = 545 * (1 + GROW * it.g);                     // the card's own (unscaled) width
        const wTxt = `${elW.toFixed(1)}px`;
        if (wTxt !== it.wTxt) { it.wTxt = wTxt; it.el.style.width = wTxt; }   // (layout only when it really changes)
        // stretches outwards from its inner side (left cards keep their right edge, right cards their left)
        const left = it.side > 0 ? it.x + it.dx : it.x + it.w + it.dx - elW;
        if (it.side !== it.lastSide) { it.lastSide = it.side; it.el.style.transformOrigin = it.side > 0 ? '0 0' : '100% 0'; }
        it.el.style.transform = `translate3d(${left.toFixed(1)}px, 0, 0) perspective(1400px) rotateY(${turn.toFixed(2)}deg) scale(${(it.s * CARD).toFixed(4)}, ${CARD})`;
        const b = Math.round(it.e * it.e * 6 * 4) / 4;             // 0.25px steps: smooth enough, and a card only re-draws when its blur really changes
        if (b !== it.blur && !SAFARI) { it.blur = b; it.el.style.filter = b > 0.02 ? `blur(${b}px)` : ''; }   // (Safari: no moving blur)
      }
    };
    // which card is under the cursor — checked every frame (before anything is moved), because the cards
    // slide under a cursor that isn't moving and browsers (Safari) don't report that as hovering
    let pointer = null, hovered = null;
    row.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') pointer = { x: e.clientX, y: e.clientY }; });
    row.addEventListener('pointerleave', () => { pointer = null; });
    const setHovered = card => {
      if (card === hovered) return;
      if (hovered) {
        hovered.classList.remove('is-hover'); hovered.item.h = false;
        const v = hovered.querySelector('video'); v.pause(); hovered.classList.remove('is-playing');
      }
      hovered = card;
      row.classList.toggle('has-hover', !!card);
      if (!card) return;
      card.classList.add('is-hover'); card.item.h = true;
      const v = card.querySelector('video');
      if (v.dataset.src) {
        if (!v.src) { v.src = v.dataset.src; v.load(); }
        v.play().catch(() => {});
      }
    };
    // phones: drag the loop with a finger (it glides on a bit after letting go, then drifts on by itself)
    let drag = null, fling = 0, moved = false;
    if (PHONE) {
      row.style.touchAction = 'pan-y';                         // up/down still scrolls the page
      row.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse') return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, lt: e.timeStamp, v: 0, on: false };
        fling = 0; moved = false;
      });
      row.addEventListener('pointermove', e => {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.on) {
          if (Math.abs(e.clientY - drag.y) > Math.abs(e.clientX - drag.x) && Math.abs(e.clientY - drag.y) > 8) { drag = null; return; }   // it's a page scroll
          if (Math.abs(e.clientX - drag.x) < 8) return;
          drag.on = moved = true;
          try { row.setPointerCapture(e.pointerId); } catch {}
        }
        const dx = e.clientX - drag.lx, dt = Math.max(1, e.timeStamp - drag.lt);
        offset -= dx;
        drag.v = drag.v * 0.6 + (-dx / dt * 1000) * 0.4;       // px per second, smoothed
        drag.lx = e.clientX; drag.lt = e.timeStamp;
      });
      const up = e => {
        if (!drag || e.pointerId !== drag.id) return;
        if (drag.on) fling = drag.v;
        drag = null;
      };
      row.addEventListener('pointerup', up);
      row.addEventListener('pointercancel', up);
      // a swipe isn't a tap: don't open the card it ended on
      row.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    }
    // laptops: a sideways two-finger swipe on the trackpad (or shift + wheel) moves the cards too;
    // up/down scrolling still scrolls the page
    row.addEventListener('wheel', e => {
      const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
      if (!dx || Math.abs(dx) < Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault();
      offset += (e.deltaMode === 1 ? 32 : 1) * dx;
      fling = 0;
    }, { passive: false });
    // phones: the card in the middle plays its video (cut to the card's shape), the rest show their logo
    const setCentre = () => {
      const mid = stageW / 2;
      let best = null, bd = Infinity;
      for (const it of items) {
        const d = Math.abs(it.x + it.dx + it.w / 2 - mid);
        if (d < bd) { bd = d; best = it.el; }
      }
      if (best === hovered) return;
      if (hovered) {
        const v = hovered.querySelector('video'); v.pause(); hovered.classList.remove('is-hover', 'is-playing');
      }
      hovered = best;
      if (!best) return;
      best.classList.add('is-hover');
      const v = best.querySelector('video');
      if (v.dataset.src) {
        if (!v.src) { v.src = v.dataset.src; v.load(); }
        v.muted = true; v.playsInline = true;
        v.play().catch(() => {});
      }
    };
    const tick = t => {
      const dt = last === null ? 0 : Math.min((t - last) / 1000, 0.1);
      last = t;
      if (!PHONE) setHovered(pointer ? document.elementFromPoint(pointer.x, pointer.y)?.closest('.pj-more-card') || null : null);
      k += ((hover ? SLOW : 1) - k) * Math.min(1, dt * 3);   // eases down / back up
      for (const it of items) {                                 // the hovered card widens, softly
        const tg = it.h && it.grows ? 1 : 0;
        it.g += (tg - it.g) * Math.min(1, dt * 7);
        if (Math.abs(tg - it.g) < 0.002) it.g = tg;
      }
      if (drag) { /* the finger moves it */ }
      else if (Math.abs(fling) > 20) { offset += fling * dt; fling *= Math.pow(0.04, dt); }   // glide after a swipe
      else if (!still) { fling = 0; offset += SPEED * k * dt; }
      offset = ((offset % (items.length * STEP)) + items.length * STEP) % (items.length * STEP);   // swiping back past the start
      lay();
      if (PHONE) setCentre();
      raf = on ? requestAnimationFrame(tick) : null;
      if (!on) last = null;
    };
    // only runs while the section is on screen
    new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      if (!on && PHONE && hovered) {                           // off screen: the playing card stops
        hovered.querySelector('video').pause(); hovered.classList.remove('is-hover', 'is-playing'); hovered = null;
      }
      if (on && !raf) raf = requestAnimationFrame(tick);
    }).observe(more);
    window.addEventListener('resize', () => { build(); lay(); });
    lay();
    // entrance order follows what you see: left to right
    new MutationObserver(() => {
      if (!row.classList.contains('is-in')) return;
      lay();
      [...items].sort((a, b) => (a.x + a.dx) - (b.x + b.dx)).forEach((it, n) => it.el.style.setProperty('--i', n));
    }).observe(row, { attributes: true, attributeFilter: ['class'] });

    // the hovered card's video shows once it's actually playing; clicks
    row.querySelectorAll('.pj-more-card').forEach(card => {
      const video = card.querySelector('video');
      video.addEventListener('playing', () => { if (card.classList.contains('is-hover')) card.classList.add('is-playing'); });
      // its own page comes later — for now the black pill says so
      card.addEventListener('click', e => {
        if (card.getAttribute('href') !== '#') return;
        e.preventDefault();
        if (typeof openIsland !== 'function') return;
        MESSAGES.page = { title: 'Coming soon', sub: 'The full breakdown is on its way.' };
        if (isl.mode === 'open') closeIsland();
        setTimeout(() => openIsland(0.6, 'page'), isl.mode === 'open' ? 350 : 0);
      });
    });
  }
}

// the Editucation window doesn't open the quick view: a click goes straight to editucation.io
document.querySelector('#editucation .pj-window-video')?.addEventListener('click', e => {
  e.stopImmediatePropagation();
  window.open('https://www.editucation.io/', '_blank', 'noopener');
}, true);
