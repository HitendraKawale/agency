// Prints the compronents registry as Lab entries (JSON on stdout). Run by sync.mjs with tsx and
// compronents' tsconfig, so its `@/` imports resolve against that repo, not this one.
import { componentMeta } from "@/lib/component-meta";
import { registryItems } from "@/lib/registry";
import { componentGroups, pageGroups } from "@/lib/registry-groups";

const groupOf = new Map<string, string>();
for (const g of componentGroups) for (const n of g.names) groupOf.set(n, g.title);
// pages are one section on the Lab, whatever their theme group on ui.aryank.space
for (const g of pageGroups) for (const n of g.names) groupOf.set(n, "Pages");

const entries = registryItems
  .filter((i) => i.section === "components" || i.section === "pages")
  .map((i) => ({
    name: i.name,
    section: i.section,
    title: i.title,
    group: groupOf.get(i.name) ?? (i.section === "pages" ? "Pages" : "More"),
    description: i.description,
    notes: (componentMeta[i.name]?.nuance ?? []).map((n) => ({ label: n.label, description: n.description })),
  }));

process.stdout.write(
  JSON.stringify({ groups: ["Pages", ...componentGroups.map((g) => g.title)], entries }),
);
