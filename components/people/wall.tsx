"use client";

// The CRT wall between the intro and the values, with the services page's scroll-over: the wall
// (public/people/wall, three.js in the homepage's CarFrame) holds the screen while the rest of the
// page comes up over it as a sheet (people.module.css .wall and .after).
//
// What the page tells the scene on every scroll: how far the sheet has come up over it (0 to 1, the
// camera sinks with it) and whether the wall is off screen or fully covered (it stops rendering
// and pauses the clips).
import { useEffect, useRef } from "react";
import { CarFrame } from "@/components/sections/hero/car-frame";
import s from "./people.module.css";

type WallWindow = Window & { __paused?: boolean; __scroll?: number };

export function PeopleWall() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = ref.current!;
    const frame = section.querySelector("iframe")!;
    let onScreen = false;

    const sync = () => {
      const w = frame.contentWindow as WallWindow | null;
      if (!w) return;
      const r = section.getBoundingClientRect();
      const travel = Math.max(r.height - innerHeight, 1);
      w.__scroll = Math.min(Math.max(-r.top / travel, 0), 1);
      w.__paused = !onScreen || w.__scroll >= 1;
    };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; sync(); });
    io.observe(section);
    frame.addEventListener("load", sync);
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      io.disconnect();
      frame.removeEventListener("load", sync);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <section ref={ref} className={s.wall} aria-label="Our work, playing on a wall of televisions">
      <div className={s.wallFrame}>
        <CarFrame
          src="/people/wall/index.html"
          title="A wall of old CRT televisions in a dark room, each one playing a project of ours"
        />
      </div>
    </section>
  );
}
