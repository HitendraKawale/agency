// Pulls Aino's point engine (xe) and homepage intro (dt) out of the pinned
// bundle, with every top-level declaration they reach, byte for byte.
// Run from the repo root: node scripts/extract-aino-intro.mjs <pinned DL6rle9w.js>
import fs from "node:fs";
import crypto from "node:crypto";
import ts from "typescript";

const pinnedPath = process.argv[2];
const text = fs.readFileSync(pinnedPath, "utf8");
// A program, not a bare source file, so each identifier resolves through
// scope to the declaration it binds; minified locals shadow top-level names.
const program = ts.createProgram([pinnedPath], { allowJs: true, checkJs: false, noEmit: true, target: ts.ScriptTarget.Latest });
const checker = program.getTypeChecker();
const source = program.getSourceFile(pinnedPath);
const topLevel = new Set(source.statements);

// name -> { code, node }
const declarations = new Map();
for (const statement of source.statements) {
  if (ts.isFunctionDeclaration(statement) && statement.name) {
    declarations.set(statement.name.text, { code: statement.getText(source), node: statement });
  } else if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      const names = [];
      const collect = (name) => {
        if (ts.isIdentifier(name)) names.push(name.text);
        else for (const element of name.elements ?? []) if (!ts.isOmittedExpression(element)) collect(element.name);
      };
      collect(declaration.name);
      for (const name of names) declarations.set(name, { code: `var ${declaration.getText(source)};`, node: declaration });
    }
  }
}

/** True when this declaration node is itself a top-level function or var. */
function isTopLevelDeclaration(declaration) {
  if (ts.isFunctionDeclaration(declaration)) return topLevel.has(declaration);
  let current = declaration;
  while (current && ts.isBindingElement(current)) current = current.parent.parent;
  return !!current && ts.isVariableDeclaration(current) && topLevel.has(current.parent.parent);
}

/** Top-level names this node actually binds to, resolved through scope. */
function referenced(node) {
  const found = new Set();
  const visit = (child) => {
    if (ts.isIdentifier(child)) {
      const declaration = checker.getSymbolAtLocation(child)?.declarations?.[0];
      if (declaration && isTopLevelDeclaration(declaration) && declarations.has(child.text)) found.add(child.text);
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}

const roots = (process.argv[3] ?? "xe,G,F,j,V,U,z,Oe,it,lt,ct").split(",");
const order = [];
const seen = new Set();
const visit = (name) => {
  if (seen.has(name) || !declarations.has(name)) return;
  seen.add(name);
  const { node } = declarations.get(name);
  for (const dependency of referenced(node)) if (dependency !== name) visit(dependency);
  order.push(name);
};
roots.forEach(visit);

// One var statement can declare several names; emit each statement once.
const emitted = new Set();
const parts = [];
const manifest = [];
for (const name of order) {
  const { code } = declarations.get(name);
  if (emitted.has(code)) continue;
  emitted.add(code);
  parts.push(code);
  manifest.push({ name, bytes: code.length, sha256: crypto.createHash("sha256").update(code).digest("hex") });
}
fs.mkdirSync("/tmp/rv/intro", { recursive: true });
fs.writeFileSync("/tmp/rv/intro/extracted.js", parts.join("\n"));
fs.writeFileSync("/tmp/rv/intro/manifest.json", JSON.stringify(manifest, null, 1));
console.log(manifest.map((m) => `${m.name}:${m.bytes}`).join(" "));
console.log("declarations", manifest.length, "bytes", parts.join("\n").length);

// ── Build components/site/effects/aino-intro.mjs ─────────────────────────────
// The intro (dt) is copied byte for byte; only its boundaries with Aino's own
// page change, each by an exact replacement that must match the stated count.
const dtStatement = source.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === "dt");
let intro = dtStatement.getText(source);
const revealStart = intro.indexOf("const r=()=>{");
const revealEnd = intro.indexOf("Se(o,{speed:6,duration:1200})};") + "Se(o,{speed:6,duration:1200})};".length;
const boundaries = [
  ['const[n]=M(".grid",e),a=k("nav"),s=[];', "const n=e,a=__host.nav,s=[];", 1],
  [intro.slice(revealStart, revealEnd), "const r=()=>{__host.reveal()};", 1],
  ['s.push(await Z(e,"pages"))', "s.push(()=>{})", 2],
  ['[...M(".home-content",e),...M("#footer")]', "__host.inert", 1],
  ['"/aino.svg"', "__host.logo", 1],
  ['"/assets/sm4.mp4"', "__host.video", 1],
  ['text:"Aino"', "text:__host.words[0]", 1],
  ['text:"Work  Services"', "text:__host.words[1]", 1],
  ['text:"About  Play"', "text:__host.words[2]", 1],
  ['text:"Settings"', "text:__host.words[3]", 1],
  ['text:"Contact"', "text:__host.words[4]", 2],
  ['text:"Menu"', "text:__host.words[5]", 1],
  ['document.body.classList.add("ready")', "__host.ready()", 3],
  ['document.body.classList.remove("ready")', "__host.unready()", 2],
];
for (const [from, to, count] of boundaries) {
  const found = intro.split(from).length - 1;
  if (found !== count) throw new Error(`Boundary "${from.slice(0, 60)}" matched ${found}, expected ${count}`);
  intro = intro.split(from).join(to);
}
intro = intro.replace("async function dt(", "async function dt(");

const helpers = parts.join("\n");
const output = `/**
 * Aino's homepage intro and the character-point engine it runs on, generated
 * from the pinned bundle by scripts/extract-aino-intro.mjs. Do not hand-edit.
 *
 * Declarations below are byte-for-byte copies (hashes in aino-intro.manifest.json).
 * The intro function dt is copied whole; only its boundaries with Aino's page
 * are swapped for the host object: their .grid, nav, page loader, page content,
 * logo, showreel, nav words, and body.ready class.
 */
let __host;
var at = { value: { homeReady: false }, assign(update) { Object.assign(this.value, update); } };
${helpers}
${intro}

/**
 * Runs the intro inside grid. Returns a cleanup. host: { nav, inert, logo,
 * video, words: [brand, second, third, settings, contact, menu], reveal,
 * ready, unready }.
 */
export async function runAinoIntro(grid, host) {
  __host = host;
  const cleanups = [];
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    cleanups.push(() => target.removeEventListener(type, handler, options));
  };
  const finish = await dt(grid, { listen, onCleanup: (fn) => cleanups.push(fn) });
  if (typeof finish === "function") cleanups.push(finish);
  return () => { for (const fn of cleanups.splice(0)) fn(); };
}

/** True once the intro has played (or been skipped) in this page session. */
export const introDone = () => at.value.homeReady;
`;
fs.writeFileSync("components/site/effects/aino-intro.mjs", output);
fs.writeFileSync("components/site/effects/aino-intro.manifest.json", JSON.stringify({ source: "reference/aino/DL6rle9w.js", declarations: manifest, intro: { name: "dt", sha256: crypto.createHash("sha256").update(dtStatement.getText(source)).digest("hex"), boundaries: boundaries.map(([from, to, count]) => ({ from: from.length > 80 ? `${from.slice(0, 77)}...` : from, to, count })) } }, null, 1));
console.log("wrote components/site/effects/aino-intro.mjs", output.length, "bytes");
