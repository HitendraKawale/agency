import HalftoneInterfaceHero from "@/components/ui/halftone-interface-hero";
import TerminalTextReveal from "@/components/ui/terminal-text-reveal";
import AsciiTvHero from "@/components/ui/ascii-tv-hero";

/**
 * Scroll story — three registry components, adapted only via public APIs:
 * 1. Halftone Interface Hero (identity)
 * 2. Terminal Text Reveal (editorial middle)
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

/** Coding / engineering stills (Unsplash — hotlinked, cover-cropped by the component). */
const IMG = {
  intro:
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=2000&q=80",
  banner:
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=2000&q=80",
  agentic:
    "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80",
  interfaces:
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
  platform:
    "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1600&q=80",
  delivery:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
} as const;

const SERVICES = [
  {
    title: "Product & research",
    body: "We start by pinning the problem, the user, and the success metric. That means interviews, competitive scans, and a roadmap you can actually defend — so engineering never builds the wrong thing because the brief was vague.",
    image: IMG.agentic,
  },
  {
    title: "Interfaces & systems",
    body: "We design and implement the UI: design systems, interaction models, motion, and accessibility. Screens that stay coherent across releases, and feel intentional when someone uses them every day — not a pile of one-off mockups.",
    image: IMG.interfaces,
  },
  {
    title: "Software & AI",
    body: "We ship web apps, APIs, and agentic systems that hold up in production. That includes LLM platforms, retrieval pipelines, evaluation hooks, and the boring parts — auth, caching, monitoring — so the product still works after launch week.",
    image: IMG.platform,
  },
  {
    title: "How we work",
    body: "Projects run as frame, slice, and ship: lock outcomes first, cut vertical pieces that can go live, then reassemble with the same people still on the hook. No handoff graveyard between design and code. Client work also goes through ARTH when you need a full product team on the ground.",
    image: IMG.delivery,
  },
];

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

      {/* ── Middle: terminal text reveal (registry) ─────────────── */}
      <div id="about">
        <div id="practice">
          <TerminalTextReveal
            introImage={IMG.intro}
            bannerImage={IMG.banner}
            headline="We build software people can use"
            intro="Blank Interfaces is a small agency founded by Aryan Kathawale and Hitendra Kawale. We take products from unclear idea to shipped interface and backend — strategy, design, and engineering in the same loop. If you need a team that can own the brief and the pull request, that is us."
            services={SERVICES}
            outro="Looking for clients. Tell us what you are building."
            backgroundColor="#0a0a0a"
            foregroundColor="#f3f3f1"
            initialColor="#5c5c5c"
            accentColor="#1cffaf"
            finalColor="#f3f3f1"
          />
        </div>
      </div>

      <section id="contact" className="contact-strip">
        <div className="contact-strip-inner">
          <p className="contact-kicker">contact</p>
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
