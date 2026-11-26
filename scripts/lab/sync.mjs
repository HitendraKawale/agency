// Refreshes content/lab.json from the sibling compronents repo:
//   node scripts/lab/sync.mjs [path/to/compronents]
// Registry fields (title, group, description, notes) are overwritten. What was added here by
// hand or by the recorder (recipe, status, check, clip) is kept.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const repo = resolve(process.argv[2] ?? join(homedir(), "Desktop/CREATE/compronents"));
const out = join(root, "content/lab.json");

const raw = execFileSync(
  join(root, "node_modules/.bin/tsx"),
  ["--tsconfig", join(repo, "tsconfig.json"), join(import.meta.dirname, "export.ts")],
  { cwd: repo, maxBuffer: 64 << 20 },
);
const { groups, entries } = JSON.parse(raw.toString());

const prev = existsSync(out) ? JSON.parse(readFileSync(out, "utf8")) : { entries: [] };
const kept = new Map(prev.entries.map((e) => [e.name, e]));
const merged = entries.map((e) => {
  const { recipe, status = "todo", check, clip } = kept.get(e.name) ?? {};
  return { ...e, ...(recipe && { recipe }), status, ...(check && { check }), ...(clip && { clip }) };
});
const dropped = prev.entries.filter((e) => !entries.some((n) => n.name === e.name)).map((e) => e.name);

writeFileSync(out, JSON.stringify({ groups, entries: merged }, null, 2) + "\n");
console.log(`${merged.length} entries -> content/lab.json${dropped.length ? `; removed: ${dropped.join(", ")}` : ""}`);
