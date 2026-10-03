"use client";

import { useEffect, useRef } from "react";
import { motionAllowed } from "./preferences";

const EMAIL = "aryan@blankinterface.com";

/**
 * The poster from the brief with our mark where Nocturna's sat: a grainy B&W
 * doorway, hairlines that draw in across it, the lockup centred. The photo
 * drifts slower than the page, so the doorway seems to sit behind the sheet.
 */
export default function Gateway() {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let frame = 0;

    const reveal = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        node.classList.add("revealed");
        reveal.disconnect();
      },
      { threshold: 0.3 },
    );
    if (motionAllowed()) {
      node.dataset.init = "true";
      reveal.observe(node);
    }

    const shift = () => {
      frame = 0;
      if (!motionAllowed()) {
        node.style.removeProperty("--gateway-shift");
        return;
      }
      const rect = node.getBoundingClientRect();
      // -1 when the poster's top meets the bottom of the viewport, 1 when its
      // bottom leaves the top.
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height) * 2 - 1;
      node.style.setProperty("--gateway-shift", `${(progress * rect.height * 0.04).toFixed(1)}px`);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(shift);
    };
    shift();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      reveal.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      delete node.dataset.init;
      node.classList.remove("revealed");
    };
  }, []);

  return (
    <a ref={ref} className="gateway" href={`mailto:${EMAIL}`} aria-label={`Get in touch, email ${EMAIL}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="gateway-image" src="/media/gateway.jpg" alt="" loading="lazy" decoding="async" />
      <svg className="gateway-grain" aria-hidden="true" width="100%" height="100%">
        <filter id="gateway-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#gateway-grain)" />
      </svg>
      <span className="gateway-lines" aria-hidden="true">
        <span className="v" style={{ left: "25%" }} />
        <span className="v" style={{ left: "50%", transitionDelay: "80ms" }} />
        <span className="v" style={{ left: "75%", transitionDelay: "160ms" }} />
      </span>
      <span className="gateway-corner label" style={{ left: "var(--pad)" }}>
        <span>Design</span>
        <span>Engineering</span>
        <span>Answer engines</span>
      </span>
      <span className="gateway-text t-cell" style={{ left: "var(--pad)", top: "calc(62% + 10px)" }}>
        <span>Visual</span>
        <span>gateways</span>
      </span>
      <span className="gateway-mark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/blank-interfaces-lockup-inverted.svg" alt="" />
      </span>
      <span className="gateway-foot label">
        <span className="gateway-go">( Get in touch )</span>
        <span>{EMAIL}</span>
      </span>
    </a>
  );
}
