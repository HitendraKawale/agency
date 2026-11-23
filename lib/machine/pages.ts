// Every machine page, built from the same content the human pages render. Nothing here is new copy
// except each page's title and `#` line, which follow basement's.
import { home, site } from "@/content/home";
import { people } from "@/content/people";
import { services } from "@/content/services";
import { caseStudies, showcase, type CaseProject } from "@/content/showcase";
import { urls, type Doc, type Line, type Row, type Section } from "./doc";

const name = site.name.toLowerCase();

const showcaseLink = (p: CaseProject): Line => [{ text: p.name, page: `showcase/${p.slug}` }];

/** `- Name (Websites, 2026)`, or the name alone with `(coming soon)` when there's no case study */
const projectLines: Line[] = showcase.projects.map((p) =>
  "soon" in p
    ? [`${p.name} `, { dim: "(coming soon)" }]
    : [{ text: p.name, page: `showcase/${p.slug}` }, ` (${p.categories.join(", ")}, ${p.year})`],
);

const positions: Section = {
  name: "OPEN_POSITIONS",
  blocks: [
    {
      kind: "list",
      lines: people.positions.items.map((p) =>
        p.open
          ? [{ text: p.role, href: `mailto:${site.email}?subject=${encodeURIComponent(p.role)}` }, ` (${p.type}, ${p.location})`]
          : [`${p.role} (${p.type}, ${p.location}) `, { dim: "(closed)" }],
      ),
    },
  ],
};

const clients = home.trusted.clients.map((c) => (c.kind === "logo" ? c.alt : c.label));

const homeDoc: Doc = {
  path: "home",
  title: `${name} :: machine-readable index`,
  note: `# ${new URL(site.url).host} as plain text, for AI agents, crawlers, and people who'd rather read it raw.`,
  upper: true,
  head: { title: `Machine view | ${site.name}`, description: `Plain-text index of ${site.name} for AI agents and crawlers: who the studio is, services, clients, projects and contact.` },
  sections: [
    {
      name: "ABOUT",
      blocks: [
        {
          kind: "rows",
          rows: [
            { key: "name", value: [site.name] },
            { key: "location", value: [home.contact.clocks.map((c) => c.city).join(", ")] },
            { key: "area_served", value: ["Worldwide"] },
            { key: "services", value: [services.services.map((s) => s.title).join(", ")] },
            { key: "clients", value: [clients.join(", ")] },
            { key: "team", value: [people.crew.people.map((p) => p.name).join(", ")] },
          ],
        },
        { kind: "text", lines: [[home.hero.headline], [home.hero.line], [home.faq.items[2].a]] },
      ],
    },
    {
      name: "CAPABILITIES",
      blocks: [
        {
          kind: "items",
          items: services.services.map((s) => ({
            title: [{ text: s.title, page: "services", hash: s.id }],
            body: [[s.text[0]]],
            tags: s.scope,
          })),
        },
      ],
    },
    {
      name: "CLIENTS",
      blocks: [
        {
          kind: "text",
          lines: [
            home.trusted.clients.flatMap((c, i): Line => {
              const sep = i ? [", "] : [];
              return c.kind === "official" ? [...sep, c.label] : [...sep, { text: c.kind === "logo" ? c.alt : c.label, href: c.href }];
            }),
          ],
        },
      ],
    },
    {
      name: "SELECTED_WORK",
      blocks: [
        {
          kind: "list",
          lines: home.work.projects.map((w) => {
            const p = caseStudies.find((c) => "site" in c && c.site.href === w.href);
            return [p ? { text: w.name, page: `showcase/${p.slug}` } : { text: w.name, href: w.href }, ` — ${w.body}`];
          }),
        },
      ],
    },
    { name: "SHOWCASE", blocks: [{ kind: "list", lines: projectLines }] },
    positions,
    { name: "FAQ", blocks: [{ kind: "items", items: home.faq.items.map((f) => ({ title: [f.q], body: [[f.a]] })) }] },
    {
      name: "CONTACT",
      blocks: [
        {
          kind: "rows",
          rows: [
            { key: "email", value: [{ text: site.email, href: `mailto:${site.email}` }] },
            { key: "studios", value: [home.contact.clocks.map((c) => c.city).join(", ")] },
          ],
        },
      ],
    },
    {
      name: "FOR_AGENTS",
      blocks: [
        {
          kind: "rows",
          rows: ["/llms.txt", "/sitemap.md", ...["home", "services", "showcase", "people"].map((p) => urls(p).md)].map(
            (href): Row => ({ key: href.slice(1), value: [{ text: href, href }] }),
          ),
        },
      ],
    },
  ],
};

const servicesDoc: Doc = {
  path: "services",
  title: `${name} :: services`,
  note: "# what the studio does, machine-readable.",
  upper: false,
  head: { title: `Services machine view | ${site.name}`, description: services.head.title },
  sections: [
    { name: "INTRO", blocks: [{ kind: "text", lines: [[services.head.title], [services.head.line]] }] },
    {
      name: "WHAT_WE_OFFER",
      blocks: [
        {
          kind: "items",
          items: services.services.map((s) => ({ id: s.id, title: [s.title], body: [[s.question], ...s.text.map((t) => [t])], tags: s.scope })),
        },
      ],
    },
  ],
};

const showcaseDoc: Doc = {
  path: "showcase",
  title: `${name} :: showcase index`,
  note: `# selected projects by ${name}, machine-readable. append .md to any project url for raw markdown.`,
  meta: [{ key: "projects", value: [String(showcase.projects.length)] }],
  upper: true,
  head: { title: `Showcase machine view | ${site.name}`, description: `Every project in the ${site.name} showcase, as plain text.` },
  sections: [{ name: "PROJECTS", blocks: [{ kind: "list", lines: projectLines }] }],
};

const caseDoc = (p: CaseProject, i: number): Doc => {
  const site = "site" in p ? p.site : undefined;
  // the case page's next two projects, wrapping round
  const more = [1, 2].map((n) => caseStudies[(i + n) % caseStudies.length]);
  const sections: Section[] = [{ name: "PROJECT", blocks: [{ kind: "text", lines: p.story.map((t) => [t]) }] }];
  if ("brief" in p)
    sections.push({
      name: "BRIEF",
      blocks: [
        {
          kind: "items",
          items: [
            { title: ["The brand"], body: [[p.brief.brand]] },
            { title: ["What it needed"], body: [[p.brief.needed]] },
            { title: ["What we built"], body: [[p.brief.built]] },
          ],
        },
      ],
    });
  if ("quote" in p) {
    const q = p.quote;
    const role = "role" in q ? `${q.role} at ${q.org}` : q.org;
    sections.push({ name: "QUOTE", blocks: [{ kind: "text", lines: [[`"${q.words}"`], [{ dim: `${"by" in q ? q.by : "Name to confirm"}, ${role}` }]] }] });
  }
  sections.push({ name: "RELATED_PROJECTS", blocks: [{ kind: "list", lines: more.map(showcaseLink) }] });
  return {
    path: `showcase/${p.slug}`,
    title: p.name,
    meta: [
      { key: "client", value: site ? [{ text: p.name, href: site.href }] : [p.name] },
      { key: "year", value: [String(p.year)] },
      { key: "categories", value: [p.categories.map((c) => `[${c}]`).join(" ")] },
      ...(site ? [{ key: "website", value: [{ text: site.href, href: site.href }] }] : []),
    ],
    upper: false,
    head: { title: `${p.name} | Machine view`, description: p.story[0] },
    sections,
  };
};

const peopleDoc: Doc = {
  path: "people",
  title: `${name} :: people`,
  note: `# the people behind ${name}, machine-readable.`,
  meta: [{ key: "crew", value: [String(people.crew.people.length)] }],
  upper: false,
  head: { title: `People machine view | ${site.name}`, description: people.intro.text[0] },
  sections: [
    { name: "INTRO", blocks: [{ kind: "text", lines: people.intro.text.map((t) => [t]) }] },
    {
      name: "TEAM",
      blocks: [
        {
          kind: "list",
          lines: people.crew.people.map((p) => [p.name, { dim: ` — ${p.role}` }, ...p.links.flatMap((l) => [" ", { text: l.label, href: l.href }])]),
        },
      ],
    },
    { name: "VALUES", blocks: [{ kind: "items", items: people.values.items.map((v) => ({ title: [v.title], body: [[v.text]] })) }] },
    positions,
  ],
};

/** every machine page, in index order */
export const docs: readonly Doc[] = [homeDoc, servicesDoc, showcaseDoc, ...caseStudies.map(caseDoc), peopleDoc];

/** the pages the index at the top of every machine page lists */
export const index = ["home", "services", "showcase", "people"] as const;

export const docByPath = (path: string) => docs.find((d) => d.path === path);
