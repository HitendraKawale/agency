"use client";

// "Online (n)" in the nav: how many people have the site open, live, from the realtime room
// (lib/realtime/client.ts). Nothing shows until the room answers, or ever without a room URL.
// Hovering it says how to chat, as basement's does.
import { useRealtime } from "@/lib/realtime/client";

export function Online({ className, tipClassName }: { className?: string; tipClassName?: string }) {
  const n = useRealtime((s) => s.n);
  if (n === null || n < 1) return null;
  return (
    <span className={className}>
      <i aria-hidden />
      Online <sup aria-label={`${n} people`}>({n})</sup>
      <span role="tooltip" className={tipClassName}>
        Press / to chat
      </span>
    </span>
  );
}
