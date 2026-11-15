"use client";

// Two columns of our work that run on their own, the left one up and the right one down, at about
// 21 px/s (Symbol's speed, measured live). Time-driven, not scroll, so plain CSS keyframes do it.
// Each list is rendered twice; one loop moves it by one copy. Videos play only while on screen.
import { useEffect, useRef } from "react";
import type { ReelItem } from "@/content/home";
import s from "./studio.module.css";

const PX_PER_SECOND = 21;

export function Reel({ columns, className }: { columns: readonly (readonly ReelItem[])[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reel = ref.current!;
    const lists = [...reel.querySelectorAll<HTMLElement>("ul")];
    const videos = [...reel.querySelectorAll("video")];
    const pace = () =>
      lists.forEach((ul) => ul.style.setProperty("--dur", `${(ul.offsetHeight / 2 / PX_PER_SECOND).toFixed(1)}s`));
    const ro = new ResizeObserver(pace);
    ro.observe(reel);
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) =>
      videos.forEach((v) => (e.isIntersecting && !still ? v.play().catch(() => {}) : v.pause())),
    );
    io.observe(reel);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={className} data-reveal="lift">
      {columns.map((items, c) => (
        <ul key={c}>
          {[false, true].flatMap((copy) =>
            items.map((item) => (
              <li key={`${copy}-${item.src}`} aria-hidden={copy || undefined}>
                <Media item={item} hidden={copy} />
              </li>
            )),
          )}
        </ul>
      ))}
    </div>
  );
}

function Media({ item, hidden }: { item: ReelItem; hidden: boolean }) {
  if (item.kind === "video") {
    return (
      <video
        className={s.media}
        src={item.src}
        poster={item.poster}
        width={item.width}
        height={item.height}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={hidden ? undefined : item.alt}
      />
    );
  }
  return (
    <img
      className={s.media}
      src={item.src}
      width={item.width}
      height={item.height}
      alt={hidden ? "" : item.alt}
      loading="lazy"
      decoding="async"
    />
  );
}
