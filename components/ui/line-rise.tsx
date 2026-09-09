"use client";

/** Masked line reveals, with ordinary text restored after the animation. */

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
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const elements = el.children.length ? Array.from(el.children) : [el];
      const splits = elements.map((element) =>
        SplitText.create(element, {
          type: "lines",
          mask: "lines",
          linesClass: "rise-line",
          lineThreshold: 0.1,
          autoSplit: true,
          onSplit(self) {
            return gsap.from(self.lines, {
              yPercent: 100,
              duration: 1,
              stagger: 0.1,
              ease: "power4.out",
              delay,
              scrollTrigger: {
                trigger: element,
                start: "top 75%",
                once: true,
              },
              onComplete: () => self.revert(),
            });
          },
        }),
      );
      return () => {
        for (const split of splits) split.revert();
      };
    });
    return () => media.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
