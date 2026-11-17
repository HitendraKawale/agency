// The BI app icon: the white BI glyph inside a value field, the field's value being the distance from
// the glyph outline, mapped through Rerun's cyclic spectrum. That mapping is what draws the concentric
// rings. Ported unchanged from .plannotator/brand-v1/mark/icon.html (approved 2026-11-10). Profile
// measured from Rerun's 05-Icon_Animation: a steep band right at the edge, slow ripples further out, a
// broad arc from the top, the whole phase drifting 0.2 cycles/s, value dither before the lookup.

/** The BI monogram, 304 x 240. */
export const BI = (() => {
  const H = 240, S = 62, T = 40, MID = 30, BW = 218, C = 40, GAP = 24, IW = 62, IC = 22;
  const ix = BW + GAP, W = ix + IW, wy = H / 2;
  const b = [`M0 0H${BW - C}L${BW} ${C}`, `V${wy - C * 0.6}L${BW - C * 0.9} ${wy}L${BW} ${wy + C * 0.6}`, `V${H - C}L${BW - C} ${H}H0Z`].join("");
  const ch = (H - 2 * T - MID) / 2;
  const disc = (y0: number, xr: number) => {
    const r = ch / 2;
    return `M${S} ${y0}H${xr - r}A${r} ${r} 0 0 1 ${xr - r} ${y0 + ch}H${S}Z`;
  };
  const xr = BW - S + 10;
  const slit = (cx: number, w: number, depth: number) => `M${cx - w / 2} 0V${depth - w / 2}A${w / 2} ${w / 2} 0 0 0 ${cx + w / 2} ${depth - w / 2}V0Z`;
  const i = `M${ix} 0H${W - IC}L${W} ${IC}V${H - IC}L${W - IC} ${H}H${ix}Z`;
  return { width: W, height: H, path: [b, disc(T, xr), disc(T + ch + MID, xr), slit(S + 12, 20, 19), i].join(" ") };
})();

const STOPS = ["#186ADD", "#9BBFD3", "#86D9A6", "#F6DA75", "#D72F21", "#186ADD"].map((h) =>
  [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16)),
);

/** Rerun's cyclic spectrum as a 1024-entry RGB table. */
export const LUT = (() => {
  const lut = new Uint8Array(1024 * 3);
  for (let i = 0; i < 1024; i++) {
    const u = (i / 1024) * 5, k = Math.floor(u), f = u - k;
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = STOPS[k][c] * (1 - f) + STOPS[k + 1][c] * f;
  }
  return lut;
})();

/** The spectrum colour at value `v` (only the fractional part counts) as an rgb() string. */
export function spectrum(v: number) {
  const c = Math.floor((v - Math.floor(v)) * 1024) * 3;
  return `rgb(${LUT[c]},${LUT[c + 1]},${LUT[c + 2]})`;
}

type Glyph = { x: number; y: number; s: number };

// distance (in frame-height units) from every pixel to the glyph: a two-pass 3x3 chamfer, then three
// separable box blurs (~2% of height) to round off the chamfer's octagonal steps
function distanceField(w: number, h: number, glyph: Glyph) {
  const m = document.createElement("canvas");
  m.width = w;
  m.height = h;
  const g = m.getContext("2d", { willReadFrequently: true })!;
  g.fillStyle = "#000";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#fff";
  g.save();
  g.translate(glyph.x, glyph.y);
  g.scale(glyph.s, glyph.s);
  g.fill(new Path2D(BI.path), "evenodd");
  g.restore();
  const px = g.getImageData(0, 0, w, h).data, D = new Float32Array(w * h), INF = 1e9;
  for (let i = 0; i < w * h; i++) D[i] = px[i * 4] > 127 ? 0 : INF;
  const a = 1, b = Math.SQRT2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    let v = D[i];
    if (x > 0) v = Math.min(v, D[i - 1] + a);
    if (y > 0) {
      v = Math.min(v, D[i - w] + a);
      if (x > 0) v = Math.min(v, D[i - w - 1] + b);
      if (x < w - 1) v = Math.min(v, D[i - w + 1] + b);
    }
    D[i] = v;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x;
    let v = D[i];
    if (x < w - 1) v = Math.min(v, D[i + 1] + a);
    if (y < h - 1) {
      v = Math.min(v, D[i + w] + a);
      if (x < w - 1) v = Math.min(v, D[i + w + 1] + b);
      if (x > 0) v = Math.min(v, D[i + w - 1] + b);
    }
    D[i] = v;
  }
  const rad = Math.max(1, Math.round(h * 0.02)), tmp = new Float32Array(w * h);
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      let acc = 0;
      for (let x = -rad; x <= rad; x++) acc += D[y * w + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        tmp[y * w + x] = acc / (2 * rad + 1);
        acc += D[y * w + Math.min(w - 1, x + rad + 1)] - D[y * w + Math.max(0, x - rad)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -rad; y <= rad; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        D[y * w + x] = acc / (2 * rad + 1);
        acc += tmp[Math.min(h - 1, y + rad + 1) * w + x] - tmp[Math.max(0, y - rad) * w + x];
      }
    }
  }
  for (let i = 0; i < w * h; i++) D[i] /= h;
  return D;
}

// cheap smooth value noise for the ripple wobble
const perm = (() => {
  const p = new Uint8Array(256).map((_, i) => i);
  let s = 11;
  for (let i = 255; i > 0; i--) {
    s = (s * 16807) % 2147483647;
    const j = s % (i + 1);
    [p[i], p[j]] = [p[j], p[i]];
  }
  return new Uint8Array(512).map((_, i) => p[i & 255]);
})();
function noise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), X = xi & 255, Y = yi & 255;
  const A = perm[perm[X] + Y] / 255, B = perm[perm[X + 1] + Y] / 255, C = perm[perm[X] + Y + 1] / 255, D = perm[perm[X + 1] + Y + 1] / 255;
  return (A + (B - A) * u + (C - A) * v + (A - B - C + D) * u * v) * 2 - 1;
}

/**
 * Size `canvas` to its box and return `draw(t)`, which paints the icon at `t` seconds. The field is
 * computed once here, so call again after a resize. `glyph` is the glyph's height as a fraction of
 * the canvas height.
 */
export function makeBiIcon(canvas: HTMLCanvasElement, glyph = 0.42) {
  const r = canvas.getBoundingClientRect(), dpr = 2;
  canvas.width = r.width * dpr;
  canvas.height = r.height * dpr;
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  const s = (h * glyph) / BI.height, place = { s, x: (w - BI.width * s) / 2, y: h / 2 - (BI.height * s) / 2 };
  const D = distanceField(w, h, place);
  const low = document.createElement("canvas");
  low.width = w;
  low.height = h;
  const lg = low.getContext("2d")!, img = lg.createImageData(w, h);
  const g = canvas.getContext("2d")!;
  g.imageSmoothingQuality = "high";
  const ink = new Path2D(BI.path), fs = canvas.width / w;

  return (t: number) => {
    const d = img.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = j * w + i, dist = D[k], x = i / h, y = j / h;
      const wob = noise(x * 3 + t * 0.15, y * 3 - t * 0.1);
      const edge = 0.55 * (1 - Math.exp(-dist / 0.035));
      const ripple = 0.022 * Math.sin((dist / 0.1) * 6.2832 + wob * 2.2 - t * 0.9);
      const arc = 0.45 * Math.max(0, Math.min(1, (Math.hypot(x - (w / h) * 0.5, y - 1.35) - 1.12) / 0.16));
      const v = 0.2 * t + 0.62 + edge + ripple + arc + 0.12 * dist + (Math.random() - 0.5) * 0.03;
      const ci = Math.floor((v - Math.floor(v)) * 1024) * 3, o = k * 4;
      const halo = 0.55 * Math.exp(-dist / 0.0045); // thin pale rim on the outline
      d[o] = LUT[ci] + (255 - LUT[ci]) * halo;
      d[o + 1] = LUT[ci + 1] + (255 - LUT[ci + 1]) * halo;
      d[o + 2] = LUT[ci + 2] + (255 - LUT[ci + 2]) * halo;
      d[o + 3] = 255;
    }
    lg.putImageData(img, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(low, 0, 0, canvas.width, canvas.height);
    g.setTransform(fs * s, 0, 0, fs * s, fs * place.x, fs * place.y);
    g.fillStyle = "#fff";
    g.fill(ink, "evenodd");
  };
}
