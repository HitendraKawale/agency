"use client";
// One showcase tile: the client's mark on its own ground, linking to the case study. A tile with a
// montage plays it on hover, from the start, over the still; leaving fades back to the still.
// The video has preload="none", so nothing downloads until someone hovers. Pointers that can't
// hover, and reduced motion, keep the still.
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { ShowcaseProject } from "@/content/showcase";
import { cn } from "@/lib/utils";
import s from "./showcase.module.css";

const canPlay = () => matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches;

export function Tile({ project, eager }: { project: ShowcaseProject; eager: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  if ("soon" in project) return <SoonTile project={project} eager={eager} />;
  const montage = "montage" in project ? project.montage : undefined;

  const start = () => {
    const v = video.current;
    if (!v || !canPlay()) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    v.dataset.on = "";
  };
  const stop = () => {
    const v = video.current;
    if (!v) return;
    delete v.dataset.on;
    // pause once the fade is over, so the clip doesn't freeze mid-fade
    setTimeout(() => !("on" in v.dataset) && v.pause(), 200);
  };

  return (
    <Link
      className={cn(s.tile, s.ticks, "relative block aspect-video")}
      href={`/showcase/${project.slug}`}
      aria-label={`View ${project.name}`}
      data-montage={montage ? "" : undefined}
      onPointerEnter={start}
      onPointerLeave={stop}
      onFocus={start}
      onBlur={stop}
    >
      {/* the first row is above the fold, and one of its tiles is the page's largest paint */}
      <Image
        src={`/showcase/tiles/${project.slug}.webp`}
        alt=""
        width={1920}
        height={1080}
        sizes="(max-width: 1023px) 100vw, 25vw"
        loading={eager ? "eager" : "lazy"}
        className="block size-full object-cover"
      />
      {montage && (
        <video
          ref={video}
          src={montage}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-200 data-on:opacity-100"
        />
      )}
    </Link>
  );
}

// a project that isn't out yet: its tile, saying so, and nowhere to go
function SoonTile({ project, eager }: { project: ShowcaseProject; eager: boolean }) {
  return (
    <div className={cn(s.tile, s.ticks, "relative aspect-video")}>
      <Image
        src={`/showcase/tiles/${project.slug}.webp`}
        alt={`${project.name} mark`}
        width={1920}
        height={1080}
        sizes="(max-width: 1023px) 100vw, 25vw"
        loading={eager ? "eager" : "lazy"}
        className="block size-full object-cover"
      />
      <p className={cn(s.p, "absolute inset-x-0 bottom-4 text-center font-semibold text-ink-3")}>
        Coming soon
      </p>
    </div>
  );
}
