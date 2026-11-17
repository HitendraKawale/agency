// The BI monogram from the approved app icon (.plannotator/brand-v1/mark/icon.html, 2026-11-10).
// The icon's heat-field renderer was ported here in 74c5803 and removed when nothing used it.

const H = 240, S = 62, T = 40, MID = 30, BW = 218, C = 40, GAP = 24, IW = 62, IC = 22;
const ix = BW + GAP, W = ix + IW, wy = H / 2;
const ch = (H - 2 * T - MID) / 2; // a counter's height
const xr = BW - S + 10; // a counter's right end
const SLIT = { cx: S + 12, w: 20, depth: 19 }; // the notch in the B's top edge

/** The BI monogram, 304 x 240, as one SVG path (fill-rule evenodd). */
export const BI = (() => {
  const b = [`M0 0H${BW - C}L${BW} ${C}`, `V${wy - C * 0.6}L${BW - C * 0.9} ${wy}L${BW} ${wy + C * 0.6}`, `V${H - C}L${BW - C} ${H}H0Z`].join("");
  const disc = (y0: number) => {
    const r = ch / 2;
    return `M${S} ${y0}H${xr - r}A${r} ${r} 0 0 1 ${xr - r} ${y0 + ch}H${S}Z`;
  };
  const { cx, w, depth } = SLIT;
  const slit = `M${cx - w / 2} 0V${depth - w / 2}A${w / 2} ${w / 2} 0 0 0 ${cx + w / 2} ${depth - w / 2}V0Z`;
  const i = `M${ix} 0H${W - IC}L${W} ${IC}V${H - IC}L${W - IC} ${H}H${ix}Z`;
  return { width: W, height: H, path: [b, disc(T), disc(T + ch + MID), slit, i].join(" ") };
})();

type Pt = [number, number];
const arc = (cx: number, cy: number, r: number, from: number, to: number, n = 12): Pt[] =>
  Array.from({ length: n + 1 }, (_, k) => {
    const a = from + ((to - from) * k) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });

/** The same monogram as polygons in its 304 x 240 SVG space (y down), for geometry: each letter's
 *  outline with the slit folded into the B's top edge, and the B's two counters, which are holes in
 *  the letter. */
export const BI_CONTOURS = (() => {
  const { cx, w, depth } = SLIT;
  const b: Pt[] = [
    [0, 0], [cx - w / 2, 0],
    ...arc(cx, depth - w / 2, w / 2, Math.PI, 0), // down the slit, round its bottom, back up
    [cx + w / 2, 0], [BW - C, 0], [BW, C], [BW, wy - C * 0.6], [BW - C * 0.9, wy], [BW, wy + C * 0.6],
    [BW, H - C], [BW - C, H], [0, H],
  ];
  const r = ch / 2;
  const counter = (y0: number): Pt[] => [[S, y0], ...arc(xr - r, y0 + r, r, -Math.PI / 2, Math.PI / 2), [S, y0 + ch]];
  const i: Pt[] = [[ix, 0], [W - IC, 0], [W, IC], [W, H - IC], [W - IC, H], [ix, H]];
  return { width: W, height: H, letters: [b, i], counters: [counter(T), counter(T + ch + MID)] };
})();
