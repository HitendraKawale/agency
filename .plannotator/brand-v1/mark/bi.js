// BI monogram in the construction of Rerun's "re": heavy slab letters (stem ~0.25 of the
// height), square on the left, 45 degree chamfers on the right like a bolt head, round
// half-disc counters, a U-slit dipping into the top edge at the stem junction.
// Units: cap height 240. Path uses evenodd for counters and the slit.
const BI = (() => {
  const H = 240, S = 62, T = 40, MID = 30, BW = 218, C = 40, GAP = 24, IW = 62, IC = 22;
  const ix = BW + GAP, W = ix + IW, wy = H / 2;
  const b = [
    `M0 0H${BW - C}L${BW} ${C}`, // top-right chamfer
    `V${wy - C * 0.6}L${BW - C * 0.9} ${wy}L${BW} ${wy + C * 0.6}`, // waist notch
    `V${H - C}L${BW - C} ${H}H0Z`, // bottom-right chamfer
  ].join("");
  // half-disc counters: flat edge on the stem, round on the right
  const ch = (H - 2 * T - MID) / 2; // horizontals thinner than stems, as in Rerun
  const disc = (y0, xr) => { const r = ch / 2; return `M${S} ${y0}H${xr - r}A${r} ${r} 0 0 1 ${xr - r} ${y0 + ch}H${S}Z`; };
  const xr = BW - S + 10;
  const slit = (cx, w = 24, depth = 34) => `M${cx - w / 2} 0V${depth - w / 2}A${w / 2} ${w / 2} 0 0 0 ${cx + w / 2} ${depth - w / 2}V0Z`;
  const i = `M${ix} 0H${W - IC}L${W} ${IC}V${H - IC}L${W - IC} ${H}H${ix}Z`;
  return {
    width: W, height: H,
    path: [b, disc(T, xr), disc(T + ch + MID, xr), slit(S + 12, 20, 19), i].join(" "),
  };
})();
