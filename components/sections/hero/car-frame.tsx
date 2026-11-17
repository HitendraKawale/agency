"use client";

// The heat car, still the standalone three.js page in public/f1 until the new car moves into the
// R3F canvas. `?t=2` on the page URL passes through to freeze the car for screenshots. When the car
// reports ready, <html data-ready> is set, so screenshot scripts can wait on it.
//
// An iframe keeps the mouse to itself, so while it is over the car the page would hear nothing and
// the live cursors (components/realtime) would freeze. The frame is ours, so its mouse moves are
// passed up to the page in page coordinates, and so is "/" (open the chat) if the car has focus.
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
    // pass the frame's mouse and "/" up to the page
    let win: Window | null = null;
    const move = (e: MouseEvent) => {
      const r = frame.getBoundingClientRect(), at = { clientX: r.left + e.clientX, clientY: r.top + e.clientY };
      window.dispatchEvent(new PointerEvent("pointermove", { ...at, pointerType: "mouse" }));
      window.dispatchEvent(new MouseEvent("mousemove", at));
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) window.dispatchEvent(new KeyboardEvent("keydown", { key: "/", cancelable: true }));
    };
    const attach = () => {
      try {
        win = frame.contentWindow;
        win?.addEventListener("mousemove", move, { passive: true });
        win?.addEventListener("keydown", key);
      } catch {
        win = null; // not same-origin after all: nothing to pass up
      }
    };
    frame.addEventListener("load", attach);
    return () => {
      clearInterval(poll);
      frame.removeEventListener("load", attach);
      win?.removeEventListener("mousemove", move);
      win?.removeEventListener("keydown", key);
    };
  }, [src]);

  return <iframe ref={ref} title={title} scrolling="no" />;
}
