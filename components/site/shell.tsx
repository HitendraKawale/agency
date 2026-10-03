"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { effectsFor } from "./effects";
import FooterLogo from "./footer-logo";
import { motionAllowed, setPreferences, usePreferences, type MediaMode, type Mood } from "./preferences";
import SmoothScroll from "./smooth-scroll";
import StudioClock from "./clock";

const EMAIL = "aryan@blankinterface.com";

const LINKS = [
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
] as const;

const PEOPLE = [
  { name: "Aryan Kathawale", href: "https://tldr.aryank.space" },
  { name: "Hitendra Kawale", href: "https://hitendra.dev/tldr" },
] as const;

const MOODS: ReadonlyArray<{ value: Mood; label: string }> = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

const MODES: ReadonlyArray<{ value: MediaMode; label: string }> = [
  { value: "image", label: "Image" },
  { value: "text", label: "Text" },
  { value: "pixel", label: "Pixel" },
];

type Panel = "settings" | "contact";

/** `/projects/parflow-engineering` → "case"; `/` → "home". */
function routeOf(pathname: string) {
  const [first = "", second] = pathname.split("/").filter(Boolean);
  if (!first) return "home";
  if (first === "projects" && second) return "case";
  return first;
}

/**
 * Everything around a page: Aino's fixed nav, the Settings and Contact side
 * panel, the mobile menu, Lenis, the hover scramble and sol's ASCII-logo
 * footer. The homepage hero keeps its own chrome, so the nav waits until the
 * sheet has covered it.
 */
export default function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const route = routeOf(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [panel, setPanel] = useState<Panel>("settings");
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const { appearance, mode } = usePreferences();

  // A route change closes whatever was open.
  useEffect(() => {
    panelRef.current?.close();
    menuRef.current?.close();
  }, [pathname]);

  // Home: the nav and quarter lines appear once the sheet reaches the nav.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || route !== "home") return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const sheet = root.querySelector(".home-sheet");
      const nav = root.querySelector<HTMLElement>(".nav");
      if (!sheet || !nav) return;
      const past = sheet.getBoundingClientRect().top <= nav.offsetHeight;
      root.dataset.pastHero = String(past);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete root.dataset.pastHero;
    };
  }, [route]);

  // Aino's caret hover scramble, kept off the hero, which has its own motion.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let disposers: Array<() => void> = [];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const synchronize = () => {
      for (const dispose of disposers) dispose();
      disposers = [];
      if (!motionAllowed()) return;
      const regions = root.querySelectorAll<HTMLElement>(".nav, .footer, dialog, [data-hover-root]");
      for (const region of regions) {
        const effects = effectsFor(region);
        effects.hover();
        disposers.push(() => effects.dispose());
      }
    };
    synchronize();
    reducedMotion.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);
    return () => {
      for (const dispose of disposers) dispose();
      reducedMotion.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, [pathname]);

  // /heatmap is a tuning page and gets none of this.
  if (route === "heatmap") return <>{children}</>;

  function openPanel(trigger: HTMLElement, next: Panel) {
    setPanel(next);
    setCopied("idle");
    if (menuRef.current?.open) {
      menuRef.current.close();
      returnFocusRef.current = menuTriggerRef.current;
    } else {
      returnFocusRef.current = trigger;
    }
    panelRef.current?.showModal();
  }

  function openMenu() {
    const menu = menuRef.current;
    if (!menu) return;
    menu.showModal();
    // Aino lists the links one after another, 60ms apart.
    const links = Array.from(menu.querySelectorAll<HTMLElement>("nav a"));
    const stagger = motionAllowed();
    links.forEach((link, index) => {
      link.style.opacity = stagger ? "0" : "";
      if (stagger) window.setTimeout(() => (link.style.opacity = ""), 60 * (index + 1));
    });
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied("copied");
    } catch {
      setCopied("failed");
    }
  }

  const current = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined;

  return (
    <div ref={rootRef} id="top" className="site" data-route={route}>
      <SmoothScroll />

      <div className="grid-lines" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>

      <header className="nav label">
        <div>
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
            Blank Interfaces
          </Link>
        </div>
        <div>
          <Link href="/projects" aria-current={current("/projects")}>
            Projects
          </Link>
        </div>
        <div>
          <Link href="/about" aria-current={current("/about")}>
            About
          </Link>
          <Link href="/blog" aria-current={current("/blog")}>
            Blog
          </Link>
        </div>
        <div className="end">
          <button type="button" onClick={(event) => openPanel(event.currentTarget, "settings")}>
            Settings
          </button>
          <button type="button" onClick={(event) => openPanel(event.currentTarget, "contact")}>
            Contact
          </button>
        </div>
        <div className="mobile">
          <button type="button" onClick={(event) => openPanel(event.currentTarget, "contact")}>
            Contact
          </button>
          <button type="button" ref={menuTriggerRef} onClick={openMenu} aria-haspopup="dialog">
            Menu
          </button>
        </div>
      </header>

      {children}

      <footer className="footer">
        <div className="row footer-top label">
          <div className="span-2">
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </div>
          <nav className="span-2" aria-label="Footer">
            <Link href="/projects">Projects</Link>
            <Link href="/privacy">Privacy</Link>
          </nav>
          <div className="span-2 start-7">
            <StudioClock />
          </div>
        </div>
        <FooterLogo />
        <div className="row footer-bottom label">
          <span>© 2026</span>
          <a href="#top">Back to top</a>
        </div>
      </footer>

      <dialog
        ref={panelRef}
        className="side-dialog label"
        data-panel={panel}
        data-lenis-prevent
        aria-label={panel === "settings" ? "Settings" : "Contact"}
        onClose={() => returnFocusRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) panelRef.current?.close();
        }}
      >
        <div className="dialog-header">
          <span>{panel === "settings" ? "Settings" : "Contact"}</span>
          <button type="button" onClick={() => panelRef.current?.close()}>
            Close
          </button>
        </div>
        {panel === "settings" ? (
          <>
            <div className="settings-group">
              <h2>Mood</h2>
              {MOODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={appearance === option.value}
                  onClick={() => setPreferences({ appearance: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="settings-group">
              <h2>Img</h2>
              {MODES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={mode === option.value}
                  onClick={() => setPreferences({ mode: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="contact-panel">
            <a className="contact-email" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
            <div className="actions">
              <a
                className="chip"
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Gmail
              </a>
              <button type="button" className="chip" onClick={copyEmail}>
                {copied === "copied" ? "Copied" : copied === "failed" ? "Copy failed" : "Copy email"}
              </button>
            </div>
            <div className="people">
              {PEOPLE.map((person) => (
                <a key={person.href} href={person.href}>
                  {person.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </dialog>

      <dialog
        ref={menuRef}
        className="menu-dialog"
        data-lenis-prevent
        aria-label="Menu"
        onClose={() => menuTriggerRef.current?.focus()}
      >
        <button type="button" className="menu-close label" onClick={() => menuRef.current?.close()}>
          Close
        </button>
        <nav aria-label="Menu" onClick={() => menuRef.current?.close()}>
          <Link href="/">Home</Link>
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} aria-current={current(link.href)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="menu-foot label">
          <button type="button" onClick={(event) => openPanel(event.currentTarget, "contact")}>
            Contact
          </button>
          <button type="button" onClick={(event) => openPanel(event.currentTarget, "settings")}>
            Settings
          </button>
        </div>
      </dialog>
    </div>
  );
}
