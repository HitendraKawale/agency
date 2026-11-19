"use client";

// basement's music button (basement.studio, read from their bundle 2026-11-19; pinned in
// reference/basement-music-toggle). Five 2×2 dots in grey while off. On, in ink-1, each bar loops
// from 2px to its own random 8–12px and back every 0.8s, starting after a random 0–0.5s, centred on
// y = 7.5. Same `animate` from motion, so the same easing. It turns the site's sound on and off
// (lib/sound/music.ts); sound starts on, so the bars move from the first frame.
import { animate } from "motion";
import { useEffect, useRef } from "react";
import { music, useMusic } from "@/lib/sound/music";

const BARS = [0, 5, 10, 15, 20];

export function MusicToggle({ className }: { className?: string }) {
  const on = useMusic();
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const rects = [...(svg.current?.querySelectorAll("rect") ?? [])];
    if (!on) {
      for (const r of rects) {
        r.setAttribute("height", "2");
        r.setAttribute("y", "6.5");
      }
      return;
    }
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const runs = rects.flatMap((r) => {
      const peak = Math.floor(5 * Math.random()) + 8;
      // reduced motion: the bars stand at their heights instead of pulsing
      if (still) {
        r.setAttribute("height", String(peak));
        r.setAttribute("y", String(7.5 - peak / 2));
        return [];
      }
      const loop = { duration: 0.8, delay: 0.5 * Math.random(), repeat: Infinity, repeatType: "reverse" as const };
      return [
        animate(Number(r.getAttribute("height")), [2, peak], { ...loop, onUpdate: (v) => r.setAttribute("height", String(v)) }),
        animate(Number(r.getAttribute("y")), [6.5, 7.5 - peak / 2], { ...loop, onUpdate: (v) => r.setAttribute("y", String(v)) }),
      ];
    });
    return () => runs.forEach((a) => a.cancel());
  }, [on]);

  return (
    <button
      type="button"
      className={className}
      data-on={on || undefined}
      aria-label={on ? "Turn music off" : "Turn music on"}
      onClick={() => music.set(!on)}
    >
      <svg ref={svg} width="22" height="15" viewBox="0 0 22 15" fill="none" aria-hidden>
        {BARS.map((x) => (
          <rect key={x} x={x} y="6.5" width="2" height="2" fill="currentColor" />
        ))}
      </svg>
    </button>
  );
}
