import HalftoneInterfaceHero from "@/components/ui/halftone-interface-hero";
import AsciiTvHero from "@/components/ui/ascii-tv-hero";
import LineRise from "@/components/ui/line-rise";

/**
 * Scroll story — halftone identity up top, a quiet library of practice and
 * projects, an ASCII TV interlude pinned mid-scroll, then philosophy, pace,
 * and contact.
 */

const NAV = [
  { label: "about", href: "#about" },
  { label: "practice", href: "#practice" },
  { label: "projects", href: "/projects" },
  { label: "philosophy", href: "#philosophy" },
  { label: "contact", href: "#contact" },
];

const UTILITY = [
  { label: "follow", href: "https://x.com/blank_spacets" },
  { label: "arth", href: "https://www.arthtechnologies.com/" },
];

const SKILLS = [
  {
    number: "01",
    title: "Product direction",
    body: "Research, scope, and a roadmap built around what should exist.",
    category: "Strategy",
  },
  {
    number: "02",
    title: "Interface design",
    body: "UX, visual systems, and motion that make complex software feel obvious.",
    category: "Design",
  },
  {
    number: "03",
    title: "Software engineering",
    body: "Web apps, platforms, and APIs engineered to survive the week after launch.",
    category: "Engineering",
  },
  {
    number: "04",
    title: "Applied AI",
    body: "Agents, retrieval, and evaluation designed as useful product behaviour.",
    category: "AI",
  },
] as const;

export default function Home() {
  return (
    <main id="top" className="min-h-full bg-black text-[#f3f3f1]">
      {/* ── Open: halftone identity ──────────────────────────────── */}
      <div className="h-[100svh] w-full overflow-hidden bg-black">
        <HalftoneInterfaceHero
          headline={["blank", "interfaces"]}
          brand={["blank", "interfaces"]}
          navigation={NAV}
          utilityLinks={UTILITY}
          footerLabel="© 2026 blank interfaces"
          locationLabel="bom / uk"
          timeZone="Europe/London"
          background="#000000"
          foreground="#f3f3f1"
          accentColors={["#ff266c", "#1cffaf", "#5848ff"]}
        />
      </div>

      {/* ── Middle: quiet library ────────────────────────────────── */}
      <section id="about" className="studio-intro" aria-labelledby="studio-title">
        <div className="section-meta" aria-hidden="true">
          <span>independent product studio</span>
          <span>mumbai · uk · remote</span>
        </div>
        <div className="studio-intro-copy">
          <LineRise>
            <h2 id="studio-title">
              We turn difficult ideas into clear, useful products.
            </h2>
          </LineRise>
          <LineRise delay={0.15}>
            <p>
              Blank Interfaces is the independent practice of Aryan Kathawale
              and Hitendra Kawale. Strategy, design, and engineering stay in
              the same room from first sketch to production — from Mumbai and
              the UK, working remotely with teams anywhere.
            </p>
          </LineRise>
        </div>
      </section>

      <section
        id="practice"
        className="library"
        aria-labelledby="practice-title"
      >
        <h2 id="practice-title" className="library-title">
          Practice
        </h2>
        <div className="library-head" aria-hidden="true">
          <span>discipline</span>
          <span>category</span>
          <span>no.</span>
        </div>
        <ol className="library-list">
          {SKILLS.map((skill, i) => (
            <li key={skill.number} className="library-row">
              <div className="library-name">
                <LineRise delay={i * 0.08}>
                  <h3>{skill.title}</h3>
                  <p>{skill.body}</p>
                </LineRise>
              </div>
              <span className="library-category">{skill.category}</span>
              <span className="library-index">{skill.number}</span>
            </li>
          ))}
        </ol>
        <p className="library-footnote">
          Selected work lives on its own page —{" "}
          <a className="page-back" href="/projects">
            projects ↗
          </a>
        </p>
      </section>

      {/* ── Interlude: ASCII TV expands mid-scroll ───────────────── */}
      <section id="watch" className="tv-break" aria-label="ASCII television">
        <AsciiTvHero
          embedded={false}
          headline={[
            "Interfaces, motion and code.",
            "One integrated practice.",
          ]}
          tailLabel="watch us do something special for you"
          scrollLength={3}
        />
      </section>

      <section
        id="philosophy"
        className="philosophy"
        aria-labelledby="philosophy-title"
      >
        <p className="section-label">philosophy</p>
        <LineRise>
          <h2 id="philosophy-title">
            We believe in quiet conviction. Work that speaks softly and
            lingers long. Interfaces as clarity, not decoration. Software that
            earns attention instead of demanding it. Create with purpose —
            everything else is noise.
          </h2>
        </LineRise>
      </section>

      <section className="story" aria-labelledby="story-title">
        <div className="story-col">
          <p className="section-label">how long it takes</p>
          <LineRise>
            <h2 id="story-title">About a month, start to ship.</h2>
          </LineRise>
        </div>
        <div className="story-col">
          <LineRise>
            <p>
              Most projects run about a month. Not because we rush — because
              we don&apos;t dilute. One project at a time, both of us on it,
              from first sketch to production.
            </p>
            <p>
              Week one finds the shape: research, scope, a working prototype.
              Weeks two and three are the build — design and engineering in
              the same room, shipping continuously. Week four is polish,
              launch, and a handover that actually holds.
            </p>
            <p>
              No account managers. No handoff theatre. No six-week discovery.
              You talk directly to the people making the thing, and you watch
              it get better every day.
            </p>
          </LineRise>
        </div>
      </section>

      <section id="contact" className="contact-strip">
        <div className="contact-strip-inner">
          <div className="contact-heading">
            <p className="section-label">start somewhere</p>
            <h2>Have a difficult idea?</h2>
            <p>Bring us the rough version.</p>
          </div>
          <ul className="contact-rows">
            <li>
              <a href="mailto:hello@aryank.space">hello@aryank.space</a>
            </li>
            <li>
              <a
                href="https://x.com/blank_spacets"
                target="_blank"
                rel="noopener noreferrer"
              >
                @blank_spacets
              </a>
            </li>
            <li>
              <a href="tel:+447818916926">+44 7818 916926</a>
            </li>
            <li>
              <a href="tel:+918421911353">+91 8421911353</a>
            </li>
          </ul>
        </div>
      </section>

      <footer className="site-footer">
        <p>© 2026 blank interfaces · mumbai / uk / remote</p>
        <a
          href="https://www.arthtechnologies.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          arth technologies
        </a>
      </footer>
    </main>
  );
}
