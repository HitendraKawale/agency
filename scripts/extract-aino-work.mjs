// Builds components/site/effects/aino-work.mjs: Aino's work page module (gn)
// with the kernel declarations it runs on, copied byte for byte from the
// pinned bundle. Run from the repo root:
//   node scripts/extract-aino-work.mjs <reference/aino/DL6rle9w.js>
// Boundaries (and only these) belong to the wrapper: the scoped CSS reader
// (S(root, …) as in the effects kernel), M and A scoped to the page root, the
// settings store C (Mood/Img from <html>, plus workView), pn (declared in a
// statement that also registers Aino's route, so it cannot be lifted), and
// history.pushState, which becomes the host's Next.js navigation.
import fs from "node:fs";
import crypto from "node:crypto";
import ts from "typescript";

const pinnedPath = process.argv[2];
const text = fs.readFileSync(pinnedPath, "utf8");
const source = ts.createSourceFile(pinnedPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const kernelNames = ["_", "S", "P", "$", "N", "I", "H", "q", "z", "B", "Y", "K", "J", "ue", "We", "we", "Ee", "be", "Ce", "Me", "ke", "_e", "Se", "De", "Re", "Pe", "$e", "Ne", "Ie", "Fe", "je", "He", "Ue", "Ve"];
const names = [...kernelNames, "gn"];

const declarations = new Map();
for (const statement of source.statements) {
  if (ts.isFunctionDeclaration(statement) && statement.name) {
    declarations.set(statement.name.text, statement.getText(source));
  } else if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      declarations.set(declaration.name.getText(source), `var ${declaration.getText(source)};`);
    }
  }
}
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const extracts = names.map((name) => {
  const code = declarations.get(name);
  if (!code) throw new Error(`Missing pinned Aino declaration: ${name}`);
  return { name, code, sha256: sha256(code) };
});

function swap(code, from, to, count) {
  const found = code.split(from).length - 1;
  if (found !== count) throw new Error(`Boundary "${from}" matched ${found}, expected ${count}`);
  return code.split(from).join(to);
}

const body = extracts
  .map(({ name, code }) => {
    let out = code.replaceAll("S(document.documentElement,", "S(root,");
    if (name === "gn") out = swap(out, 'history.pushState(null,"",e.href)', "host.navigate(e.href)", 1);
    return out;
  })
  .join("\n");

const output = `/**
 * Aino's work page (gn) and the effect declarations it uses, generated from
 * the pinned bundle by scripts/extract-aino-work.mjs. Do not hand-edit.
 * Declaration hashes: aino-work.manifest.json.
 */
export function createAinoWork(root, initialPreferences, host) {
  const timers = new Set();
  const frames = new Set();
  let disposed = false;
  const setTimeout = (callback, delay) => {
    const id = window.setTimeout(() => { timers.delete(id); if (!disposed) callback(); }, delay);
    timers.add(id);
    return id;
  };
  const clearTimeout = id => { window.clearTimeout(id); timers.delete(id); };
  const requestAnimationFrame = callback => {
    const id = window.requestAnimationFrame(time => { frames.delete(id); if (!disposed) callback(time); });
    frames.add(id);
    return id;
  };
  const cancelAnimationFrame = id => { window.cancelAnimationFrame(id); frames.delete(id); };
  const A = key => parseFloat(getComputedStyle(root).getPropertyValue('--' + key));
  const O = key => getComputedStyle(root).getPropertyValue('--' + key).split(',').map(Number);
  const M = (selector, container = root) => Array.from(container.querySelectorAll(selector));
  // Aino's work page tile ratio, declared beside its route in their bundle.
  const pn = .8;
  const subscribers = new Set();
  const C = {
    value: { ...initialPreferences, workView: host.workView, theme: 'blank' },
    subscribe(callback) { subscribers.add(callback); return () => subscribers.delete(callback); },
    assign(update) {
      const previous = C.value;
      C.value = { ...C.value, ...update };
      for (const callback of subscribers) callback(C.value, previous);
      if (update.workView) host.onWorkView(update.workView);
    },
  };
  const E = { blank: [[5,9,10],[14,25,30],[187,201,199],[223,234,232]] };
  let D = E.blank.slice();
  const R = key => D.push(O(key));
  R('dark'); R('light');
${body}
  const cleanups = [];
  return {
    run() {
      const listen = (target, type, handler, options) => {
        target.addEventListener(type, handler, options);
        cleanups.push(() => target.removeEventListener(type, handler, options));
      };
      return gn(root, { listen, onCleanup: fn => cleanups.push(fn) });
    },
    update(next) {
      const previous = C.value;
      C.value = { ...C.value, ...next };
      for (const callback of subscribers) callback(C.value, previous);
    },
    dispose() {
      for (const fn of cleanups.splice(0)) fn();
      He();
      disposed = true;
      for (const id of timers) window.clearTimeout(id);
      for (const id of frames) window.cancelAnimationFrame(id);
      timers.clear(); frames.clear(); subscribers.clear();
    },
  };
}
`;
fs.writeFileSync("components/site/effects/aino-work.mjs", output);
fs.writeFileSync(
  "components/site/effects/aino-work.manifest.json",
  JSON.stringify({ source: pinnedPath.replace(/.*reference\//, "reference/"), sourceSha256: sha256(text), declarations: extracts.map(({ name, sha256 }) => ({ name, sha256 })) }, null, 1) + "\n",
);
console.log(`Extracted ${extracts.length} declarations (${body.length} bytes) into components/site/effects/aino-work.mjs`);
