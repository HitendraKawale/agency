"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { CommandButton } from "@/components/evil-buttons/command-button";

export interface HalftoneHeroLink {
  label: string;
  href: string;
}

export interface HalftoneInterfaceHeroProps {
  headline?: [string, string];
  navigation?: HalftoneHeroLink[];
  utilityLinks?: HalftoneHeroLink[];
  brand?: [string, string];
  footerLabel?: string;
  locationLabel?: string;
  timeZone?: string;
  background?: string;
  foreground?: string;
  className?: string;
}

const BUTTON_CLASS = "flex items-center gap-2 rounded-md bg-[var(--button-bg)] p-2 text-sm font-light leading-snug text-[var(--fg)] backdrop-blur-md transition-colors duration-300 ease-out";
const KBD_CLASS = "font-mono text-[11px] font-normal leading-none opacity-60";
const CONTACT_EMAIL = "hello@aryank.space";
const DEFAULT_NAVIGATION = [
  { label: "projects", href: "/projects" },
  { label: "about us", href: "/about" },
  { label: "blog", href: "/blog" },
  { label: "contact", href: `mailto:${CONTACT_EMAIL}` },
];

function contact() {
  window.location.href = `mailto:${CONTACT_EMAIL}`;
}

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/** The source animation owns its document, so its timers cannot survive a hero unmount. */
export default function HalftoneInterfaceHero({
  navigation = DEFAULT_NAVIGATION,
  utilityLinks = [],
  background = "#ECECE8",
  foreground = "#111111",
  className = "",
}: HalftoneInterfaceHeroProps) {
  const router = useRouter();
  // Retain the contents while the native dialog finishes its closing transition.
  const [{ panel, isOpen }, setDialog] = useState<{
    panel: "menu" | "search" | null;
    isOpen: boolean;
  }>({ panel: null, isOpen: false });
  const [query, setQuery] = useState("");
  const [activeResult, setActiveResult] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true,
  );
  const entries = navigation.map((link) => ({ ...link, detail: "" }));
  const results = entries.filter((entry) =>
    `${entry.label} ${entry.detail} ${entry.href}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const selectedIndex = Math.min(activeResult, Math.max(0, results.length - 1));

  function openSearch() {
    setQuery("");
    setActiveResult(0);
    setDialog({ panel: "search", isOpen: true });
  }

  function closePanel() {
    setDialog((dialog) => ({ ...dialog, isOpen: false }));
  }

  function visit(href: string) {
    closePanel();
    if (href.startsWith("mailto:")) {
      window.location.assign(href);
      return;
    }
    router.push(href);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) dialog.showModal();
      if (panel === "search") inputRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [panel, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const target = event.target;
      if (event.metaKey || event.ctrlKey || event.altKey ||
        target instanceof HTMLElement && target.closest("input, textarea, select, [contenteditable=true]")) return;
      if (key === "k") {
        event.preventDefault();
        setQuery("");
        setActiveResult(0);
        setDialog((dialog) => ({ panel: "search", isOpen: !(dialog.panel === "search" && dialog.isOpen) }));
      } else if (key === "c") {
        event.preventDefault();
        contact();
      } else if (key === "escape") {
        setDialog((dialog) => ({ ...dialog, isOpen: false }));
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <section className={`hih-root ${className}`} style={{ background, color: foreground }} aria-label="Blank Interfaces">
      <style>{styles}</style>
      <header className="hih-header">
        <h1 className="hih-wordmark">
          <a href="#top" aria-label="Blank Interfaces home">
            <Image src="/blank-interfaces-lockup.svg" alt="Blank Interfaces" width={1045} height={575} preload />
          </a>
        </h1>
        <CommandButton
          shortcut="m"
          onCommand={() => setDialog((dialog) => ({ panel: "menu", isOpen: !(dialog.panel === "menu" && dialog.isOpen) }))}
          className="hih-command-button hih-menu-trigger"
          aria-label="Open menu"
          aria-expanded={panel === "menu" && isOpen}
          aria-controls="hero-dialog"
          aria-keyshortcuts="M"
          onClick={() => setDialog({ panel: "menu", isOpen: true })}
        >
          Menu
        </CommandButton>
      </header>

      <div className="hih-animation">
        {reducedMotion ? (
          <p className="hih-static">Context is not stored in a single location. It emerges from interactions between many tokens.</p>
        ) : (
          <iframe src="/animations/self-attention/index.html" title="Token generation and attention visualization" className="hih-animation-frame" />
        )}
      </div>
      <p className="hih-caption">Autoregressive generation predicts token fragments, with attention links showing context behind each choice.</p>
      <div className="hih-find">
        <CommandButton
          shortcut="mod+k"
          onCommand={() => {
            setQuery("");
            setActiveResult(0);
            setDialog((dialog) => ({ panel: "search", isOpen: !(dialog.panel === "search" && dialog.isOpen) }));
          }}
          className="hih-command-button"
          aria-label="Find on this site"
          aria-haspopup="dialog"
          aria-controls="hero-dialog"
          aria-keyshortcuts="K Meta+K Control+K"
          onClick={openSearch}
        >
          Find
        </CommandButton>
      </div>

      <dialog id="hero-dialog" ref={dialogRef} className={`hih-dialog hih-dialog--${panel ?? "closed"}`} aria-label={panel === "menu" ? "Site menu" : "Find on this site"} onClose={closePanel} onCancel={(event) => { event.preventDefault(); closePanel(); }} onClick={(event) => { if (event.target === event.currentTarget) closePanel(); }}>
        {panel === "menu" ? (
          <div className="hih-menu-panel">
            <a className="hih-menu-logo" href="#top" onClick={closePanel} aria-label="Blank Interfaces home">
              <Image src="/blank-interfaces-lockup.svg" alt="Blank Interfaces" width={1045} height={575} />
            </a>
            <button type="button" className={`${BUTTON_CLASS} hih-menu-close`} onClick={closePanel} aria-label="Close menu"><span>Close</span><kbd className={KBD_CLASS}>esc</kbd></button>
            <nav className="hih-menu-links" aria-label="Main navigation">
              {navigation.map((link) => <a href={link.href} key={link.href} onClick={(event) => { event.preventDefault(); visit(link.href); }}>{link.label}</a>)}
              {utilityLinks.map((link) => <a href={link.href} key={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>)}
            </nav>
          </div>
        ) : panel === "search" ? (
          <div className="hih-search-panel">
            <label htmlFor="hero-search" className="sr-only">Search Blank Interfaces</label>
            <div className="hih-search-field">
              <Search aria-hidden="true" />
              <input ref={inputRef} id="hero-search" placeholder="Search blank/" value={query} role="combobox" aria-expanded="true" aria-controls="hero-results" aria-autocomplete="list" aria-activedescendant={results.length ? `hero-result-${selectedIndex}` : undefined} onChange={(event) => { setQuery(event.target.value); setActiveResult(0); }} onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  setActiveResult((index) => results.length ? (index + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length : 0);
                } else if (event.key === "Enter" && results[selectedIndex]) {
                  event.preventDefault();
                  visit(results[selectedIndex].href);
                }
              }} />
              <button type="button" className="hih-search-field-close" onClick={closePanel} aria-label="Close search"><kbd>esc</kbd></button>
            </div>
            <div id="hero-results" role="listbox" aria-label="Search results">
              {results.map((entry, index) => <button type="button" role="option" id={`hero-result-${index}`} aria-selected={index === selectedIndex} tabIndex={-1} className="hih-search-result" key={entry.href} onMouseMove={() => setActiveResult(index)} onClick={() => visit(entry.href)}>{entry.label}</button>)}
              {!results.length && <p className="hih-no-results" role="status">No results for &quot;{query}&quot;.</p>}
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}

const styles = `
.hih-root {
  --button-bg: rgb(237 237 237 / .58);
  --fg: #111;
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: "Search System Pro Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  letter-spacing: 0;
}
.hih-root button { cursor: pointer; }
.hih-root button.bg-\\[var\\(--button-bg\\)\\]:hover { --button-bg: rgb(237 237 237 / .76); }
.hih-root .hih-command-button {
  border-color: rgb(255 255 255 / .78) !important;
  background: linear-gradient(180deg, rgb(237 237 237 / .58), rgb(237 237 237 / .32)) !important;
  color: #111 !important;
  padding: 8px 10px;
  gap: 8px;
  font-weight: 400;
  box-shadow:
    0 8px 24px rgb(15 23 42 / .08),
    inset 0 1px 0 rgb(255 255 255 / .88),
    inset 0 -1px 0 rgb(15 23 42 / .05);
  backdrop-filter: blur(20px) saturate(120%);
  -webkit-backdrop-filter: blur(20px) saturate(120%);
}
.hih-root .hih-command-button:hover { background: linear-gradient(180deg, rgb(237 237 237 / .72), rgb(237 237 237 / .46)) !important; }
.hih-root .hih-command-button > span[aria-hidden] { background: #111 !important; }
.hih-root .hih-command-button kbd {
  border-color: #D5D8DD !important;
  background: #F7F7F7 !important;
  color: #666B73 !important;
  font-weight: 500;
}
.hih-root :focus-visible { outline: 2px solid currentColor; outline-offset: 4px; }
.hih-header { position: absolute; inset: 0 0 auto; height: 108px; z-index: 2; }
.hih-wordmark { position: absolute; top: 10px; left: 50%; transform: translateX(-50%); margin: 0; width: 190px; }
.hih-wordmark img, .hih-menu-logo img { display: block; width: 100%; height: auto; }
.hih-menu-trigger, .hih-menu-close { position: absolute; top: 20px; right: 24px; }
.hih-animation { position: absolute; inset: 108px 0 0; }
.hih-animation-frame { display: block; width: 100%; height: 100%; border: 0; }
.hih-static { position: absolute; left: 50%; top: 40%; transform: translate(-50%, -50%); width: min(640px, calc(100% - 48px)); font: 14px/1.7 "Search System Pro Mono", ui-monospace, monospace; }
.hih-caption { position: absolute; left: 24px; bottom: 64px; width: 290px; max-width: calc(100% - 48px); margin: 0; font: 11px/1.4 "Search System Pro Mono", ui-monospace, monospace; }
.hih-find { position: absolute; bottom: 24px; left: 50%; z-index: 2; transform: translateX(-50%); }
.hih-dialog {
  position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none;
  margin: 0; padding: 0; border: 0; background: transparent; color: #111;
  opacity: 0;
  transition: opacity 240ms ease-out;
}
.hih-dialog[open] { opacity: 1; }
.hih-dialog::backdrop {
  background: rgb(0 0 0 / 0); backdrop-filter: blur(0);
  transition: background-color 240ms ease-out, backdrop-filter 240ms ease-out;
}
.hih-dialog[open]::backdrop { background: rgb(17 17 17 / .12); backdrop-filter: blur(14px) saturate(115%); }
.hih-dialog--search[open] { display: flex; flex-direction: column; align-items: center; justify-content: center; }
.hih-menu-panel { position: relative; width: 100%; padding: 24px 24px 60px; background: #ECECE8; transform: translateY(-12px); transition: transform 300ms ease-out; }
.hih-menu-logo { position: absolute; left: 24px; top: 20px; width: 100px; }
.hih-menu-links { margin-left: 78%; display: flex; flex-direction: column; align-items: flex-start; gap: 20px; padding-right: 70px; font-size: 18px; line-height: 1.25; }
.hih-menu-links a { color: #111; text-decoration: none; white-space: nowrap; }
.hih-menu-links a:hover { text-decoration: underline; text-underline-offset: .2em; }
.hih-search-panel {
  width: min(560px, calc(100% - 32px));
  max-height: calc(100dvh - 140px);
  overflow-y: auto;
  padding: 8px;
  border: 1px solid rgb(213 216 221 / .88);
  border-radius: 14px;
  background: rgb(255 255 255 / .72);
  color: #111;
  box-shadow:
    0 20px 54px rgb(15 23 42 / .12),
    inset 0 1px 0 rgb(255 255 255 / .9);
  backdrop-filter: blur(28px) saturate(150%);
  -webkit-backdrop-filter: blur(28px) saturate(150%);
  transform: translateY(12px) scale(.985);
  transition: transform 240ms ease-out;
}
.hih-dialog[open] .hih-menu-panel { transform: translateY(0); }
.hih-dialog[open] .hih-search-panel { transform: translateY(0) scale(1); }
@starting-style {
  .hih-dialog[open] { opacity: 0; }
  .hih-dialog[open]::backdrop { background: rgb(0 0 0 / 0); backdrop-filter: blur(0); }
  .hih-dialog[open] .hih-menu-panel { transform: translateY(-12px); }
  .hih-dialog[open] .hih-search-panel { transform: translateY(12px) scale(.985); }
}
.hih-search-field {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 11px 10px 14px;
  border: 0;
  border-bottom: 1px solid rgb(17 17 17 / .09);
  border-radius: 0;
  background: transparent;
}
.hih-search-field > svg { width: 17px; height: 17px; flex: none; opacity: .52; stroke-width: 1.7; }
.hih-search-field input {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  outline: none !important;
  background: transparent;
  color: inherit;
  font: 500 15px/1.35 "Search System Pro Mono", ui-monospace, monospace;
}
.hih-search-field input:focus-visible { outline: none !important; }
.hih-search-field input::placeholder { color: rgb(17 17 17 / .45); }
.hih-search-field-close {
  display: grid;
  place-items: center;
  flex: none;
  padding: 4px 6px;
  border: 1px solid rgb(17 17 17 / .12);
  border-radius: 5px;
  background: rgb(17 17 17 / .04);
  color: rgb(17 17 17 / .48);
}
.hih-search-field-close:hover { background: rgb(17 17 17 / .06); color: #111; }
.hih-search-field-close kbd { font: 500 10px/1 "Search System Pro Mono", ui-monospace, monospace; }
#hero-results { display: grid; gap: 4px; margin-top: 8px; }
.hih-search-result {
  display: block;
  width: 100%;
  padding: 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  text-align: left;
  font: 500 14px/1.3 "Search System Pro Mono", ui-monospace, monospace;
  transition: background-color 140ms ease-out;
}
.hih-search-result[aria-selected=true] { background: rgb(17 17 17 / .07); }
.hih-no-results { margin: 0; padding: 22px 13px; color: rgb(17 17 17 / .52); font: 500 13px/1.4 "Search System Pro Mono", ui-monospace, monospace; }
@media (max-width: 767px) {
  .hih-caption { left: 50%; bottom: 72px; transform: translateX(-50%); width: 290px; text-align: center; font-size: 10px; }
  .hih-menu-trigger, .hih-menu-close { right: 16px; }
  .hih-wordmark { left: 16px; transform: none; width: 110px; }
  .hih-menu-panel { min-height: 55svh; padding-top: 96px; }
  .hih-menu-links { margin-left: 50%; padding-right: 0; }
  .hih-menu-logo { left: 16px; width: 110px; }
  .hih-search-panel { max-height: calc(100dvh - 160px); }
}
@media (prefers-reduced-motion: reduce) {
  .hih-root button, .hih-dialog, .hih-dialog::backdrop, .hih-menu-panel, .hih-search-panel { transition: none; }
}
`;
