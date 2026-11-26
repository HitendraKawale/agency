// A Doc as markdown, in the shape of basement's twins (basement.studio/index.md, pinned in
// reference/basement-machine): `# title`, its rows in bold, then `## Section` per section.
// Links to other machine pages point at their .md twins, as basement's do.
import { site } from "@/content/home";
import { urls, type Block, type Doc, type Line, type Row } from "./doc";
import { docs } from "./pages";

const abs = (path: string) => new URL(path, site.url).href;

const spans = (line: Line) =>
  line
    .map((span) => {
      if (typeof span === "string") return span;
      if ("dim" in span) return span.dim;
      if ("page" in span) return `[${span.text}](${abs(urls(span.page).md)}${span.hash ? `#${span.hash}` : ""})`;
      return `[${span.text}](${span.href.startsWith("/") ? abs(span.href) : span.href})`;
    })
    .join("");

/** ABOUT → About, SELECTED_WORK → Selected work */
const heading = (name: string) => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase().replaceAll("_", " ");

const rows = (rs: readonly Row[]) => rs.map((r) => `**${heading(r.key)}:** ${spans(r.value)}`).join("  \n");

const block = (b: Block): string => {
  switch (b.kind) {
    case "text":
      return b.lines.map(spans).join("\n\n");
    case "rows":
      return rows(b.rows);
    case "list":
      return b.lines.map((l) => `- ${spans(l)}`).join("\n");
    case "items":
      return b.items
        .map((it) => [`### ${spans(it.title)}`, ...it.body.map(spans), ...(it.tags ? [it.tags.map((t) => `- ${t}`).join("\n")] : [])].join("\n\n"))
        .join("\n\n");
  }
};

const footer = `---\n\n[View all content](${abs("/sitemap.md")})\n`;

export function toMarkdown(doc: Doc) {
  const { human } = urls(doc.path);
  const head = [`# ${doc.path === "home" ? site.name : doc.title}`];
  if (doc.path !== "home") head.push(rows([...(doc.meta ?? []), { key: "human", value: [abs(human)] }]));
  const body = doc.sections.map((s) => [`## ${heading(s.name)}`, ...s.blocks.map(block)].join("\n\n"));
  return [...head, "---", ...body, footer].join("\n\n");
}

/** every page's twin, as basement's sitemap.md lists them */
export function sitemap() {
  const link = (path: string, text: string) => `- [${text}](${abs(urls(path).md)})`;
  const pages = ["home", "services", "showcase", "people", "lab"];
  return [
    `# ${site.name} — Content Index`,
    "## Pages",
    pages.map((p) => link(p, heading(p.toUpperCase()))).join("\n"),
    "## Projects",
    docs.filter((d) => d.path.startsWith("showcase/")).map((d) => link(d.path, d.title)).join("\n"),
    "## Lab",
    docs.filter((d) => d.path.startsWith("lab/")).map((d) => link(d.path, d.title)).join("\n"),
    "",
  ].join("\n\n");
}
