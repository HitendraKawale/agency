"use client";

// The heat car, still the standalone three.js page in public/f1 until the new car moves into the
// R3F canvas. `?t=2` on the page URL passes through to freeze the car for screenshots. When the car
// reports ready, <html data-ready> is set, so screenshot scripts can wait on it.
import { useEffect, useRef } from "react";

export function CarFrame({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = ref.current!;
    const t = new URLSearchParams(location.search).get("t");
    frame.src = t ? `${src}?t=${t}` : src;
    const poll = window.setInterval(() => {
      const win = frame.contentWindow as (Window & { __ready?: boolean }) | null;
      if (win?.__ready) {
        clearInterval(poll);
        document.documentElement.dataset.ready = "true";
      }
    }, 100);
    return () => clearInterval(poll);
  }, [src]);

  return <iframe ref={ref} title={title} scrolling="no" />;
}
