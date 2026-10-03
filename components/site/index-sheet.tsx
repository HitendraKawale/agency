import Link from "next/link";
import { PROJECTS } from "./projects";
import Reveal from "./reveal";

/**
 * The site's table of contents set as the Swiss poster in the brief: heavy
 * capitals in the cells of a quartered sheet, a justified citation block in
 * the bottom right. Every line in it is a fact from elsewhere on the site.
 */

const CELLS = [
  { href: "/projects/parflow-engineering", lines: ["Parflow", "Engineering", "Case study"] },
  { href: "/projects", lines: ["Projects", `( ${String(PROJECTS.length).padStart(2, "0")} )`] },
  { href: "/about", lines: ["About", "Aryan Kathawale", "Hitendra Kawale"] },
  { href: "/blog", lines: ["Blog"] },
] as const;

const PLACES = ["Mumbai", "United Kingdom", "Remote", "Est. 2026"] as const;

const COLOPHON = [
  "Kathawale, Aryan and Hitendra Kawale, 2026",
  "Design and engineering for agents and humans",
  "Parflow Engineering, Vasai, shipped 30 July 2026",
  "Next.js 16 on Vercel, Lighthouse 99 100 100 100",
  "aryan@blankinterface.com, Mumbai and the UK",
] as const;

export default function IndexSheet() {
  return (
    <nav className="index-sheet" aria-label="Contents" data-hover-root>
      {CELLS.map((cell) => (
        <Link key={cell.href} href={cell.href} className="cell">
          <Reveal kind="scramble" className="t-cell">
            {cell.lines.map((line) => (
              <span key={line} style={{ display: "block" }}>
                {line}
              </span>
            ))}
          </Reveal>
        </Link>
      ))}
      {PLACES.map((place) => (
        <div key={place} className="cell">
          <Reveal kind="scramble" className="t-cell">
            {place}
          </Reveal>
        </div>
      ))}
      <div className="cell bottom">
        <Reveal kind="scramble" className="t-cell">
          Blank Interfaces
        </Reveal>
      </div>
      <div className="cell bottom">
        <Reveal kind="scramble" className="t-cell">
          ©
        </Reveal>
      </div>
      <div className="cell bottom colophon">
        <Reveal kind="scramble" className="t-cell">
          {COLOPHON.map((line) => (
            <span key={line} style={{ display: "block" }}>
              {line}
            </span>
          ))}
        </Reveal>
      </div>
    </nav>
  );
}
