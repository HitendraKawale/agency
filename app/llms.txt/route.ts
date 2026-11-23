// /llms.txt in basement's layout (reference/basement-machine/llms.txt): who we are, the key pages,
// the markdown twins, contact. Everything comes from content/ and lib/machine.
import { home, site } from "@/content/home";
import { urls } from "@/lib/machine/doc";
import { index } from "@/lib/machine/pages";
import { services } from "@/content/services";

export const dynamic = "force-static";

const abs = (path: string) => new URL(path, site.url).href;
const title = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);

export function GET() {
  const body = [
    `# ${site.name}`,
    `> ${home.hero.headline} ${home.hero.line} ${home.faq.items[0].a}`,
    "## Key pages",
    [
      ...index.map((p) => `- [${title(p)}](${abs(urls(p).human)})`),
      `- [Machine view](${abs("/ai/home")}): Plain-HTML mirror of the site for agents; every page has a twin at /ai/{path}.`,
    ].join("\n"),
    "## Services",
    services.services.map((s) => `- [${s.title}](${abs(`/services#${s.id}`)}): ${s.scope.join(", ")}`).join("\n"),
    "## Markdown mirrors",
    `Every page has a markdown twin: append \`.md\` to the URL (also served via \`Accept: text/markdown\`). Full index: ${abs("/sitemap.md")}`,
    index.map((p) => `- ${abs(urls(p).md)}`).join("\n"),
    "## Contact",
    `- ${site.email}`,
    "",
  ].join("\n\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
