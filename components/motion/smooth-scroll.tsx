"use client";

// Lenis owns scrolling; GSAP's ticker drives it, so ScrollTrigger and Lenis read the same frame.
// Both choreography passes (the load intro and the scroll reveals) start here, once the fonts are in,
// so nothing changes width mid-fade. With reduced motion or ?still, there is no Lenis and nothing plays.
import Lenis from "lenis";
import { useEffect } from "react";
import { armReveals, playIntro } from "@/lib/motion/choreography";
import { gsap, motionOn, ScrollTrigger } from "@/lib/motion/gsap";

export function SmoothScroll() {
  useEffect(() => {
    if (!motionOn()) return;

    const lenis = new Lenis({ autoRaf: false });
    const offScroll = lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    let ctx: gsap.Context | undefined;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        playIntro();
        armReveals();
      });
    });

    return () => {
      cancelled = true;
      ctx?.revert();
      offScroll();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
