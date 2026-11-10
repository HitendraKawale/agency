// blank field: the model's view of a blank page. Domain-warped value-noise fbm,
// mapped through a colour ramp, animated slowly. Rendered at low resolution and
// scaled up, so it stays soft. Used inline in the Doop proof frames.
//
//   const f = new BlankField(220, 140, BLANK_RAMPS.pyre);
//   f.render(seconds);  // f.canvas is the field, draw it scaled
const BLANK_RAMPS = {
  pyre: ["#0F0E12", "#2E1263", "#8E2475", "#E0532F", "#F7B53C"],
  viridis: ["#440154", "#3B528B", "#21918C", "#5EC962", "#FDE725"],
};

const BLANK_MARK = {
  // units: ascender 0, x-height 40, baseline 140. stroke 34. bowl radius 40, screen radius 8.
  width: 574,
  height: 140,
  letters: [
    { x: 0, ink: "M0 0H34V40H78A40 40 0 0 1 118 80V100A40 40 0 0 1 78 140H0Z", counter: "M42 74H76A8 8 0 0 1 84 82V98A8 8 0 0 1 76 106H42A8 8 0 0 1 34 98V82A8 8 0 0 1 42 74Z" },
    { x: 132, ink: "M0 0H34V140H0Z" },
    { x: 180, ink: "M40 40H118V140H40A40 40 0 0 1 0 100V80A40 40 0 0 1 40 40Z", counter: "M42 74H76A8 8 0 0 1 84 82V98A8 8 0 0 1 76 106H42A8 8 0 0 1 34 98V82A8 8 0 0 1 42 74Z" },
    { x: 312, ink: "M0 40H78A40 40 0 0 1 118 80V140H84V82A8 8 0 0 0 76 74H34V140H0Z" },
    { x: 444, ink: "M0 0H34V140H0Z M34 74L68 40H116L34 122Z M73 83L130 140H82L49 107Z" },
  ],
};

class BlankField {
  constructor(w, h, stops, seed = 7) {
    this.w = w;
    this.h = h;
    this.canvas = document.createElement("canvas");
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx = this.canvas.getContext("2d");
    this.img = this.ctx.createImageData(w, h);
    this.setStops(stops);
    const p = new Uint8Array(256).map((_, i) => i);
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = s % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = new Uint8Array(512).map((_, i) => p[i & 255]);
  }

  setStops(stops) {
    const rgb = stops.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
    this.lut = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const u = (i / 255) * (rgb.length - 1);
      const k = Math.min(rgb.length - 2, Math.floor(u));
      const f = u - k;
      for (let c = 0; c < 3; c++) this.lut[i * 3 + c] = rgb[k][c] * (1 - f) + rgb[k + 1][c] * f;
    }
  }

  noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const P = this.perm, X = xi & 255, Y = yi & 255;
    const a = P[P[X] + Y] / 255, b = P[P[X + 1] + Y] / 255;
    const c = P[P[X] + Y + 1] / 255, d = P[P[X + 1] + Y + 1] / 255;
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
  }

  fbm(x, y) {
    let s = 0, a = 0.5;
    for (let o = 0; o < 4; o++) {
      s += a * this.noise(x, y);
      x = x * 2.03 + 17.1;
      y = y * 2.03 + 9.2;
      a *= 0.5;
    }
    return s;
  }

  render(t, scale = 2.4) {
    const { w, h, lut } = this;
    const d = this.img.data;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const x = (i / w) * scale * (w / h), y = (j / h) * scale;
        const qx = this.fbm(x + t * 0.05, y);
        const qy = this.fbm(x + 5.2, y + 1.3 - t * 0.04);
        const v = this.fbm(x + 1.8 * qx + t * 0.03, y + 1.8 * qy);
        const k = Math.max(0, Math.min(255, Math.round((1 / (1 + Math.exp(-4.2 * v))) * 255)));
        const o = (j * w + i) * 4;
        d[o] = lut[k * 3];
        d[o + 1] = lut[k * 3 + 1];
        d[o + 2] = lut[k * 3 + 2];
        d[o + 3] = 255;
      }
    }
    this.ctx.putImageData(this.img, 0, 0);
  }
}
