// "Blank" proportion study. B and l are BI's B and I, unchanged. The lowercase is
// parameterised by x-height so it can be compared:
//   X = 105  x-height at the top of B's mid bar, letters condensed
//   X = 40   x-height at the top of B's upper counter: tall lowercase, two-story a whose lower
//            bowl is B's lower bowl mirrored
// Units: cap height 240, stem 62, chamfer 40 bowl side, 22 free stem corners, slit 20 x 19.
const WORD = (() => {
  const H = 240, S = 62, T = 40, MID = 30, C = 40, IC = 22, GAP = 24, wy = H / 2;
  const ch = (H - 2 * T - MID) / 2, r0 = ch / 2; // B's counter: 65 tall, round end r 32.5
  const slit = (cx, y0 = 0, w = 20, depth = 19) =>
    `M${cx - w / 2} ${y0}V${y0 + depth - w / 2}A${w / 2} ${w / 2} 0 0 0 ${cx + w / 2} ${y0 + depth - w / 2}V${y0}Z`;

  const B = (() => {
    const BW = 218, xr = BW - S + 10;
    const disc = (y0) => `M${S} ${y0}H${xr - r0}A${r0} ${r0} 0 0 1 ${xr - r0} ${y0 + ch}H${S}Z`;
    return { w: BW, d: [`M0 0H${BW - C}L${BW} ${C}V${wy - C * 0.6}L${BW - C * 0.9} ${wy}L${BW} ${wy + C * 0.6}V${H - C}L${BW - C} ${H}H0Z`,
      disc(T), disc(T + ch + MID), slit(S + 12)].join(" ") };
  })();
  const l = { w: S, d: `M0 0H${S - IC}L${S} ${IC}V${H - IC}L${S - IC} ${H}H0Z` };

  // a, single-story: bowl wall `wall`, counter `cw` wide with a round left end, V notches where
  // the bowl's right chamfers meet the stem.
  const aSingle = (X, tb, cw, wall, nn = 22) => {
    const AW = wall + cw + S, xs = wall + cw, y0 = X + tb, cH = H - T - y0, r = Math.min(cH, cw) / 2;
    return { w: AW, d: [`M0 ${X + C}L${C} ${X}H${xs - nn}L${xs} ${X + nn}V${X}H${AW - IC}L${AW} ${X + IC}V${H - IC}L${AW - IC} ${H}H${xs}V${H - nn}L${xs - nn} ${H}H${C}L0 ${H - C}Z`,
      `M${xs} ${y0}H${wall + r}A${r} ${cH / 2} 0 0 0 ${wall + r} ${y0 + cH}H${xs}Z`].join(" ") };
  };
  // a, two-story (X = 40): lower bowl is B's lower bowl mirrored; above it the top bar hooks
  // over an aperture that opens to the left.
  const aTwo = (X, cw = 104, wall = 52) => {
    const AW = wall + cw + S, xs = wall + cw, yb = T + ch; // bowl top = B's mid bar top (105)
    const y0 = yb + MID, tb = T; // hook bar as heavy as B's top bar
    return { w: AW, d: [
      `M0 ${X + IC}L${IC} ${X}H${AW - IC}L${AW} ${X + IC}V${H - IC}L${AW - IC} ${H}H${C}L0 ${H - C}V${yb + C}L${C} ${yb}H${xs}V${X + tb}H0Z`,
      `M${xs} ${y0}H${wall + r0}A${r0} ${r0} 0 0 0 ${wall + r0} ${y0 + ch}H${xs}Z`, slit(xs - 12, yb)].join(" ") };
  };
  // n: arch counter `cw` wide, round top, open at the baseline
  const n = (X, tb, cw) => {
    const NW = 2 * S + cw, r = cw / 2;
    return { w: NW, d: [`M0 ${X}H${NW - C}L${NW} ${X + C}V${H - IC}L${NW - IC} ${H}H${NW - S}V${X + tb + r}A${r} ${r} 0 0 0 ${S} ${X + tb + r}V${H}H0Z`,
      slit(S + 12, X)].join(" ") };
  };
  // k: ascender stem, 45 degree arms meeting it halfway down the x-height
  const k = (X, aw) => {
    const ym = (X + H) / 2, h2 = (H - X) / 2, u = aw * 0.55, v = aw - u, KW = S + h2 + v;
    return { w: KW, d: `M0 0H${S - IC}L${S} ${IC}V${ym - u}L${S + h2 - u} ${X}H${KW}L${S + v} ${ym}L${KW} ${H}H${S + h2 - u}L${S} ${ym + u}V${H}H0Z` };
  };

  const set = (letters) => {
    let x = 0; const parts = [];
    for (const g of letters) { parts.push({ x, ...g }); x += g.w + GAP; }
    return { width: x - GAP, height: H, svg: parts.map((p) => `<path transform="translate(${p.x} 0)" d="${p.d}"/>`).join("") };
  };
  return {
    BI: set([B, l]),
    was: set([B, l, aSingle(105, 30, 104, 52), n(105, 30, 65), k(105, 80)]),
    condensed: set([B, l, aSingle(105, 30, 62, 44, 18), n(105, 30, 48), k(105, 74)]),
    tall: set([B, l, aTwo(40), n(40, 40, 65), k(40, 84)]),
    set, tallParts: [B, l, aTwo(40), n(40, 40, 65)],
  };
})();
