"use client";

// Lenis owns scrolling; GSAP's ticker drives it, so ScrollTrigger and Lenis read the same frame.
// Both choreography passes (the load intro and the scroll reveals) start here, once the fonts are in,
// so nothing changes width mid-fade. With reduced motion or ?still, there is no Lenis and nothing plays.
//
// Links between pages are client-side (next/link), so this layout, and the cursor synth with it, stay
// mounted. Lenis is set up once; the choreography runs again for each page, from the top.
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { armReveals, playIntro } from "@/lib/motion/choreography";
import { gsap, motionOn, ScrollTrigger } from "@/lib/motion/gsap";

export function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!motionOn()) return;

    // anchors: in-page links (the /services index) ease there too, landing at the target's scroll-margin-top
    const lenis = new Lenis({ autoRaf: false, anchors: true });
    lenisRef.current = lenis;
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
    // ScrollTrigger measures trigger positions once. When the page's height changes after that
    // (Lab sections under content-visibility swap their size estimate for the real height as they
    // render), re-measure, or a reveal near the bottom can sit past the end of the page and never fire.
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);
    });
    ro.observe(document.body);

    return () => {
      offScroll();
      ro.disconnect();
      clearTimeout(refreshTimer);
      document.removeEventListener("click", onAnchor);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Per page: start at the top (Lenis keeps its own target, which would ease back to the old
  // position), then play the new page's intro and arm its reveals. Leaving reverts both, which also
  // kills the old page's ScrollTriggers.
  useEffect(() => {
    if (!motionOn()) return;
    lenisRef.current?.scrollTo(0, { immediate: true, force: true });
    let ctx: gsap.Context | undefined;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      ctx = gsap.context(() => {
        playIntro();
        armReveals();
      });
      ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}
