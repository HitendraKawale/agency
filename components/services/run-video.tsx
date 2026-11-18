"use client";

// A video in a service's image run: muted, looping, playing only while on screen, and left on its
// poster for reduced motion (the same rule as the homepage reel).
import { useEffect, useRef } from "react";

type Props = { src: string; poster: string; width: number; height: number; alt: string; className?: string };

export function RunVideo({ src, poster, width, height, alt, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current!;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting && !still ? video.play().catch(() => {}) : video.pause()));
    io.observe(video);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      width={width}
      height={height}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
      // browser extensions (video speed controllers) tag <video> before React hydrates
      suppressHydrationWarning
    />
  );
}
