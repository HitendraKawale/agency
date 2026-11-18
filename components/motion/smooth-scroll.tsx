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

    // anchors: in-page links (the /services index) ease there too, landing at the target's scroll-margin-top
    const lenis = new Lenis({ autoRaf: false, anchors: true });
    const offScroll = lenis.on("scroll", ScrollTrigger.update);
    // Lenis eases same-page # links but doesn't stop the browser's own jump, which lands first and
    // then snaps back for the ease. Stop the jump here (this runs before Lenis's listener on
    // window) and keep the hash in the URL.
    const onAnchor = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      if (!a || a.hash.length < 2 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      history.pushState(null, "", a.hash);
    };
    document.addEventListener("click", onAnchor);
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
      document.removeEventListener("click", onAnchor);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
