// BLANK wordmark in the same construction as the BI monogram (bi.js): cap height 240,
// heavy stems 62, thin horizontals 40, mid bars 30, square left side, 45 degree chamfers on
// the right side, round counters, U-slits nicked into the top edge where a stroke meets a stem.
// The B is the BI B unchanged. Each letter is one evenodd path in its own 0..width box.
const BLANK = (() => {
  const H = 240, S = 62, T = 40, MID = 30, C = 40, IC = 22, GAP = 24, wy = H / 2;
  const slit = (cx, w = 20, depth = 19) => `M${cx - w / 2} 0V${depth - w / 2}A${w / 2} ${w / 2} 0 0 0 ${cx + w / 2} ${depth - w / 2}V0Z`;
  const slitUp = (cx, w = 20, depth = 19) => `M${cx - w / 2} ${H}V${H - depth + w / 2}A${w / 2} ${w / 2} 0 0 1 ${cx + w / 2} ${H - depth + w / 2}V${H}Z`;
  const ch = (H - 2 * T - MID) / 2; // counter height shared by B and A (65)

  const B = (() => {
    const BW = 218, xr = BW - S + 10;
    const disc = (y0) => { const r = ch / 2; return `M${S} ${y0}H${xr - r}A${r} ${r} 0 0 1 ${xr - r} ${y0 + ch}H${S}Z`; };
    return { w: BW, d: [`M0 0H${BW - C}L${BW} ${C}V${wy - C * 0.6}L${BW - C * 0.9} ${wy}L${BW} ${wy + C * 0.6}V${H - C}L${BW - C} ${H}H0Z`,
      disc(T), disc(T + ch + MID), slit(S + 12)].join(" ") };
  })();

  // L: stem with the I's top chamfer, a foot as heavy as B's bowls are wide, round inner corner
  const L = (() => {
    const LW = 176, F = 52, r = 26;
    return { w: LW, d: `M0 0H${S - IC}L${S} ${IC}V${H - F - r}A${r} ${r} 0 0 0 ${S + r} ${H - F}H${LW}V${H - C}L${LW - C} ${H}H0Z` };
  })();

  // A: B's frame turned upright. Flat top with the big chamfer on the right, round-topped counter
  // sitting on B's mid bar, open legs below. Slit at the same place as on the B.
  const A = (() => {
    const AW = 218, r = (AW - 2 * S) / 2, ya = T + ch, yb = ya + MID;
    return { w: AW, d: [`M0 0H${AW - C}L${AW} ${C}V${H}H${AW - S}V${yb}H${S}V${H}H0Z`,
      `M${S} ${ya}V${T + r}A${r} ${r} 0 0 1 ${AW - S} ${T + r}V${ya}Z`, slit(S + 12)].join(" ") };
  })();

  // N: two stems and a diagonal of stem weight. Its counters are cut off short of the acute tip
  // and finished with the round end of a slit, the way Rerun's r and n meet their shoulders.
  const N = (() => {
    const NW = 234, dw = 42, yR = 176, sw = 20;
    const k = (NW - 2 * S - dw) / yR; // dx per dy of the diagonal edges
    const yt = (NW - 2 * S - dw - sw) / k, xt = S + dw + k * yt; // counter narrows to slit width sw
    const end = (x0, y0, dir) => `A${sw / 2} ${sw / 2} 0 0 ${dir} ${x0} ${y0}`;
    return { w: NW, d: [
      `M0 0H${NW - IC}L${NW} ${IC}V${H - C}L${NW - C} ${H}H0Z`,
      // upper counter: open at the top, between diagonal and right stem, ending in a round slit
      `M${S + dw} 0H${NW - S}V${yt}${end(xt, yt, 1)}Z`,
      // lower counter: the same turned 180 degrees
      `M${NW - S - dw} ${H}H${S}V${H - yt}${end(NW - xt, H - yt, 1)}Z`,
    ].join(" ") };
  })();

  // K: stem plus two 45 degree arms that meet it at the waist, like the B's waist notch turned out.
  const K = (() => {
    const KW = 206, v = KW - S - wy, u = 84 - v; // arm horizontal width 84 (stem weight across 45)
    return { w: KW, d: [
      `M0 0H${S}V${wy - u}L${S + wy - u} 0H${KW}L${S + v} ${wy}L${KW} ${H}H${S + wy - u}L${S} ${H - wy + u}V${H}H0Z`,
    ].join(" ") };
  })();

  // optical spacing: the L's open top-right reads as extra space before the A
  const letters = [B, L, A, N, K], kern = [0, -14, 0, 0];
  let x = 0; const parts = [];
  letters.forEach((g, i) => { parts.push({ x, ...g }); x += g.w + GAP + (kern[i] ?? 0); });
  const width = x - GAP;
  const path = parts.map((p) => `<path transform="translate(${p.x} 0)" d="${p.d}"/>`).join("");
  // single path for canvas/WebGL use (Path2D), letters offset into one coordinate space
  const path2d = () => { const p = new Path2D(); for (const l of parts) p.addPath(new Path2D(l.d), new DOMMatrix().translate(l.x, 0)); return p; };
  return { width, height: H, letters: parts, svg: path, path2d };
})();
