// The heat logo's blurred levels (lib/mark/heat-logo.ts): the wordmark mask blurred wider and wider.
// Pure array work, run in heat-blur.worker.ts so a mark being built never holds up the page (the
// footer mark takes about 400 ms), or here on the main thread where a worker can't start.

/**
 * Blur the red channel of an RGBA mask once per sigma (px), each level from the one before, and
 * return each level as one byte per pixel.
 */
export function blurLevels(rgba: Uint8ClampedArray, w: number, h: number, sigmas: number[]): Uint8Array[] {
  let cur: Float32Array = new Float32Array(w * h), prev = 0;
  for (let i = 0; i < w * h; i++) cur[i] = rgba[i * 4];
  return sigmas.map((sigma) => {
    // each level blurs the previous one by what it lacks
    cur = gauss(cur, w, h, Math.sqrt(sigma * sigma - prev * prev));
    prev = sigma;
    const b = new Uint8Array(cur.length);
    for (let i = 0; i < b.length; i++) b[i] = cur[i] + 0.5;
    return b;
  });
}

// Gaussian blur of a one-channel image (sigma in px) as three box passes each way. Edges clamp; the
// canvas margin keeps the glyphs well clear of them.
function gauss(src: Float32Array, w: number, h: number, sigma: number): Float32Array {
  if (sigma < 0.3) return src;
  const n = 3, wIdeal = Math.sqrt((12 * sigma * sigma) / n + 1);
  let wl = Math.floor(wIdeal); if (wl % 2 === 0) wl--;
  const m = Math.round((12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4));
  let a = src;
  const b = new Float32Array(w * h);
  for (let k = 0; k < n; k++) {
    const r = ((k < m ? wl : wl + 2) - 1) / 2;
    box(a, b, w, h, r, true);
    if (a === src) a = new Float32Array(w * h);
    box(b, a, w, h, r, false);
  }
  return a;
}

// one box pass of radius r along rows (horizontal) or columns, running sum, edges clamped
function box(src: Float32Array, dst: Float32Array, w: number, h: number, r: number, horizontal: boolean) {
  const len = horizontal ? w : h, lines = horizontal ? h : w, step = horizontal ? 1 : w, stride = horizontal ? w : 1;
  const inv = 1 / (2 * r + 1);
  for (let L = 0; L < lines; L++) {
    const base = L * stride, first = src[base], last = src[base + (len - 1) * step];
    let sum = (r + 1) * first;
    for (let i = 1; i <= r; i++) sum += src[base + Math.min(i, len - 1) * step];
    for (let i = 0; i < len; i++) {
      dst[base + i * step] = sum * inv;
      const add = i + r + 1, sub = i - r;
      sum += (add < len ? src[base + add * step] : last) - (sub >= 0 ? src[base + sub * step] : first);
    }
  }
}
