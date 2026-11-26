"use client";
// A Lab recording: the 960px tile in the grid, the full clip on its own page. The grid holds a few
// hundred of these, so each one loads in stages:
// - the poster is a lazy <img>; a video's poster attribute would download for every clip at once
// - a screen before the clip scrolls in, it starts buffering, so it is ready when it arrives
// - it plays only while a third of it is on screen, and pauses once it leaves
// - playback starts at the midpoint, the frame the poster shows, so the poster never jumps
// Reduced motion keeps the poster; the full clip has controls to play it by hand.
import { useEffect, useRef } from "react";
import type { LabItem } from "@/content/lab";
import { cn } from "@/lib/utils";

export function LabClip({ item, className, full = false }: { item: LabItem; className?: string; full?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const { clip } = item;

  useEffect(() => {
    const v = ref.current;
    if (!v || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // once only: a second load() would abort a play() already under way
    const prime = () => {
      if (v.preload === "auto") return;
      v.preload = "auto";
      v.load();
    };
    const warm = new IntersectionObserver(([e]) => e.isIntersecting && prime(), { rootMargin: "100% 0px" });
    const play = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio < 0.33) return v.pause();
        prime();
        v.play().catch(() => {});
      },
      { threshold: [0, 0.33] },
    );
    warm.observe(v);
    play.observe(v);
    return () => {
      warm.disconnect();
      play.disconnect();
    };
  }, []);

  return (
    <div className={cn("relative overflow-hidden rounded-md bg-tile", className)} style={{ aspectRatio: `${clip.width} / ${clip.height}` }}>
      {/* pre-sized WebP and JPEG on Blob, so the image optimizer has nothing to add */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={full ? clip.poster : clip.tilePoster}
        alt=""
        loading={full ? "eager" : "lazy"}
        fetchPriority={full ? "high" : "auto"}
        decoding="async"
        className="absolute inset-0 size-full object-cover"
      />
      <video
        ref={ref}
        src={`${full ? clip.src : clip.tile}#t=${(clip.duration / 2).toFixed(2)}`}
        muted
        loop
        playsInline
        preload="none"
        controls={full}
        aria-label={`${item.title}, recorded`}
        // over the poster it fades in once playing; with controls it shows from the start, so the controls do too
        className={cn("absolute inset-0 size-full object-cover", !full && "opacity-0 transition-opacity duration-300 data-on:opacity-100")}
        onPlaying={(e) => (e.currentTarget.dataset.on = "")}
      />
    </div>
  );
}
