"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { EMAIL, TAGLINES, type StageProject } from "./data";
import { createEscFx } from "./esc-effects";
import { useStudioClock } from "./live-clock";
import { pickPhrase, scrambleText, SCRAMBLE_DESKTOP_MIN } from "./scramble";
import { createStageController } from "./stage-controller";

/**
 * /projects as artemiilebedev.com's landing: a full-bleed video per project,
 * rows that autoplay for 20 s with a white fill, the white card, a top bar
 * with a scrambled tagline and the studio clock, and the ESC effects. React
 * renders the structure once; the controller owns every state class on it.
 */

const LINKS = [
  { label: "Home", href: "/" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
] as const;

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/kiritocode1" },
  { label: "X (Twitter)", href: "https://x.com/blank_spacets" },
] as const;

function Cells({ project, live }: { project: StageProject; live: boolean }) {
  return (
    <>
      <div className="pj-name">
        <span>{project.name}</span>
        {live ? (
          project.external ? (
            <a className="pj-note" href={project.href} target="_blank" rel="noopener noreferrer" data-label="Visit site">
              {project.note}
            </a>
          ) : (
            <Link className="pj-note" href={project.href} data-label="Open case study">
              {project.note}
            </Link>
          )
        ) : (
          <span className="pj-note">{project.note}</span>
        )}
      </div>
      <div className="pj-industry">{project.industry}</div>
      <div className="pj-year">{project.year}</div>
    </>
  );
}

export default function ProjectsStage({ projects, fontClassName }: { projects: StageProject[]; fontClassName: string }) {
  const router = useRouter();
  const bgRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const rowRefs = useRef<Array<HTMLLIElement | null>>([]);
  const captionRef = useRef<HTMLSpanElement>(null);
  const escRef = useRef<ReturnType<typeof createEscFx> | null>(null);
  const [copied, setCopied] = useState(false);
  const [sitemap, setSitemap] = useState(false);
  const { time, zone } = useStudioClock();

  // Rows, videos and the 20 s autoplay.
  useEffect(() => {
    const bg = bgRef.current;
    const swipeRoot = featuresRef.current;
    const items = itemRefs.current.filter((item): item is HTMLDivElement => item !== null);
    const rows = rowRefs.current.filter((row): row is HTMLLIElement => row !== null);
    if (!bg || !swipeRoot || items.length !== projects.length || rows.length !== projects.length) return;
    const controller = createStageController({
      bg,
      swipeRoot,
      items,
      rows,
      sources: projects.map((project) => project.video),
      // A second click on the active row's name opens its case study.
      onActiveRowClick: (index, target) => {
        const project = projects[index];
        if (!project || project.external || !target.closest(".pj-name")) return false;
        router.push(project.href);
        return true;
      },
    });
    return () => controller.destroy();
  }, [projects, router]);

  // ESC effects overlay and key handler.
  useEffect(() => {
    const fx = createEscFx();
    escRef.current = fx;
    return () => {
      fx.destroy();
      escRef.current = null;
    };
  }, []);

  // A tagline per load, scrambled in on desktop as theirs is.
  useEffect(() => {
    const caption = captionRef.current;
    if (!caption) return;
    const phrase = pickPhrase(TAGLINES, "blank-projects-caption");
    const scramble =
      window.innerWidth >= SCRAMBLE_DESKTOP_MIN && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!scramble) {
      caption.textContent = phrase;
      caption.classList.add("is-done");
      return;
    }
    return scrambleText(caption, phrase, "");
  }, []);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  }

  const linkList = (
    <>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          className="pj-link pj-txt--caps"
          href={link.href}
          aria-current={link.href === "/projects" ? "page" : undefined}
          onClick={() => setSitemap(false)}
        >
          {link.label}
        </Link>
      ))}
      <a className="pj-link pj-txt--caps" href={`mailto:${EMAIL}`}>
        Contact
      </a>
    </>
  );

  return (
    <main className={`pj ${fontClassName}`}>
      <div ref={bgRef} className="pj-bg" aria-hidden="true">
        <div className="pj-videos">
          <div className="pj-flex">
            {projects.map((project, index) => (
              <div
                key={project.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                className="pj-item"
              >
                <video className="pj-video" muted loop playsInline preload="none" poster={project.poster ?? undefined} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pj-hero">
        <div ref={featuresRef} className="pj-features">
          <div className="pj-tag">
            <span className="pj-tag-chip pj-txt--caps">Selected work</span>
          </div>
          <div className="pj-list-wrap">
            <div>
              <ul className="pj-list pj-txt--caps">
                {projects.map((project, index) => (
                  <li
                    key={project.id}
                    ref={(node) => {
                      rowRefs.current[index] = node;
                    }}
                    className="pj-row"
                    data-label={`Play ${project.name}`}
                  >
                    <span className="pj-progress" aria-hidden="true" />
                    <div className="pj-line">
                      <div className="pj-layer pj-layer--white">
                        <Cells project={project} live />
                      </div>
                      <div className="pj-layer pj-layer--black" aria-hidden="true">
                        <Cells project={project} live={false} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <nav className="pj-menu" aria-label="Site">
        <div className="pj-box">
          <div className="pj-top-side">
            <div className="pj-title">
              <span className="pj-txt--caps">Blank Interfaces</span>
              <span className="pj-cap">Design &amp; engineering studio</span>
            </div>
            <div className="pj-flex-menu">
              <div className="pj-links">
                {linkList}
                <button type="button" className="pj-hamburger pj-txt--caps" onClick={() => setSitemap((open) => !open)}>
                  {sitemap ? "Close" : "Menu"}
                </button>
              </div>
            </div>
          </div>
          <div className="pj-bottom-side">
            <div className="pj-counts">
              <span className="pj-count-chip">{projects.length}</span>
              <span className="pj-cap">Live projects</span>
            </div>
            <div className="pj-commission">
              <span className="pj-cap">Commissions</span>
              <button type="button" className="pj-email pj-txt--caps" onClick={copyEmail} data-label="Copy email">
                {copied ? "Copied to clipboard" : EMAIL}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pj-topbar pj-txt--caps">
        <div className="pj-flex-top">
          <span ref={captionRef} className="pj-caption" />
          <div className="pj-time-city">
            <span>Mumbai &amp; the UK</span>
            <div className="pj-time" suppressHydrationWarning>
              <span>{time}</span>
              <span>{zone}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pj-bar">
        <div className="pj-flex-bottom">
          <div className="pj-effects">
            <button type="button" className="pj-linkmenu pj-effects-hint" onClick={() => escRef.current?.toggle()}>
              Press Esc for effects (?)
            </button>
          </div>
          <div className="pj-socials">
            {SOCIALS.map((social) => (
              <a key={social.href} className="pj-linkmenu" href={social.href} target="_blank" rel="noopener noreferrer">
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className={`pj-overlay${sitemap ? " is-open" : ""}`} onClick={() => setSitemap(false)} />
      <div className={`pj-sitemap${sitemap ? " is-open" : ""}`}>
        <div className="pj-sitemap-ver">
          <div className="pj-sitemap-title pj-txt--caps">Sitemap</div>
          <div className="pj-sitemap-list">{linkList}</div>
        </div>
      </div>
    </main>
  );
}
