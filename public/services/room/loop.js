// The /services hero's screen content (index.html beside it): a 1920x1080 canvas that loops a title
// card and one card per service, each over our own stills and films. Cuts between cards are where
// the glitch fires; update(t) draws the frame for time t and returns how hard to glitch it.
//
//   const loop = await createLoop();
//   const { glitch } = loop.update(t);   // then upload loop.canvas as a texture
//
// update(t, true) shows the idle card instead: red arrows pouring down behind "Scroll down".
// Card media cycle inside a card with a slow push-in, so stills read as footage. Videos play muted
// and are drawn from their current frame. Built in .plannotator/brand-v1/screen/loop.js.

const W = 1920, H = 1080;
export const CARD = 2.8;     // seconds per card
const CUT = 0.32;            // glitch half-width around each cut, seconds

// Titles and scope lines come from content/services.ts. Paths are from the site root.
const CARDS = [
  { title: "Services", line: ["Websites, brands, 3D,", "campaigns and research"], media: ["/services/room/heat-adam.webp"], intro: true },
  { title: "Websites", line: ["Design and Next.js build", "Pages agents can read"],
    media: ["/services/web-house-of-epochs.webp", "/services/web-pixelgrid.webp", "/services/web-settlement-layer.webp"] },
  { title: "Brand", line: ["Logo and wordmark", "Type, colour and motion"],
    media: ["/reel/wall-posters.webp", "/reel/label-heat.webp", "/reel/tote.webp"] },
  { title: "3D", line: ["Shaders and WebGL", "Real-time scenes in the browser"],
    media: ["/services/3d-bunker.webp", "/services/3d-neon-sign.webp", "/services/3d-david-heat.webp"] },
  { title: "Campaigns", line: ["Launches and out-of-home", "Motion and video"],
    media: ["/reel/ooh-metro.mp4", "/services/campaign-falcon.webp"] },
  { title: "Research", line: ["Market and competitors", "What every page must prove"],
    media: ["/reel/spreads.webp", "/reel/frames-three.webp"] },
];
export const LOOP = CARDS.length * CARD;

const hash = (n) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };

function load(src) {
  if (src.endsWith(".mp4")) {
    const v = document.createElement("video");
    Object.assign(v, { src, muted: true, loop: true, playsInline: true, crossOrigin: "anonymous", preload: "auto" });
    return new Promise((res) => { v.addEventListener("loadeddata", () => res(v), { once: true }); v.load(); });
  }
  const i = new Image(); i.crossOrigin = "anonymous"; i.src = src;
  return i.decode().then(() => i);
}

/** draw `img` to cover the canvas, scaled by `zoom` around the centre */
function cover(ctx, img, zoom) {
  const iw = img.videoWidth || img.naturalWidth, ih = img.videoHeight || img.naturalHeight;
  const s = Math.max(W / iw, H / ih) * zoom;
  ctx.drawImage(img, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
}

export async function createLoop({ mark = "/services/room/rand.js" } = {}) {
  const RAND = new Function(`${await (await fetch(mark)).text()}; return RAND;`)();
  const word = new Path2D(RAND.B.path), wordW = RAND.B.width;
  await document.fonts.load('500 160px "Geist"');
  const cards = await Promise.all(CARDS.map(async (c) => ({
    ...c, img: await Promise.all(c.media.map(load)),
  })));

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  let playing = null;

  // The idle card: when the visitor hasn't scrolled for a while, the screen cuts to rows of big red
  // arrows marching down behind "Scroll down". One glowing arrow is drawn once and stamped.
  const RED = "#d72f21", AW = 150, AH = 210, PAD = 60;
  const arrow = document.createElement("canvas");
  arrow.width = AW + PAD * 2; arrow.height = AH + PAD * 2;
  {
    const a = arrow.getContext("2d");
    a.translate(PAD, PAD);
    a.strokeStyle = RED; a.lineWidth = 24; a.lineCap = "round"; a.lineJoin = "round";
    a.shadowColor = RED; a.shadowBlur = 44;
    a.beginPath(); a.moveTo(AW / 2, 14); a.lineTo(AW / 2, AH - 14);
    a.moveTo(14, AH - 80); a.lineTo(AW / 2, AH - 14); a.lineTo(AW - 14, AH - 80);
    for (let k = 0; k < 2; k++) a.stroke(); // twice for a stronger glow
  }
  function drawIdle(t) {
    ctx.fillStyle = "#070505"; ctx.fillRect(0, 0, W, H);
    const colW = 250, rowH = 300, speed = 240;
    for (let c = 0, n = Math.ceil(W / colW) + 1; c < n; c++) {
      const x = c * colW + (W - (n - 1) * colW) / 2 - arrow.width / 2;
      const off = (t * speed + (c % 2) * rowH * 0.5) % rowH;
      for (let y = -rowH * 2 + off; y < H + rowH; y += rowH) {
        // fade in at the top, out at the bottom, so they seem to pour down the screen
        const v = (y + arrow.height / 2) / H;
        ctx.globalAlpha = Math.max(0, Math.min(1, v * 3, (1.05 - v) * 3));
        ctx.drawImage(arrow, x, y);
      }
    }
    ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(0, H * 0.55, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.75)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  let idleOn = false, switchedAt = -1e9;

  /** draw time `t`; `idle` swaps the services for the scroll-down card, with a glitch either way */
  function update(t, idle = false) {
    if (idle !== idleOn) { idleOn = idle; switchedAt = t; }
    const swap = Math.max(0, 1 - (t - switchedAt) / 0.45);
    if (idleOn) {
      if (playing) pause();
      drawIdle(t);
      const s = 300 / wordW;
      ctx.save(); ctx.translate(56, 52); ctx.scale(s, s); ctx.fillStyle = "#fff"; ctx.fill(word, "evenodd"); ctx.restore();
      ctx.fillStyle = "#fff"; ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
      ctx.font = '500 168px "Geist"'; ctx.letterSpacing = "-7px";
      ctx.fillText("Scroll down", 50, H - 58);
      return { glitch: swap * swap, card: -1 };
    }
    const lt = ((t % LOOP) + LOOP) % LOOP;
    const i = Math.floor(lt / CARD), c = cards[i], ct = lt - i * CARD;
    const k = Math.min(c.img.length - 1, Math.floor((ct / CARD) * c.img.length));
    const img = c.img[k];

    // only the visible film plays
    if (playing !== img) { playing?.pause?.(); if (img.play) { img.currentTime = 0; img.play().catch(() => {}); } playing = img; }

    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    cover(ctx, img, 1.04 + 0.06 * (ct / CARD));
    if (!c.intro) { // keep the type readable over busy media
      const g = ctx.createLinearGradient(0, H * 0.45, 0, H);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.62)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }

    // wordmark, top left
    const mw = c.intro ? 680 : 300, s = mw / wordW;
    ctx.save(); ctx.translate(56, 52); ctx.scale(s, s); ctx.fillStyle = "#fff"; ctx.fill(word, "evenodd"); ctx.restore();

    // title bottom left, lines bottom right
    ctx.fillStyle = "#fff"; ctx.textBaseline = "alphabetic";
    ctx.font = '500 168px "Geist"'; ctx.letterSpacing = "-7px"; ctx.textAlign = "left";
    ctx.fillText(c.title, 50, H - 58);
    ctx.font = '400 40px "Geist"'; ctx.letterSpacing = "-1px"; ctx.textAlign = "right";
    c.line.forEach((l, j) => ctx.fillText(l, W - 56, H - 64 - (c.line.length - 1 - j) * 46));

    // glitch: strong around each cut, plus a short twitch now and then mid-card
    const toCut = Math.min(ct, CARD - ct);
    const cut = Math.max(0, 1 - toCut / CUT);
    const slot = Math.floor(t * 4);
    const twitch = hash(slot) > 0.86 && (t * 4 - slot) < 0.35 ? 0.45 : 0;
    return { glitch: Math.max(cut * cut, twitch, swap * swap), card: i };
  }

  /** stop the playing film while the scene is covered; the next update starts it again */
  function pause() { playing?.pause?.(); playing = null; }

  return { canvas, update, pause, size: [W, H] };
}
