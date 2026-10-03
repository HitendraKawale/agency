"use client";

import { useEffect, useRef } from "react";
import { effectsFor } from "./effects";
import { motionAllowed, readPreferences, subscribePreferences } from "./preferences";

/**
 * An image drawn through Aino's renderers: the photo in Image mode, a glyph
 * field in Text mode, a four-colour cell mask in Pixel mode. With `decode`,
 * it first arrives as scrambled glyphs and resolves into the image, Aino's
 * work-index entry (50ms per item, 40ms scramble delay, 400ms settle).
 */
export default function Media({
  src,
  alt,
  className,
  decode,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  /** Position in a staggered group; omit to show without the decode. */
  decode?: number;
  priority?: boolean;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const image = imageRef.current;
    if (!frame || !image) return;
    let cleanup = () => {};
    let decoded = decode === undefined;
    let visible = false;

    function render() {
      if (!frame || !image) return;
      cleanup();
      delete frame.dataset.decoding;
      delete frame.dataset.mediaReady;
      if (!image.complete || !image.naturalWidth || !image.clientWidth) return;

      const { mode } = readPreferences();
      const effects = effectsFor(frame);
      const disposers: Array<() => void> = [];
      const timers = new Set<number>();
      cleanup = () => {
        for (const timer of timers) window.clearTimeout(timer);
        for (const dispose of disposers) dispose();
        effects.dispose();
      };
      const after = (callback: () => void, ms: number) => {
        const timer = window.setTimeout(() => {
          timers.delete(timer);
          callback();
        }, ms);
        timers.add(timer);
      };
      const finish = () => {
        decoded = true;
        delete frame.dataset.decoding;
        frame.dataset.mediaReady = "true";
        const ascii = frame.querySelector<HTMLElement>(".ascii");
        if (ascii) ascii.style.display = mode === "text" ? "block" : "none";
        if (mode === "pixel") disposers.push(effects.pixel(image));
      };

      if (!decoded && decode !== undefined && motionAllowed()) {
        // Hidden until it decodes, so the photo never flashes first.
        frame.dataset.decoding = "true";
        if (!visible) return;
        after(() => {
          disposers.push(
            effects.ascii(image, {
              forceShow: true,
              onReady: (ascii) =>
                after(() => {
                  disposers.push(
                    effects.scramble(ascii, {
                      speed: 1,
                      random: true,
                      duration: 400,
                      ready: () => after(finish, 200 + decode * 20),
                    }),
                  );
                }, 40),
            }),
          );
        }, decode * 50);
      } else {
        if (mode === "text") disposers.push(effects.ascii(image, { forceShow: true }));
        finish();
      }
      for (const overlay of frame.querySelectorAll(".ascii, .overlay, .pixelate")) {
        overlay.setAttribute("aria-hidden", "true");
      }
    }

    // The decode plays when the frame first comes into view, not on load.
    const intersection = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || visible) return;
        visible = true;
        intersection.disconnect();
        render();
      },
      { threshold: 0.2 },
    );
    intersection.observe(frame);
    const unsubscribe = subscribePreferences(render);
    const resize = new ResizeObserver(() => render());
    resize.observe(image);
    image.addEventListener("load", render);
    document.addEventListener("visibilitychange", render);
    render();

    return () => {
      intersection.disconnect();
      unsubscribe();
      resize.disconnect();
      image.removeEventListener("load", render);
      document.removeEventListener("visibilitychange", render);
      cleanup();
    };
  }, [src, decode]);

  return (
    <div ref={frameRef} className={className ? `media ${className}` : "media"}>
      {/* The renderers sample this exact element, so it stays a plain <img>. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imageRef} src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}
