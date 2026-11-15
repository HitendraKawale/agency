"use client";

// The page's choreography, driven by data attributes so sections stay server components:
//
//   data-intro="fade" | "lift"     plays once on load, after the fonts are in
//   data-reveal="fade" | "lift"    plays once when the element scrolls into view
//   data-delay="0.15"              seconds before it starts
//   data-dur="1.4"                 seconds it lasts (defaults below)
//
// Inside a revealed element, children react when it plays:
//   data-wipe                      clips in from the left (the loss ticks)
//   data-count="30,40"             counts a range up from zero, with data-sign before it
//
// "fade" comes in from transparent with a small blur and an 8px drop, so it sharpens into place
// rather than travelling. "lift" is for large blocks: a 24px rise with no blur.
import { gsap, ScrollTrigger } from "./gsap";

type Kind = "fade" | "lift";

const FROM: Record<Kind, gsap.TweenVars> = {
  fade: { opacity: 0, filter: "blur(10px)", y: 8 },
  lift: { opacity: 0, y: 24 },
};
const TO: Record<Kind, gsap.TweenVars> = {
  fade: { opacity: 1, filter: "blur(0px)", y: 0 },
  lift: { opacity: 1, y: 0 },
};
const DURATION = { intro: { fade: 1.1, lift: 1.6 }, reveal: { fade: 1.1, lift: 1.4 } } as const;

const num = (v: string | undefined, fallback: number) => (v ? Number(v) : fallback);

function tween(el: HTMLElement, kind: Kind, phase: "intro" | "reveal") {
  return gsap.fromTo(el, FROM[kind], {
    ...TO[kind],
    duration: num(el.dataset.dur, DURATION[phase][kind]),
    delay: num(el.dataset.delay, 0),
    ease: "out",
    // hand transforms and filters back to CSS once landed, so hover and press states keep working
    clearProps: "transform,filter",
  });
}

function countUp(el: HTMLElement) {
  const [a, b] = (el.dataset.count ?? "0,0").split(",").map(Number);
  const sign = el.dataset.sign ?? "";
  const n = { k: 0 };
  gsap.to(n, {
    k: 1,
    duration: 1.6,
    ease: "power3.out",
    onUpdate: () => {
      el.textContent = `${sign}${Math.round(a * n.k)}–${Math.round(b * n.k)}%`;
    },
  });
}

function wipe(el: HTMLElement) {
  gsap.fromTo(el, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.4, delay: 0.15, ease: "out" });
}

/** The load sequence: logo, headline words, then nav and the row under the headline, then the artwork. */
export function playIntro(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-intro]").forEach((el) => tween(el, el.dataset.intro as Kind, "intro"));
}

/** Scroll reveals, once each, as an element's top passes 90% of the viewport. */
export function armReveals(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => {
        tween(el, el.dataset.reveal as Kind, "reveal");
        el.querySelectorAll<HTMLElement>("[data-wipe]").forEach(wipe);
        el.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
      },
    });
  });
}
