import type { Metadata } from "next";
import Link from "next/link";
import LineRise from "@/components/ui/line-rise";
import ParflowMarkEditor from "@/components/ui/parflow-mark-editor";
import ScoreRing from "@/components/ui/score-ring";

/**
 * Parflow Engineering , case study.
 *
 * Facts come from the parflow-engineering project record and proposal PF-01:
 * instrumentation tube fittings & valves, Vasai; WordPress/Elementor replaced
 * by Next.js 16 + Tailwind v4 on Vercel; 16 product families; shipped
 * 2026-07-30. Stack logos are sourced from the svgl API and vendored into
 * public/logos so the page has no third-party runtime dependency.
 */

const CASE = {
  client: "Parflow Engineering",
  eyebrow: "case study , 2026",
  standfirst:
    " We rebuilt the company's website from a WordPress theme into a product.",
  embed: {
    src: "https://embed.mckp.live/embed.html?uid=413939d5-2b4e-480f-989f-d8d71cea9294&cursor-range=1-50-1-50&click-range=8-8-7-7&camera-zoom=30",
    title: "Parflow Engineering",
  },
  facts: [
    { label: "client", value: "Parflow Engineering" },
    { label: "field", value: "Industrial Engineering website" },
    { label: "based", value: "Vasai, Maharashtra" },
    { label: "shipped", value: "30 July 2026" },
    {
      label: "live",
      value: "parflowengineering.com",
      href: "https://parflowengineering.com",
    },
  ],
  identity: {
    label: "Ideation",
    heading: "What makes this website what it is now.",
    body: "This website was genuinely maximalist and hard to ideate, but back and forth and inspiration from other sites made it possible",
    hint: "design of page heavily inspired from this logo",
  },
  architecture: {
    label: "architecture",
    heading: "Comfort + speed",
    before: {
      when: "until july 2026",
      chips: [{ name: "WordPress", logo: "/logos/wordpress.svg" }],
      note: "A bought theme and a page builder on a single shared host. Plugin weight, no control over metadata, demo copy still in the footer.",
    },
    after: {
      when: "since 30 july 2026",
      chips: [
        { name: "Next.js 16", logo: "/logos/nextjs.svg" },
        { name: "React", logo: "/logos/react.svg" },
        { name: "TypeScript", logo: "/logos/typescript.svg" },
        { name: "Tailwind v4", logo: "/logos/tailwindcss.svg" },
        { name: "Vercel", logo: "/logos/vercel.svg" },
        { name: "Neon", logo: "/logos/neon.svg" },
      ],
      note: "All products generated from one typed catalogue, server-rendered, deployed to the edge, with an admin the team owns.",
    },
  },
  seo: {
    label: "seo , aeo",
    heading: "Indexed is the floor. Cited is the point.",
    body: "Every product page states the definition, the operating principle, the specification and the questions a buyer actually asks , then says the same thing again in a form a machine can quote without guessing.",
    schemaLabel: "structured as",
    schema: [
      "Organization",
      "Product",
      "FAQPage",
      "BreadcrumbList",
      "BlogPosting",
      "JobPosting",
    ],
    crawlersLabel: "crawlers explicitly admitted",
    crawlers: [
      "GPTBot",
      "ClaudeBot",
      "PerplexityBot",
      "OAI-SearchBot",
      "Google-Extended",
      "Bingbot",
    ],
    specCaption: "parflowengineering.com/llms.txt contains all the catalogue of all the llm surfaces",
  },
  ledger: {
    label: "the ledger",
    heading: "A proposal is a promise, we delivered",
    note: "here is a list of things we fixed and added.",
    items: [
      {
        no: "01",
        asked: "Architecture and system design",
        shipped:
          "Next.js 16 App Router on Vercel. The admin never loads the animation runtime; the public site never loads the admin.",
      },
      {
        no: "02",
        asked: "Design and UX rebuild",
        shipped:
          "A custom system , black capitals, blue accent, chamfered-octagon line art , and a component library the team recombines instead of redraws.",
      },
      {
        no: "03",
        asked: "Frontend engineering",
        shipped:
          "Server-rendered semantic markup, optimized fonts and images, one motion runtime rather than a plugin per effect.",
      },
      {
        no: "04",
        asked: "Content platform and CRM",
        shipped:
          "An admin for blog, products, careers and enquiries. Enquiries move through a pipeline instead of an inbox.",
      },
      {
        no: "05",
        asked: "Database setup and administration",
        shipped:
          "A managed Neon database with typed schema and migrations for posts, products and submissions.",
      },
      {
        no: "06",
        asked: "SEO and metadata system",
        shipped:
          "Per-page metadata from the content model. JSON-LD for Organization, Product, FAQPage and Breadcrumbs, plus generated sitemap and robots.",
      },
      {
        no: "07",
        asked: "Accessibility, WCAG 2.2 AA",
        shipped:
          "Semantic structure, keyboard paths and AA contrast. Scored 100 on Lighthouse accessibility.",
      },
      {
        no: "08",
        asked: "Internationalization, hosting and launch",
        shipped:
          "Language switcher and hreflang from the same content model. Live on the custom domain, over SSL, on 30 July 2026.",
      },
      {
        no: "09",
        asked: "Testing and QA",
        shipped:
          "Cross-device and cross-browser passes before launch, then again against the live deployment.",
      },
      {
        no: "10",
        asked: "Security hardening",
        shipped:
          "HTTPS throughout, the admin behind a signed-session guard in middleware, spam protection on every form.",
      },
      {
        no: "11",
        asked: "CI/CD pipeline",
        shipped:
          "Git-driven builds on Vercel: every branch gets a preview URL, main goes to production.",
      },
      {
        no: "12",
        asked: "Not in the proposal",
        shipped:
          "An llms.txt route and answer-shaped product pages, so the catalogue can be quoted by an answer engine rather than merely indexed.",
        extra: true,
      },
    ],
  },
  scores: {
    label: "measured",
    heading: "You can measure some of it.",
    items: [
      { value: 99, label: "Performance" },
      { value: 100, label: "Accessibility" },
      { value: 100, label: "Best practices" },
      { value: 100, label: "SEO" },
      { value: 100, display: "3/3", label: "Agentic browsing" },
    ],
    source:
      "Google PageSpeed Insights · desktop · parflowengineering.com · July 2026",
  },
  coda: {
    text: "A fitting either seals or it does not. We wanted a website with the same manners.",
    attribution: "blank interfaces , on the Parflow rebuild",
  },
} as const;

export const metadata: Metadata = {
  title: "parflow engineering , blank interfaces",
  description:
    "Case study: WordPress replaced by Next.js 16 on Vercel for Parflow Engineering , instrumentation tube fittings and valves. 99/100/100/100 on PageSpeed.",
  openGraph: {
    title: "parflow engineering , blank interfaces",
    description:
      "WordPress replaced by Next.js 16 on Vercel, built to be cited by answer engines.",
    type: "article",
  },
};

export default function ParflowCaseStudy() {
  const { before, after } = CASE.architecture;

  return (
    <main className="min-h-[100svh] bg-black text-[#f3f3f1]">
      {/* ── Hero: the mockup drowns into the page ────────────────── */}
      <section className="case-hero" aria-labelledby="case-title">
        <iframe
          className="case-hero-media"
          src={CASE.embed.src}
          title={CASE.embed.title}
          allow="fullscreen; xr-spatial-tracking"
        />
        <div className="case-hero-veil" aria-hidden="true" />

        <header className="page-header case-hero-header">
          <Link href="/">blank interfaces</Link>
          <span>mumbai · uk · remote</span>
        </header>

        <div className="case-hero-copy">
          <LineRise>
            <p className="section-label">{CASE.eyebrow}</p>
            <h1 id="case-title" className="case-title">
              {CASE.client}
            </h1>
          </LineRise>
          <LineRise delay={0.12}>
            <p className="case-standfirst">{CASE.standfirst}</p>
          </LineRise>
        </div>
      </section>

      {/* ── Facts ────────────────────────────────────────────────── */}
      <section className="case" aria-label="Project facts">
        <dl className="case-facts">
          {CASE.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>
                {"href" in fact ? (
                  <a
                    className="page-back"
                    href={fact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {fact.value} <span aria-hidden="true">↗</span>
                  </a>
                ) : (
                  fact.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Identity: the live mark ──────────────────────────────── */}
      <section className="case case-section" aria-labelledby="identity-title">
        <p className="section-label">{CASE.identity.label}</p>
        <LineRise>
          <h2 id="identity-title">{CASE.identity.heading}</h2>
        </LineRise>
        <div className="mark-split">
          <ParflowMarkEditor />
          <div>
            <LineRise>
              <p className="stack-note" style={{ maxWidth: "34ch" }}>
                {CASE.identity.body}
              </p>
            </LineRise>
          </div>
        </div>
      </section>

      {/* ── Architecture ─────────────────────────────────────────── */}
      <section className="case case-section" aria-labelledby="arch-title">
        <p className="section-label">{CASE.architecture.label}</p>
        <LineRise>
          <h2 id="arch-title">{CASE.architecture.heading}</h2>
        </LineRise>

        <div className="stack-swap">
          <div className="stack-before">
            <p className="stack-when">{before.when}</p>
            <ul className="stack-chips">
              {before.chips.map((chip) => (
                <li key={chip.name} className="stack-chip">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={chip.logo} alt="" width={17} height={17} />
                  {chip.name}
                </li>
              ))}
            </ul>
            <p className="stack-note">{before.note}</p>
          </div>

          <div className="stack-arrow" aria-hidden="true">
            →
          </div>

          <div className="stack-after">
            <p className="stack-when">{after.when}</p>
            <ul className="stack-chips">
              {after.chips.map((chip) => (
                <li key={chip.name} className="stack-chip">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={chip.logo} alt="" width={17} height={17} />
                  {chip.name}
                </li>
              ))}
            </ul>
            <p className="stack-note">{after.note}</p>
          </div>
        </div>
      </section>

      {/* ── SEO / AEO ────────────────────────────────────────────── */}
      <section className="case case-section" aria-labelledby="seo-title">
        <p className="section-label">{CASE.seo.label}</p>
        <LineRise>
          <h2 id="seo-title">{CASE.seo.heading}</h2>
        </LineRise>

        <div className="seo-split">
          <div>
            <LineRise>
              <p className="stack-note" style={{ maxWidth: "38ch" }}>
                {CASE.seo.body}
              </p>
            </LineRise>

            <p className="tag-label">{CASE.seo.schemaLabel}</p>
            <ul className="tag-group">
              {CASE.seo.schema.map((t) => (
                <li key={t} className="tag">
                  {t}
                </li>
              ))}
            </ul>

            <p className="tag-label">{CASE.seo.crawlersLabel}</p>
            <ul className="tag-group">
              {CASE.seo.crawlers.map((t) => (
                <li key={t} className="tag">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div>
            {/* Real output, trimmed , the file is generated from the catalogue,
                so it cannot drift from the product pages. */}
            <div className="spec">
              <pre>
                <b># Parflow Engineering</b>
                {"\n"}
                &gt; Indian manufacturer of precision instrumentation{"\n"}
                &gt; tube fittings and valves for critical process{"\n"}
                &gt; industries. Alternative to Swagelok / Parker /{"\n"}
                &gt; Festo / SMC.{"\n\n"}
                <b>## Products</b>
                {"\n"}- [Twin Ferrule Tube Fittings](
                <i>/products/twinferrule-tube-fittings</i>){"\n"}- [Double Block
                &amp; Bleed Valves](<i>/products/double-block-bleed-valves</i>)
                {"\n"}- [Instrument Manifolds](<i>/products/instrument-manifolds</i>
                ){"\n"}
                <em> … 13 more, one per product family</em>
                {"\n\n"}
                <b>## Contact</b>
                {"\n"}- Vasai, Maharashtra, India · +91 98920 81861
              </pre>
            </div>
            <p className="spec-cap">{CASE.seo.specCaption}</p>
          </div>
        </div>
      </section>

      {/* ── Scores ───────────────────────────────────────────────── */}
      <section className="case case-section" aria-labelledby="scores-title">
        <p className="section-label">{CASE.scores.label}</p>
        <LineRise>
          <h2 id="scores-title">{CASE.scores.heading}</h2>
        </LineRise>
        <ul className="case-scores">
          {CASE.scores.items.map((score) => (
            <ScoreRing
              key={score.label}
              value={score.value}
              display={"display" in score ? score.display : undefined}
              label={score.label}
            />
          ))}
        </ul>
        <p className="score-source">{CASE.scores.source}</p>
      </section>

      {/* ── The ledger: promised vs delivered ────────────────────── */}
      <section className="case case-section" aria-labelledby="ledger-title">
        <p className="section-label">{CASE.ledger.label}</p>
        <LineRise>
          <h2 id="ledger-title">{CASE.ledger.heading}</h2>
        </LineRise>
        <ol className="ledger">
          <li className="ledger-head" aria-hidden="true">
            <span>no.</span>
            <span>asked for</span>
            <span>delivered</span>
          </li>
          {CASE.ledger.items.map((row) => (
            <li key={row.no} className={"extra" in row ? "is-extra" : undefined}>
              <span className="ledger-no">{row.no}</span>
              <p className="ledger-asked">{row.asked}</p>
              <p className="ledger-shipped">{row.shipped}</p>
            </li>
          ))}
        </ol>
        <p className="library-footnote">{CASE.ledger.note}</p>
      </section>

      {/* ── Coda ─────────────────────────────────────────────────── */}
      <section className="case case-quote">
        <figure>
          <LineRise>
            <blockquote>{CASE.coda.text}</blockquote>
          </LineRise>
          <figcaption>{CASE.coda.attribution}</figcaption>
        </figure>
      </section>

      {/* ── Next ─────────────────────────────────────────────────── */}
      <section className="case case-next">
        <Link href="/projects">
          All projects <span aria-hidden="true">↗</span>
        </Link>
        <a className="page-back" href="mailto:hello@aryank.space">
          hello@aryank.space
        </a>
      </section>

      <footer className="site-footer">
        <p>© 2026 blank interfaces · mumbai / uk / remote</p>
        <Link href="/projects">back to projects</Link>
      </footer>
    </main>
  );
}
