// Nav, headline, the row under it, and the heat car. The approved hero (mockups/art/site.html), with
// basement's nav (components/sections/nav) along the top.
// Intro order: logo .15s; headline words from .5s, 35ms apart; nav links, buttons and the studio
// line from 1.15s; the artwork lifts in at 1.45s.
import { Fragment } from "react";
import { home } from "@/content/home";
import { Button } from "@/components/ui/button";
import { Nav } from "@/components/sections/nav";
import { CarFrame } from "./car-frame";
import s from "./hero.module.css";

export function Hero() {
  const { headline, line, actions, car } = home.hero;
  return (
    <>
      <Nav current="Home" />

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
        {/* the car's first frame, until the live car has loaded and fades in over it */}
        <picture>
          <source media="(max-width: 760px)" srcSet={car.poster.tall} />
          <img src={car.poster.wide} alt="" fetchPriority="high" />
        </picture>
        <CarFrame src={car.src} title={car.title} />
      </div>
    </>
  );
}
