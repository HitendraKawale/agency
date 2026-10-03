import type { Metadata } from "next";
import Link from "next/link";
import Media from "@/components/site/media";
import Reveal from "@/components/site/reveal";
import FilmstripVideoPlayer from "@/components/ui/filmstrip-video-player";
import ParflowMarkEditor from "@/components/ui/parflow-mark-editor";

/**
 * Parflow Engineering , case study.
 *
 * Facts come from the parflow-engineering project record and proposal PF-01:
 * instrumentation tube fittings & valves, Vasai; WordPress/Elementor replaced
 * by Next.js 16 + Tailwind v4 on Vercel; 16 product families; shipped
 * 2026-07-30. The ledger is set as the back of a record sleeve (side A, side
 * B), the architecture as an interpreter trace, both from the brief.
 */

const CASE = {
  client: "Parflow Engineering",
  standfirst: "We rebuilt the company's website from a WordPress theme into a product.",
  embed: {
    src: "https://embed.mckp.live/embed.html?uid=413939d5-2b4e-480f-989f-d8d71cea9294&cursor-range=1-50-1-50&click-range=8-8-7-7&camera-zoom=30",
    title: "Parflow Engineering",
  },
  facts: [
    { label: "Client", value: "Parflow Engineering" },
    { label: "Field", value: "Industrial Engineering website" },
    { label: "Based", value: "Vasai, Maharashtra" },
    { label: "Shipped", value: "30 July 2026" },
    { label: "Live", value: "parflowengineering.com", href: "https://parflowengineering.com" },
  ],
  frames: [
    { src: "/frames/parflow-home.png", alt: "Parflow Engineering homepage", className: "span-6", phone: false },
    { src: "/frames/parflow-home-mobile.png", alt: "Parflow Engineering homepage on a phone", className: "span-2", phone: true },
    { src: "/frames/parflow-catalogue.png", alt: "Parflow product catalogue", className: "span-4", phone: false },
    { src: "/frames/parflow-product.png", alt: "A Parflow product page", className: "span-4", phone: false },
  ],
  // 26.3 s, recorded from the live site (public/media/PROVENANCE.md).
  walkthrough: {
    src: "/media/parflow-walkthrough.mp4",
    frames: Array.from({ length: 9 }, (_, i) => `/media/parflow-walkthrough/${i + 1}.jpg`),
    timestamps: Array.from({ length: 13 }, (_, i) => `00:${String(Math.round((i * 26.3) / 12)).padStart(2, "0")}`),
  },
  identity: {
    label: "Ideation",
    heading: "What makes this website what it is now.",
    body: "This website was genuinely maximalist and hard to ideate, but back and forth and inspiration from other sites made it possible",
  },
  architecture: {
    label: "Architecture",
    heading: "Comfort + speed",
    before: {
      when: "until july 2026",
      box: "wordpress",
      lines: ["theme[bought]", "builder[page]", "host[shared, single]", "plugins[weight]", "footer[demo copy]"],
      note: "A bought theme and a page builder on a single shared host. Plugin weight, no control over metadata, demo copy still in the footer.",
    },
    after: {
      when: "since 30 july 2026",
      box: "next.js 16",
      lines: ["react · typescript", "tailwind[v4]", "vercel[edge] · neon[postgres]", "catalogue[typed, one]", "admin[team owned]"],
      note: "All products generated from one typed catalogue, server-rendered, deployed to the edge, with an admin the team owns.",
    },
  },
  seo: {
    label: "SEO, AEO",
    heading: "Indexed is the floor. Cited is the point.",
    body: "Every product page states the definition, the operating principle, the specification and the questions a buyer actually asks , then says the same thing again in a form a machine can quote without guessing.",
    schema: ["Organization", "Product", "FAQPage", "BreadcrumbList", "BlogPosting", "JobPosting"],
    crawlers: ["GPTBot", "ClaudeBot", "PerplexityBot", "OAI-SearchBot", "Google-Extended", "Bingbot"],
  },
  scores: {
    label: "Measured",
    heading: "You can measure some of it.",
    items: [
      { value: "99", label: "Performance" },
      { value: "100", label: "Accessibility" },
      { value: "100", label: "Best practices" },
      { value: "100", label: "SEO" },
      { value: "3/3", label: "Agentic browsing" },
    ],
    source: "Google PageSpeed Insights, desktop, parflowengineering.com, July 2026",
  },
  ledger: {
    label: "The ledger",
    heading: "A proposal is a promise, we delivered",
    items: [
      { no: "01", asked: "Architecture and system design", shipped: "Next.js 16 App Router on Vercel. The admin never loads the animation runtime; the public site never loads the admin." },
      { no: "02", asked: "Design and UX rebuild", shipped: "A custom system , black capitals, blue accent, chamfered-octagon line art , and a component library the team recombines instead of redraws." },
      { no: "03", asked: "Frontend engineering", shipped: "Server-rendered semantic markup, optimized fonts and images, one motion runtime rather than a plugin per effect." },
      { no: "04", asked: "Content platform and CRM", shipped: "An admin for blog, products, careers and enquiries. Enquiries move through a pipeline instead of an inbox." },
      { no: "05", asked: "Database setup and administration", shipped: "A managed Neon database with typed schema and migrations for posts, products and submissions." },
      { no: "06", asked: "SEO and metadata system", shipped: "Per-page metadata from the content model. JSON-LD for Organization, Product, FAQPage and Breadcrumbs, plus generated sitemap and robots." },
      { no: "07", asked: "Accessibility, WCAG 2.2 AA", shipped: "Semantic structure, keyboard paths and AA contrast. Scored 100 on Lighthouse accessibility." },
      { no: "08", asked: "Internationalization, hosting and launch", shipped: "Language switcher and hreflang from the same content model. Live on the custom domain, over SSL, on 30 July 2026." },
      { no: "09", asked: "Testing and QA", shipped: "Cross-device and cross-browser passes before launch, then again against the live deployment." },
      { no: "10", asked: "Security hardening", shipped: "HTTPS throughout, the admin behind a signed-session guard in middleware, spam protection on every form." },
      { no: "11", asked: "CI/CD pipeline", shipped: "Git-driven builds on Vercel: every branch gets a preview URL, main goes to production." },
      { no: "12", asked: "Not in the proposal", shipped: "An llms.txt route and answer-shaped product pages, so the catalogue can be quoted by an answer engine rather than merely indexed.", extra: true },
    ],
  },
  coda: "A fitting either seals or it does not. We wanted a website with the same manners.",
} as const;

export const metadata: Metadata = {
  title: "parflow engineering , blank interfaces",
  description:
    "Case study: WordPress replaced by Next.js 16 on Vercel for Parflow Engineering , instrumentation tube fittings and valves. 99/100/100/100 on PageSpeed.",
  alternates: { canonical: "/projects/parflow-engineering" },
  openGraph: {
    title: "parflow engineering , blank interfaces",
    description: "WordPress replaced by Next.js 16 on Vercel, built to be cited by answer engines.",
    type: "article",
  },
};

/** A titled box in box-drawing characters, `width` columns wide inside. */
function box(title: string, lines: readonly string[], width: number) {
  return [
    `┌ ${title} ${"─".repeat(width - title.length - 2)}┐`,
    ...lines.map((line) => `│ ${line.padEnd(width - 1)}│`),
    `└${"─".repeat(width)}┘`,
  ];
}

function architectureTrace() {
  const { before, after } = CASE.architecture;
  const width = 32;
  const left = box(before.box, before.lines, width);
  const right = box(after.box, after.lines, width);
  const gap = (row: number) => (row === 3 ? "   ───>   " : " ".repeat(10));
  return [
    `${before.when.padEnd(width + 2)}${" ".repeat(10)}${after.when}`,
    "",
    ...left.map((line, row) => `${line}${gap(row)}${right[row]}`),
  ].join("\n");
}

function SectionHead({ id, label, heading }: { id: string; label: string; heading: string }) {
  return (
    <div className="row sec-head">
      <span className="label span-2">( {label} )</span>
      <Reveal as="h2" className="t-big">
        <span id={id}>{heading}</span>
      </Reveal>
    </div>
  );
}

export default function ParflowCaseStudy() {
  const { before, after } = CASE.architecture;
  const sides = [
    { name: "Side A", prefix: "A", items: CASE.ledger.items.slice(0, 6) },
    { name: "Side B", prefix: "B", items: CASE.ledger.items.slice(6) },
  ];

  return (
    <main className="page-top" data-hover-root>
      <header className="row case-head">
        <span className="label span-2">( Case study, 2026 )</span>
        <Reveal as="h1" className="t-mega">
          {CASE.client}
        </Reveal>
        <Reveal as="p" className="t-big start-3 span-5" delay={120}>
          {CASE.standfirst}
        </Reveal>
      </header>

      <dl className="facts">
        {CASE.facts.map((fact) => (
          <div key={fact.label}>
            <dt className="label dim">{fact.label}</dt>
            <dd className="label">
              {"href" in fact ? (
                <a href={fact.href} target="_blank" rel="noopener noreferrer">
                  {fact.value}
                </a>
              ) : (
                fact.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      <section className="case-embed" aria-label="Parflow Engineering on a laptop">
        <iframe src={CASE.embed.src} title={CASE.embed.title} allow="fullscreen; xr-spatial-tracking" loading="lazy" />
      </section>

      <section className="sec">
        <div className="row frames">
          {CASE.frames.map((frame, index) => (
            <Media
              key={frame.src}
              src={frame.src}
              alt={frame.alt}
              decode={index}
              className={`${frame.className}${frame.phone ? " phone" : ""}`}
            />
          ))}
        </div>
      </section>

      <section className="reel" aria-label="Parflow Engineering walkthrough">
        <FilmstripVideoPlayer
          videoSrc={CASE.walkthrough.src}
          frames={CASE.walkthrough.frames}
          timestamps={CASE.walkthrough.timestamps}
          markerColor="#DFEAE8"
        />
        <div className="reel-tag label">
          <span>( Walkthrough )</span>
          <span>parflowengineering.com</span>
        </div>
      </section>

      <section className="sec sec-rule" aria-labelledby="identity-title">
        <SectionHead id="identity-title" label={CASE.identity.label} heading={CASE.identity.heading} />
        <div className="row">
          <div className="start-3 span-4 mark-stage">
            <ParflowMarkEditor />
          </div>
          <Reveal as="p" className="t-body span-2">
            {CASE.identity.body}
          </Reveal>
        </div>
      </section>

      <section className="sec sec-rule" aria-labelledby="arch-title">
        <SectionHead id="arch-title" label={CASE.architecture.label} heading={CASE.architecture.heading} />
        <div className="row">
          <pre className="diagram code start-3 span-6" aria-label={`${before.box} replaced by ${after.box}`}>
            {architectureTrace()}
          </pre>
        </div>
        <div className="row notes">
          <p className="t-body start-3 span-2">{before.note}</p>
          <p className="t-body start-5 span-2">{after.note}</p>
        </div>
      </section>

      <section className="sec sec-rule" aria-labelledby="seo-title">
        <SectionHead id="seo-title" label={CASE.seo.label} heading={CASE.seo.heading} />
        <div className="row notes">
          <Reveal as="p" className="t-body start-3 span-3">
            {CASE.seo.body}
          </Reveal>
          <div className="span-1 word-list label">
            <span className="dim">Structured as</span>
            {CASE.seo.schema.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="span-1 word-list label">
            <span className="dim">Crawlers admitted</span>
            {CASE.seo.crawlers.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <div className="row notes">
          {/* Real output, trimmed. The file is generated from the catalogue,
              so it cannot drift from the product pages. */}
          <pre className="terminal code start-3 span-5">
            <b># Parflow Engineering</b>
            {"\n"}&gt; Indian manufacturer of precision instrumentation{"\n"}&gt; tube fittings and valves for critical process{"\n"}&gt; industries. Alternative to Swagelok / Parker /{"\n"}&gt; Festo / SMC.{"\n\n"}
            <b>## Products</b>
            {"\n"}- [Twin Ferrule Tube Fittings](<i>/products/twinferrule-tube-fittings</i>){"\n"}- [Double Block &amp; Bleed Valves](<i>/products/double-block-bleed-valves</i>){"\n"}- [Instrument Manifolds](<i>/products/instrument-manifolds</i>){"\n"}
            <i>… 13 more, one per product category</i>
            {"\n\n"}
            <b>## Contact</b>
            {"\n"}- Vasai, Maharashtra, India · +91 98920 81861
          </pre>
          <span className="label dim span-1">llms.txt</span>
        </div>
      </section>

      <section className="sec sec-rule" aria-labelledby="scores-title">
        <SectionHead id="scores-title" label={CASE.scores.label} heading={CASE.scores.heading} />
        <ul className="scores">
          {CASE.scores.items.map((score) => (
            <li key={score.label}>
              <span className="score">{score.value}</span>
              <span className="label">{score.label}</span>
            </li>
          ))}
        </ul>
        <p className="row label dim scores-source">
          <span className="start-3 span-6">{CASE.scores.source}</span>
        </p>
      </section>

      <section className="sec sec-rule" aria-labelledby="ledger-title">
        <SectionHead id="ledger-title" label={CASE.ledger.label} heading={CASE.ledger.heading} />
        {sides.map((side) => (
          <ol key={side.name} className="row tracklist" aria-label={side.name}>
            <li className="side t-big" aria-hidden="true">
              ( {side.name} )
            </li>
            {side.items.map((track, index) => (
              <li
                key={track.no}
                className={`track span-3 ${index % 2 === 0 ? "start-3" : "start-6 offset"}`}
              >
                <span className="label">
                  {side.prefix}
                  {index + 1}
                </span>
                <h3 className="t-big">{track.asked}</h3>
                <p className="label">{track.shipped}</p>
                <span className="label bracket">[ {"extra" in track ? "added" : "delivered"} ]</span>
              </li>
            ))}
          </ol>
        ))}
      </section>

      <section className="row coda">
        <Reveal as="blockquote" className="t-statement">
          {CASE.coda}
        </Reveal>
      </section>

      <nav className="row case-next label" aria-label="Next">
        <Link href="/projects" className="span-2">
          All projects
        </Link>
        <a href="https://parflowengineering.com" target="_blank" rel="noopener noreferrer" className="start-7 span-2">
          parflowengineering.com
        </a>
      </nav>
    </main>
  );
}
