"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import AsciiLogo from "@/components/ui/ascii-logo";
import { usePreferences } from "./preferences";

const LOGO_SRC = "/blank-footer-logo.svg";

function subscribeMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    media.removeEventListener("change", onChange);
    document.removeEventListener("visibilitychange", onChange);
  };
}

function motionPermitted() {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    document.visibilityState === "visible"
  );
}

/**
 * The footer from the earlier study, kept as approved: the logo SVG itself
 * dissolved into the cursor-spring ASCII field. The static SVG stays
 * underneath for reduced motion, hidden tabs and the first paint.
 */
export default function FooterLogo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inViewport, setInViewport] = useState(false);
  const { appearance } = usePreferences();
  const motionAllowed = useSyncExternalStore(subscribeMotion, motionPermitted, () => false);
  const paper = appearance === "dark" ? "#05090A" : "#DFEAE8";
  const ink = appearance === "dark" ? "#DFEAE8" : "#05090A";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => {
      setInViewport(entry?.isIntersecting ?? false);
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const animate = inViewport && motionAllowed;

  return (
    <div
      ref={rootRef}
      className="footer-logo"
      role="img"
      aria-label="Blank Interfaces"
      data-renderer={animate ? "ascii" : "svg"}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="footer-logo-fallback" src={LOGO_SRC} alt="" width={990} height={360} />
      {animate ? (
        <div className="footer-logo-effect" aria-hidden="true">
          <AsciiLogo
            key={appearance}
            src={LOGO_SRC}
            background={paper}
            gridColor={paper}
            charColor={ink}
            logoScale={98}
          />
        </div>
      ) : null}
    </div>
  );
}
