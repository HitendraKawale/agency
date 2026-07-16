"use client";

/**
 * LineRise — copy blocks split into masked lines that rise from behind their
 * baseline as they scroll into view. Extracted from the line-rise-text
 * registry item (ui.aryank.space) and adapted to ride the window scroll.
 *
 * Wrap one heading or several paragraphs; all children split together and
 * share one scroll trigger (grouped reveal). Text-indent is moved onto the
 * first split line only (indent-aware split).
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useEffect, useRef } from "react";

gsap.registerPlugin(SplitText, ScrollTrigger);

export default function LineRise({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const elements = el.children.length
      ? (Array.from(el.children) as HTMLElement[])
      : [el];

    const splits: SplitText[] = [];
    const lines: Element[] = [];
    for (const element of elements) {
      const split = SplitText.create(element, {
        type: "lines",
        mask: "lines",
        linesClass: "rise-line",
        lineThreshold: 0.1,
      });
      splits.push(split);

      const textIndent = window.getComputedStyle(element).textIndent;
      if (textIndent && textIndent !== "0px") {
        const first = split.lines[0] as HTMLElement | undefined;
        if (first) first.style.paddingLeft = textIndent;
        element.style.textIndent = "0";
      }
      lines.push(...split.lines);
    }

    gsap.set(lines, { y: "100%" });
    const tween = gsap.to(lines, {
      y: "0%",
      duration: 1,
      stagger: 0.1,
      ease: "power4.out",
      delay,
      scrollTrigger: {
        trigger: el,
        start: "top 75%",
        once: true,
      },
    });

    // Line breaks were measured at hydration; re-sync trigger positions once
    // the webfont has finished loading.
    document.fonts.ready.then(() => ScrollTrigger.refresh());

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      for (const s of splits) s.revert();
    };
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
