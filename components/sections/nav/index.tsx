// basement's nav, shared by every page: the wordmark, the page links with their counts, Online and
// Contact Us. `current` marks the page the visitor is on.
// Intro order (lib/motion/choreography.ts): logo .15s; links from 1.15s, 70ms apart; the right side 1.5s.
import { home, site } from "@/content/home";
import { HeatMark } from "@/components/ui/heat-mark";
import { Online } from "./online";
import s from "./nav.module.css";

const NOIR = [0.055, 0.055, 0.055] as const;

export function Nav({ current }: { current?: (typeof site.nav)[number]["label"] }) {
  // superscript counts beside nav links, read from the content they point at
  const counts: Partial<Record<string, number>> = { Showcase: home.work.projects.length };
  return (
    <nav className={s.nav}>
      <HeatMark
        className={s.mark}
        href="/"
        aria-label={site.name}
        heat={{ ink: [1, 1, 1], bg: NOIR }}
        svgProps={{ "data-intro": "fade", "data-delay": "0.15", "data-dur": "1.4" }}
      />
      <ul className={s.links}>
        {site.nav.map((l, i) => (
          // data-intro sits on the <li>, not the link: GSAP leaves an inline opacity behind, which
          // would pin the link's tubelight flicker (globals.css) at full
          <li key={l.label} data-intro="fade" data-delay={(1.15 + i * 0.07).toFixed(2)}>
            <a className="tube" href={l.href} aria-current={l.label === current ? "page" : undefined}>
              {l.label}
              {l.label in counts && <sup>({counts[l.label]})</sup>}
            </a>
          </li>
        ))}
      </ul>
      <div className={s.end} data-intro="fade" data-delay="1.5">
        <Online className={s.online} tipClassName={s.tip} />
        <a className="tube" href={site.contact.href}>{site.contact.label}</a>
      </div>
    </nav>
  );
}
