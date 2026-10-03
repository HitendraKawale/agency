// Copies noth.in's section.glitch code (scroll-velocity scramble, fall-away,
// typed final line, image dim and photo parallax) out of their pinned bundle.
// Run from the repo root: node scripts/extract-nothin-glitch.mjs <pinned main.js>
// The byte range runs from `const sx=` to the end of pC(); nothing in it is
// edited. In their bundle F is gsap and Oe is ScrollTrigger; the wrapper takes
// both as parameters, so the copied code binds to ours.
import fs from "node:fs";
import crypto from "node:crypto";

const pinned = fs.readFileSync(process.argv[2], "utf8");
const start = pinned.indexOf("const sx='abcdefghijklmnopqrstuvwxyz");
const pcStart = pinned.indexOf("function pC(){", start);
// pC's body ends at the first "}" that balances its opening brace.
let depth = 0;
let end = -1;
for (let i = pinned.indexOf("{", pcStart); i < pinned.length; i++) {
  if (pinned[i] === "{") depth++;
  else if (pinned[i] === "}" && --depth === 0) { end = i + 1; break; }
}
if (start < 0 || pcStart < 0 || end < 0) throw new Error("Pinned glitch code not found");
const code = pinned.slice(start, end);
for (const name of ["function ax(", "function lx(", "function hC(", "const fC=4", "function dC(", "function cx(", "function pC("]) {
  if (!code.includes(name)) throw new Error(`Missing ${name}`);
}
const sha256 = crypto.createHash("sha256").update(code).digest("hex");
const output = `/**
 * noth.in's section.glitch, copied byte for byte from their pinned bundle
 * (reference/nothin/js/main.js, bytes ${start}-${end}, sha256 ${sha256}) by
 * scripts/extract-nothin-glitch.mjs. Do not hand-edit.
 *
 * cx() binds every .section.glitch on the page: per-character scramble driven
 * by scroll velocity, characters falling away on a scrubbed timeline, the
 * .finaltext typed in by that timeline's progress, the backdrop dimming, and
 * the two .img-glitch-w photos rising at different speeds. pC() undoes it.
 */
export function createNothinGlitch(F, Oe) {
${code}
  return { init: cx, destroy: pC };
}
`;
fs.writeFileSync("components/site/effects/nothin-glitch.mjs", output);
console.log("wrote", output.length, "bytes; source range", start, end, sha256);
