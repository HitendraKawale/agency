"use client";
// A Lab recording: the 960px tile in the grid, the full clip on its own page. The grid holds a few
// hundred of these, so each one loads in stages:
// - the poster is a lazy <img>; a video's poster attribute would download for every clip at once
// - a screen before the clip scrolls in, it starts buffering, so it is ready when it arrives
// - it plays only while a third of it is on screen, and pauses once it leaves
// - playback starts at the midpoint, the frame the poster shows, so the poster never jumps
// - resting on a tile prefetches the full clip its page plays
// Reduced motion keeps the poster; the full clip has Skiper67's controls to play it by hand.
//
// Hovering a tile is creatoroly.com/projects' video hover (reference/creatoroly/projects.js:256):
// the clip turns into big pixels (an 80px-wide canvas copy redrawn every frame, scaled up without
// smoothing, faded over white). In place of their 👀, a "See project" tag follows the cursor, drawn
// and moved like the online chat field (components/realtime/realtime.tsx).
import { MediaControlBar, MediaController, MediaPlayButton, MediaTimeRange } from "media-chrome/react";
import { motion, useSpring } from "motion/react";
import { useEffect, useRef } from "react";
import type { LabItem } from "@/content/lab";
import { cn } from "@/lib/utils";

// pixels across the canvas, as in the reference; the height keeps them square
const PIXELS = 80;
// the chat field's spring and its 16px gap from the pointer (components/realtime/realtime.tsx)
const SPRING = { damping: 50, stiffness: 500 };
const GAP = 16;

export function LabClip({ item, className, full = false }: { item: LabItem; className?: string; full?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const pixRef = useRef<HTMLCanvasElement>(null);
  const tagRef = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  const { clip } = item;
  const { src } = clip;

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

  // the tile hover: tag follows the pointer, canvas redraws the clip while the pointer is over it
  useEffect(() => {
    const box = boxRef.current;
    const v = ref.current;
    const img = posterRef.current;
    const pix = pixRef.current;
    const tag = tagRef.current;
    const ctx = pix?.getContext("2d");
    if (full || !box || !v || !img || !pix || !tag || !ctx) return;

    let draw = 0;
    let off: ReturnType<typeof setTimeout> | undefined;
    let dwell: ReturnType<typeof setTimeout> | undefined;
    // resting on a tile fetches its full clip, so the page it opens can start it at once; a pass
    // across the grid fetches nothing
    const prefetch = () => {
      if (document.querySelector(`link[rel=prefetch][href="${src}"]`)) return;
      document.head.append(Object.assign(document.createElement("link"), { rel: "prefetch", href: src }));
    };

    // 16px down and right of the pointer, flipping to the other side at the tile's edges
    const aim = (e: PointerEvent, jump: boolean) => {
      const r = box.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const tx = px + GAP + tag.offsetWidth > r.width ? px - GAP - tag.offsetWidth : px + GAP;
      const ty = py + GAP + tag.offsetHeight > r.height ? py - GAP - tag.offsetHeight : py + GAP;
      if (jump) {
        x.jump(tx);
        y.jump(ty);
      } else {
        x.set(tx);
        y.set(ty);
      }
    };
    // the playing clip, or the poster before it has a frame (and always under reduced motion)
    const paint = () => {
      if (v.readyState >= 2) ctx.drawImage(v, 0, 0, pix.width, pix.height);
      else if (img.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, pix.width, pix.height);
      draw = requestAnimationFrame(paint);
    };
    // no hover effect from a finger
    const touch = (e: PointerEvent) => e.pointerType !== "mouse" && e.pointerType !== "pen";

    const enter = (e: PointerEvent) => {
      if (touch(e)) return;
      aim(e, true);
      tag.dataset.on = "";
      clearTimeout(off);
      if (!draw) paint();
      dwell = setTimeout(prefetch, 200);
    };
    const move = (e: PointerEvent) => !touch(e) && aim(e, false);
    const leave = () => {
      delete tag.dataset.on;
      clearTimeout(dwell);
      // keep drawing through the canvas fade-out
      off = setTimeout(() => {
        cancelAnimationFrame(draw);
        draw = 0;
      }, 160);
    };

    box.addEventListener("pointerenter", enter);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    return () => {
      box.removeEventListener("pointerenter", enter);
      box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(draw);
      clearTimeout(off);
      clearTimeout(dwell);
    };
  }, [full, src, x, y]);

  const video = (
    <video
      ref={ref}
      slot={full ? "media" : undefined}
      // media-chrome takes the video out of the tab order before hydration; rendering the same keeps React quiet
      tabIndex={full ? -1 : undefined}
      src={`${full ? src : clip.tile}#t=${(clip.duration / 2).toFixed(2)}`}
      muted
      loop
      playsInline
      preload="none"
      aria-label={`${item.title}, recorded`}
      // a tile fades in over its poster once playing; the full clip shows from the start, under its controls
      className={cn("absolute inset-0 size-full object-cover", !full && "opacity-0 transition-opacity duration-300 data-on:opacity-100")}
      onPlaying={(e) => (e.currentTarget.dataset.on = "")}
    />
  );

  return (
    <div
      ref={boxRef}
      className={cn(
        "relative overflow-hidden rounded-md bg-tile",
        // the faded pixel view sits on white, as in the reference
        !full && "group/clip transition-colors duration-150 hover:bg-white",
        className,
      )}
      style={{ aspectRatio: `${clip.width} / ${clip.height}` }}
    >
      {/* the clip itself; on hover it scales a touch and gives way to the pixel copy */}
      <div
        className={cn(
          "absolute inset-0",
          !full &&
            "[transition:opacity_0.15s_ease,scale_0.6s_cubic-bezier(0.22,0.8,0.25,1)] group-hover/clip:scale-[1.03] group-hover/clip:opacity-0",
        )}
      >
        {/* pre-sized WebP and JPEG on Blob, so the image optimizer has nothing to add */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={posterRef}
          src={full ? clip.poster : clip.tilePoster}
          alt=""
          loading={full ? "eager" : "lazy"}
          fetchPriority={full ? "high" : "auto"}
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
        {full ? (
          // Skiper67's player (reference/skiper67/skiper67.tsx.txt): a play button and a 2px time range
          // with no thumb, in exclusion blend over the clip. Its mute button is left out: the clips
          // are recorded without sound.
          <MediaController className="absolute inset-0 size-full [--media-background-color:transparent]">
            {video}
            <MediaControlBar className="absolute bottom-0 left-1/2 flex w-full max-w-7xl -translate-x-1/2 items-center justify-center px-5 mix-blend-exclusion md:px-10 md:py-5">
              <MediaPlayButton className="h-4 bg-transparent" />
              <MediaTimeRange className="bg-transparent [--media-range-thumb-opacity:0] [--media-range-track-height:2px]" />
            </MediaControlBar>
          </MediaController>
        ) : (
          video
        )}
      </div>
      {!full && (
        <>
          <canvas
            ref={pixRef}
            width={PIXELS}
            height={Math.round((PIXELS * clip.height) / clip.width)}
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full opacity-0 transition-opacity duration-150 ease-[ease] [image-rendering:pixelated] group-hover/clip:opacity-88 group-hover/clip:duration-300"
          />
          {/* the chat field's box: noir, 2px 6px, 600 12/16, scaling in from its corner in 0.2s */}
          <motion.span ref={tagRef} aria-hidden className="group/tag pointer-events-none absolute top-0 left-0" style={{ x, y }}>
            <span className="block origin-top-left scale-0 bg-noir px-1.5 py-0.5 text-xs/4 font-semibold whitespace-nowrap text-ink opacity-0 transition-[opacity,scale] duration-200 ease-out group-data-on/tag:scale-100 group-data-on/tag:opacity-100 motion-reduce:scale-100">
              See project
            </span>
          </motion.span>
        </>
      )}
    </div>
  );
}
