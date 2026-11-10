// The infinite software machine. One low-res pass gives two layers:
//   field  the undecided noise, coloured, with a hot front where pages are being decided
//   mask   alpha of what is already decided (the page shows through here, in ink and paper)
// p is decided progress 0..1 for the current page; cycle shifts the threshold field so each
// page resolves in a different order.
class BlankMachine extends BlankField {
  constructor(w, h, stops, seed) {
    super(w, h, stops, seed);
    this.mask = document.createElement("canvas");
    this.mask.width = w; this.mask.height = h;
    this.mctx = this.mask.getContext("2d");
    this.mimg = this.mctx.createImageData(w, h);
  }
  renderMachine(t, p, cycle, scale = 2.4, edge = 0.05) {
    const { w, h, lut } = this, d = this.img.data, m = this.mimg.data;
    const cx = cycle * 3.7, cy = cycle * 1.9;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = (i / w) * scale * (w / h), y = (j / h) * scale;
      const qx = this.fbm(x + t * 0.05, y), qy = this.fbm(x + 5.2, y + 1.3 - t * 0.04);
      let v = this.fbm(x + 1.8 * qx + t * 0.03, y + 1.8 * qy);
      let thr = 0.5 + 0.9 * this.fbm(x * 0.7 + cx + 0.6 * qx, y * 0.7 + cy + 0.6 * qy);
      thr = Math.max(0, Math.min(1, thr));
      const dec = Math.max(0, Math.min(1, (p * 1.1 - 0.05 - thr) / edge + 0.5));
      const fr = p > 0 && p < 1 ? Math.exp(-(((thr - (p * 1.1 - 0.05)) / (edge * 1.8)) ** 2)) : 0;
      let k = 1 / (1 + Math.exp(-4.2 * v)) + 0.6 * fr;
      k = Math.max(0, Math.min(255, Math.round(Math.min(1, k) * 255)));
      const o = (j * w + i) * 4;
      d[o] = lut[k * 3]; d[o + 1] = lut[k * 3 + 1]; d[o + 2] = lut[k * 3 + 2]; d[o + 3] = 255;
      m[o] = m[o + 1] = m[o + 2] = 0; m[o + 3] = Math.round(dec * 255);
    }
    this.ctx.putImageData(this.img, 0, 0);
    this.mctx.putImageData(this.mimg, 0, 0);
  }
}
