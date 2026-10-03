"use client";

import Lenis from "lenis";
import { useEffect } from "react";

/**
 * One document scroll controller. Open dialogs, hidden tabs and reduced motion
 * fall back to native scrolling; anything marked data-lenis-prevent (dialogs,
 * horizontal strips) keeps its own scroll.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      anchors: true,
      stopInertiaOnNavigate: true,
      syncTouch: false,
      prevent: (node) => node.hasAttribute("data-lenis-prevent"),
    });
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const tick = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(tick);
    };

    const synchronize = () => {
      cancelAnimationFrame(frame);
      const native =
        reducedMotion.matches ||
        document.visibilityState !== "visible" ||
        document.querySelector("dialog[open]") !== null;
      document.documentElement.dataset.scroll = native ? "native" : "lenis";
      if (native) {
        lenis.stop();
        return;
      }
      lenis.start();
      frame = requestAnimationFrame(tick);
    };

    const dialogs = new MutationObserver(synchronize);
    dialogs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
    document.addEventListener("visibilitychange", synchronize);
    reducedMotion.addEventListener("change", synchronize);
    synchronize();

    return () => {
      cancelAnimationFrame(frame);
      dialogs.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      reducedMotion.removeEventListener("change", synchronize);
      lenis.destroy();
      delete document.documentElement.dataset.scroll;
    };
  }, []);

  return null;
}
