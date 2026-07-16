import HalftoneInterfaceHero from "@/components/ui/halftone-interface-hero";
import AsciiTvHero from "@/components/ui/ascii-tv-hero";

/**
 * Scroll story — two interactive bookends with an editorial practice between:
 * 1. Halftone Interface Hero (identity)
 * 2. Studio practice and selected work
 * 3. ASCII TV Hero (finale)
 */

const NAV = [
  { label: "about", href: "#about" },
  { label: "practice", href: "#practice" },
  { label: "watch", href: "#watch" },
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
    body: "Research, scope, architecture, and a roadmap built around what should exist — not just what could.",
    tags: "Strategy / Research / Prototyping",
  },
  {
    number: "02",
    title: "Interface design",
    body: "Product UX, visual systems, and motion that make complex software feel obvious in the hand.",
    tags: "UX / UI / Design systems / Motion",
  },
  {
    number: "03",
    title: "Software engineering",
    body: "Web apps, platforms, APIs, and integrations engineered to survive the week after launch.",
    tags: "Web / Mobile / Backend / Infrastructure",
  },
  {
    number: "04",
    title: "Applied AI",
    body: "Agents, retrieval, evaluation, and automation designed as useful product behaviour — not a demo bolted on top.",
    tags: "Agents / RAG / Evals / Automation",
  },
] as const;

export default function Home() {
  return (
    <main id="top" className="min-h-full bg-[#121212] text-[#f3f3f1]">
      {/* ── Open: halftone identity ──────────────────────────────── */}
      <div className="h-[100svh] w-full overflow-hidden bg-[#121212]">
        <HalftoneInterfaceHero
          headline={["blank", "interfaces"]}
          brand={["blank", "interfaces"]}
          navigation={NAV}
          utilityLinks={UTILITY}
          footerLabel="© 2026 blank interfaces"
          locationLabel="ldn / bom"
          timeZone="Europe/London"
          background="#121212"
          foreground="#f3f3f1"
          accentColors={["#ff266c", "#1cffaf", "#5848ff"]}
        />
      </div>

      {/* ── Middle: what the studio can do ─────────────────────── */}
      <section id="about" className="studio-intro" aria-labelledby="studio-title">
        <div className="section-meta" aria-hidden="true">
          <span>independent product studio</span>
          <span>london / mumbai</span>
        </div>
        <div className="studio-intro-copy">
          <h2 id="studio-title">
            We turn difficult ideas into clear, useful products.
          </h2>
          <p>
            Blank Interfaces is the independent practice of Aryan Kathawale
            and Hitendra Kawale. Strategy, design, and engineering stay in the
            same room from first sketch to production.
          </p>
        </div>
        <p className="studio-method">
          two people <span>→</span> one integrated practice <span>→</span> no
          handoff theatre
        </p>
      </section>

      <section
        id="practice"
        className="practice"
        aria-labelledby="practice-title"
      >
        <div className="practice-heading">
          <p className="section-label">what we do</p>
          <h2 id="practice-title">From the question to the shipped thing.</h2>
          <p>
            Bring us the knotty part. We find the right shape, make it legible,
            and build it properly.
          </p>
        </div>

        <ol className="skill-list">
          {SKILLS.map((skill) => (
            <li key={skill.number} className="skill-row">
              <span className="skill-number">{skill.number}</span>
              <h3>{skill.title}</h3>
              <p>{skill.body}</p>
              <span className="skill-tags">{skill.tags}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="working-notes" aria-labelledby="working-title">
        <div className="working-notes-heading">
          <p className="section-label">how we behave</p>
          <h2 id="working-title">Good work. Low ceremony.</h2>
        </div>
        <div className="working-notes-grid">
          <p>
            AI is in the workflow. So are taste, tests, and a human who picks
            up the phone.
          </p>
          <p>
            We do not need six discovery workshops to learn that your login is
            broken.
          </p>
          <p>
            One em dash survived the edit. It knows what it did.
          </p>
          <p>
            Yes, we ship on Fridays. The deploy button also works on Mondays.
          </p>
        </div>
      </section>

      <section className="work-note" aria-labelledby="work-title">
        <p className="section-label">one already out there</p>
        <div className="work-note-main">
          <h2 id="work-title">
            <a
              href="https://www.arthtechnologies.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              arthtechnologies.com
              <span aria-hidden="true">↗</span>
            </a>
          </h2>
          <p>One of our projects. More are taking shape, quietly.</p>
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

      {/* ── Close: ASCII TV finale ───────────────────────────────── */}
      <section
        id="watch"
        className="finale"
        aria-label="ASCII television finale"
      >
        <AsciiTvHero
          headline={[
            "Interfaces, motion and code.",
            "One integrated practice.",
          ]}
          tailLabel="watch us do something special for you"
          scrollLength={3}
        />
      </section>

      <footer className="site-footer">
        <p>© 2026 blank interfaces</p>
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
