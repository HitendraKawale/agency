"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import { effectsFor } from "./effects";
import { motionAllowed } from "./preferences";

type Kind = "slide-up" | "fade" | "scramble";

/**
 * Aino's reveal: an element observed at 30% visibility either rises 20px over
 * .6s, fades over .4s, or has its characters settle out of the glyph ramp.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  kind = "slide-up",
  className,
  delay = 0,
}: {
  children: ReactNode;
  as?: ElementType;
  kind?: Kind;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!motionAllowed()) return;
    const effects = effectsFor(element);
    let restore = () => {};
    let timer = 0;
    element.dataset.init = "true";
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        timer = window.setTimeout(() => {
          if (kind === "scramble") restore = effects.scramble(element, { speed: 1, random: true, duration: 500 });
          element.classList.add("revealed");
        }, 5 + delay);
      },
      { threshold: kind === "scramble" ? 0.2 : 0.3 },
    );
    observer.observe(element);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      restore();
      effects.dispose();
      element.classList.remove("revealed");
      delete element.dataset.init;
    };
  }, [kind, delay]);

  return (
    <Tag ref={ref} className={className} data-reveal={kind === "scramble" ? "fade" : kind}>
      {children}
    </Tag>
  );
}
