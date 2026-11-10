// "Blank" wordmark grown out of the BI monogram (bi.js). B and l are BI's B and I, untouched,
// at the same spacing, so the word opens with the mark. The lowercase letters reuse BI's parts:
// x-height = top of B's mid bar (105), bars 30 over the counter and 40 at the baseline, so
// every counter is B's counter (104 x 65, one round end, r 32.5), mirrored or turned upright.
// Stems 62, chamfers 40 on the bowl side, 22 on free stem corners, U-slit (20 x 19) where a
// stem meets a bowl or arch. Cap height 240, y down, evenodd.
const WORD = (() => {
  const H = 240, S = 62, T = 40, MID = 30, C = 40, IC = 22, GAP = 24, wy = H / 2;
  const ch = (H - 2 * T - MID) / 2, r = ch / 2, X = T + ch; // 65, 32.5, 105
  const slit = (cx, y0 = 0, w = 20, depth = 19) =>
    `M${cx - w / 2} ${y0}V${y0 + depth - w / 2}A${w / 2} ${w / 2} 0 0 0 ${cx + w / 2} ${y0 + depth - w / 2}V${y0}Z`;

  // BI's B, verbatim
  const B = (() => {
    const BW = 218, xr = BW - S + 10;
    const disc = (y0) => `M${S} ${y0}H${xr - r}A${r} ${r} 0 0 1 ${xr - r} ${y0 + ch}H${S}Z`;
    return { w: BW, d: [`M0 0H${BW - C}L${BW} ${C}V${wy - C * 0.6}L${BW - C * 0.9} ${wy}L${BW} ${wy + C * 0.6}V${H - C}L${BW - C} ${H}H0Z`,
      disc(T), disc(T + ch + MID), slit(S + 12, 0, 20, 19)].join(" ") };
  })();
  // BI's I, verbatim, as the l
  const l = { w: S, d: `M0 0H${S - IC}L${S} ${IC}V${H - IC}L${S - IC} ${H}H0Z` };

  // lowercase b: BI's lower bowl on an ascender stem (for the all-lowercase version)
  const b = (() => {
    const BW = 218, xr = BW - S + 10, y0 = X + MID;
    return { w: BW, d: [`M0 0H${S - IC}L${S} ${IC}V${X}H${BW - C}L${BW} ${X + C}V${H - C}L${BW - C} ${H}H0Z`,
      `M${S} ${y0}H${xr - r}A${r} ${r} 0 0 1 ${xr - r} ${y0 + ch}H${S}Z`, slit(S + 12, X)].join(" ") };
  })();

  // a: b's bowl mirrored onto a right stem (counter xl..xs: B's counter, round end on the left).
  // Three ways of telling the stem from the bowl, kept side by side for review.
  const aParts = (() => {
    const AW = 218, xs = AW - S, xl = AW - (AW - S + 10), y0 = X + MID;
    const counter = `M${xs} ${y0}H${xl + r}A${r} ${r} 0 0 0 ${xl + r} ${y0 + ch}H${xs}Z`;
    // notch: the bowl is an octagon whose right chamfers run into the square stem, leaving V notches
    const nn = 22;
    const notch = { w: AW, d: [`M0 ${X + C}L${C} ${X}H${xs - nn}L${xs} ${X + nn}V${X}H${AW - IC}L${AW} ${X + IC}V${H - IC}L${AW - IC} ${H}H${xs}V${H - nn}L${xs - nn} ${H}H${C}L0 ${H - C}Z`, counter].join(" ") };
    // spur: closed bowl with BI's slit at the junction, the stem kicks out a short foot at the baseline
    const SP = 30;
    const spur = { w: AW + SP, d: [`M0 ${X + C}L${C} ${X}H${AW - IC}L${AW} ${X + IC}V${H - T}H${AW + SP - 20}L${AW + SP} ${H - T + 20}V${H}H${C}L0 ${H - C}Z`, counter, slit(xs - 12, X)].join(" ") };
    // slot: two-story attempt (reads as a reversed e)
    const sh = 27, ys = y0 + sh, cx = xl + r, cy = y0 + r, xa = cx - Math.sqrt(r * r - (ys - cy) ** 2);
    const slot = { w: AW, d: [`M0 ${X + IC}L${IC} ${X}H${AW - IC}L${AW} ${X + IC}V${H - IC}L${AW - IC} ${H}H${C}L0 ${H - C}V${ys}H${xa}A${r} ${r} 0 0 0 ${cx} ${y0 + ch}H${xs}V${y0}H0Z`, slit(xs - 12, X)].join(" ") };
    return { notch, spur, slot };
  })();
  const a = aParts.notch;

  // n: B's counter turned upright (65 wide, round top) as the arch, open at the baseline.
  const n = (() => {
    const NW = 2 * S + ch;
    return { w: NW, d: [`M0 ${X}H${NW - C}L${NW} ${X + C}V${H - IC}L${NW - IC} ${H}H${NW - S}V${X + MID + r}A${r} ${r} 0 0 0 ${S} ${X + MID + r}V${H}H0Z`,
      slit(S + 12, X)].join(" ") };
  })();

  // k: the I as an ascender stem, two 45 degree arms meeting it in the middle of the x-height.
  const k = (() => {
    const ym = (X + H) / 2, h2 = (H - X) / 2, aw = 80, u = 44, v = aw - u, KW = S + h2 + v;
    return { w: KW, d: `M0 0H${S - IC}L${S} ${IC}V${ym - u}L${S + h2 - u} ${X}H${KW}L${S + v} ${ym}L${KW} ${H}H${S + h2 - u}L${S} ${ym + u}V${H}H0Z` };
  })();

  const set = (letters) => {
    let x = 0; const parts = [];
    for (const g of letters) { parts.push({ x, ...g }); x += g.w + GAP; }
    return { width: x - GAP, height: H, svg: parts.map((p) => `<path transform="translate(${p.x} 0)" d="${p.d}"/>`).join("") };
  };
  return { Blank: set([B, l, a, n, k]), BlankSpur: set([B, l, aParts.spur, n, k]), blank: set([b, l, a, n, k]), blankSpur: set([b, l, aParts.spur, n, k]), BI: set([B, l]) };
})();
