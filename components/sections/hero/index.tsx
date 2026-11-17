// Nav, headline, the row under it, and the heat car. The approved hero (mockups/art/site.html).
// Intro order: logo .15s; headline words from .5s, 35ms apart; nav links, buttons and the studio
// line from 1.15s; the artwork lifts in at 1.45s.
import { Fragment } from "react";
import { home, site } from "@/content/home";
import { Button } from "@/components/ui/button";
import { HeatMark } from "@/components/ui/heat-mark";
import { CarFrame } from "./car-frame";
import s from "./hero.module.css";

const NOIR = [0.055, 0.055, 0.055] as const;

export function Hero() {
  const { headline, line, actions, car } = home.hero;
  // superscript counts beside nav links, read from the content they point at
  const counts: Partial<Record<string, number>> = { Work: home.work.projects.length };
  return (
    <>
      <nav className={s.nav}>
        <HeatMark
          className={s.mark}
          href="#"
          aria-label={site.name}
          heat={{ ink: [1, 1, 1], bg: NOIR }}
          svgProps={{ "data-intro": "fade", "data-delay": "0.15", "data-dur": "1.4" }}
        />
        <ul className={s.links}>
          {site.nav.map((l, i) => (
            // data-intro sits on the <li>, not the link: GSAP leaves an inline opacity behind, which
            // would pin the link's tubelight flicker (globals.css) at full
            <li key={l.label} data-intro="fade" data-delay={(1.15 + i * 0.07).toFixed(2)}>
              <a className="tube" href={l.href}>
                {l.label}
                {l.label in counts && <sup>({counts[l.label]})</sup>}
              </a>
            </li>
          ))}
        </ul>
        <span className={s.contact} data-intro="fade" data-delay="1.5">
          <a className="tube" href={site.contact.href}>{site.contact.label}</a>
        </span>
      </nav>

      <h1 className={s.title} aria-label={headline}>
        {headline.split(" ").map((w, i) => (
          // spaces stay as text between the word spans, so wrapping is the same as unsplit text
          <Fragment key={i}>
            {i > 0 && " "}
            <span className={s.word} aria-hidden data-intro="fade" data-delay={(0.5 + i * 0.035).toFixed(3)} data-dur="1.2">{w}</span>
          </Fragment>
        ))}
      </h1>

      <div className={s.row}>
        <div className="actions">
          {actions.map((a, i) => (
            // GSAP fades the wrapper in; Motion owns the button inside it
            <span key={a.label} className="flex" data-intro="fade" data-delay={(1.15 + i * 0.07).toFixed(2)}>
              <Button href={a.href} label={a.label} variant={a.variant} />
            </span>
          ))}
        </div>
        <p className={s.line} data-intro="fade" data-delay="1.2">{line}</p>
      </div>

      <div className={s.panel} data-intro="lift" data-delay="1.45">
        <CarFrame src={car.src} title={car.title} />
      </div>
    </>
  );
}
