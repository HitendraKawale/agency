// The homepage as an agent reads it: the accessibility tree of blankinterfaces.com (mockups/art/site.html).
// Shared by study/mono (the animated tree, after Rerun's 28-Mono) and study/software (the app's left panel).
// Leaf swatches are small heat fields: hot where an agent leans on the node (the heading), cold where it
// only gets a description (the figure's alt text). Same reading as the app's viewport render.
const SPECTRUM = ["#186ADD", "#9BBFD3", "#86D9A6", "#F6DA75", "#D72F21"];
const HEAT = { hot: [4, 3], warm: [3, 2], mild: [2, 1], cold: [1, 0] };

const TREE = {
  id: "root", name: "blankinterfaces.com", icon: "root", children: [
    { id: "doc", name: 'document "Blank Interfaces"', children: [
      { id: "banner", name: "banner", children: [{}] },
      { id: "nav", name: "navigation", children: [{}] },
      { id: "main", name: "main", children: [
        { name: 'heading "We design and build…"', heat: "hot" },
        { name: 'paragraph "A design and…"', heat: "warm" },
        { id: "group", name: "group", children: [
          { name: 'link "Start a project"', heat: "mild" },
          { name: 'link "See the work"', heat: "mild" },
        ] },
        { name: 'figure "Heat render of…"', heat: "cold" },
      ] },
      { id: "footer", name: "contentinfo", children: [{}] },
    ] },
    { name: "llms.txt", heat: "warm" },
  ],
};

// Flatten the tree into visible rows for a set of open node ids.
function treeRows(open, node = TREE, depth = 0, out = []) {
  const parent = !!node.children;
  out.push({ node, depth, parent, open: parent && open.has(node.id) });
  if (parent && open.has(node.id)) node.children.forEach((c) => c.name && treeRows(open, c, depth + 1, out));
  return out;
}

const CHEV = (rot) => `<svg viewBox="0 0 16 16" style="transform:rotate(${rot}deg)"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>`;
function swatch(heat) {
  const [a, b] = HEAT[heat];
  return `<i class="sw" style="background:linear-gradient(135deg,${SPECTRUM[a]},${SPECTRUM[b]})"></i>`;
}
const ROOT_ICON = `<i class="ri" style="background:radial-gradient(120% 120% at 70% 75%,${SPECTRUM[4]} 0%,${SPECTRUM[3]} 30%,${SPECTRUM[2]} 55%,${SPECTRUM[1]} 75%,${SPECTRUM[0]} 100%)"></i>`;

// HTML for the rows. rot(node) gives each chevron's angle (0 closed, 90 open) so callers can animate it.
function treeHTML(rows, rot = (r) => (r.open ? 90 : 0)) {
  return rows.map((r) => {
    // leaves carry their swatch in the chevron's place, as Rerun's diamonds do
    const lead = `<span class="ch">${r.parent ? CHEV(rot(r)) : r.node.heat ? swatch(r.node.heat) : ""}</span>`;
    const icon = r.node.icon === "root" ? ROOT_ICON : "";
    return `<div class="row" style="--d:${r.depth}">${lead}${icon}<span class="nm">${r.node.name}</span></div>`;
  }).join("");
}
