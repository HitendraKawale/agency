import type { Metadata } from "next";
import StudioClock from "@/components/site/clock";
import Media from "@/components/site/media";
import Reveal from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "about , blank interfaces",
  description:
    "Blank Interfaces is Aryan Kathawale and Hitendra Kawale, a two-person design and engineering studio working from Mumbai and the United Kingdom.",
  alternates: { canonical: "/about" },
};

const EMAIL = "aryan@blankinterface.com";

/** The founders' own photographs. */
const PEOPLE = [
  { name: "Aryan Kathawale", href: "https://tldr.aryank.space", portrait: "/team/aryan.png" },
  { name: "Hitendra Kawale", href: "https://hitendra.dev/tldr", portrait: "/team/hitendra.png" },
] as const;

const PLACES = ["Mumbai", "United Kingdom", "Remote"] as const;

export default function AboutPage() {
  return (
    <main className="page-top" data-hover-root>
      <header className="row case-head">
        <span className="label span-2">( About )</span>
        <Reveal as="h1" className="t-mega">
          About
        </Reveal>
      </header>

      <section className="row statement">
        <div className="label-stack label">
          <span>( Studio )</span>
          <span className="dim">Est. 2026</span>
        </div>
        <Reveal as="p" className="t-statement">
          <span className="indent" aria-hidden="true" />
          Blank Interfaces is the practice of Aryan Kathawale and Hitendra Kawale. We design and engineer websites and
          products, and we build them to be read by agents as carefully as by people.
        </Reveal>
      </section>

      <section className="sec sec-rule" aria-labelledby="people-title">
        <div className="row sec-head label">
          <h2 id="people-title" className="span-2">
            ( People )
          </h2>
          <span className="dim">02</span>
        </div>
        <div className="row people">
          {PEOPLE.map((person, index) => (
            <a
              key={person.name}
              href={person.href}
              className={`person span-3 ${index === 0 ? "start-1" : "start-5"}`}
            >
              <Media
                src={person.portrait}
                alt={person.name}
                decode={index}
                className="portrait"
              />
              <span className="person-meta">
                <span className="t-cell">{person.name}</span>
                <span className="label dim">tldr</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="sec sec-rule" aria-labelledby="where-title">
        <div className="row sec-head label">
          <h2 id="where-title" className="span-2">
            ( Where )
          </h2>
        </div>
        <div className="row places">
          {PLACES.map((place) => (
            <Reveal key={place} kind="scramble" className="t-cell span-2">
              {place}
            </Reveal>
          ))}
          <div className="span-2 clock-stack">
            <StudioClock />
          </div>
        </div>
      </section>

      <section className="sec sec-rule" aria-labelledby="write-title">
        <div className="row sec-head label">
          <h2 id="write-title" className="span-2">
            ( Write )
          </h2>
        </div>
        <div className="row">
          <a className="t-statement start-3 span-6 contact-line" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </div>
      </section>
    </main>
  );
}
