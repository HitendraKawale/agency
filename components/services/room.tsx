"use client";

// The /services hero, basement's way (basement.studio/services, read live 2026-11-18): the scene
// is fixed to the viewport, full height, and the page starts one screen down on the page colour
// and scrolls up over it. The scene is the standalone three.js page in public/services/room, in
// the homepage's CarFrame (mouse passed up to the live cursors, ?t and the ready flag).
//
// What the page tells the scene, on every scroll: how far it has scrolled (its camera sinks with
// it, so you seem to go down through the room), whether it is covered (it stops rendering), and
// whether the visitor has gone quiet near the top (the big screen cuts to its scroll-down card).
import { useEffect, useRef } from "react";
import { CarFrame } from "@/components/sections/hero/car-frame";
import s from "./services.module.css";

/** seconds without scrolling, near the top, before the screen asks for a scroll */
const IDLE = 3.5;

type RoomWindow = Window & { __paused?: boolean; __scroll?: number; __idle?: boolean; __ready?: boolean };

export function ServicesRoom() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = ref.current!.querySelector("iframe")!;
    const win = () => frame.contentWindow as RoomWindow | null;
    // the countdown only runs once the scene has drawn: it loads for longer than IDLE, and its first
    // frame should be the services, not the scroll-down card
    let quiet = 0, idle = false, ready = false, waiting = 0;

    const sync = () => {
      const w = win();
      if (!w) return;
      w.__paused = window.scrollY > window.innerHeight;
      w.__scroll = window.scrollY / window.innerHeight;
      w.__idle = idle;
    };
    // every scroll ends the idle card and restarts the countdown, while the scene is mostly in view
    const scrolled = () => {
      clearTimeout(quiet);
      idle = false;
      if (ready && window.scrollY < window.innerHeight * 0.4) {
        quiet = window.setTimeout(() => { idle = true; sync(); }, IDLE * 1000);
      }
      sync();
    };
    const awaitReady = () => {
      if (win()?.__ready) {
        ready = true;
        scrolled();
      } else waiting = requestAnimationFrame(awaitReady);
    };

    scrolled();
    awaitReady();
    frame.addEventListener("load", sync);
    window.addEventListener("scroll", scrolled, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      clearTimeout(quiet);
      cancelAnimationFrame(waiting);
      frame.removeEventListener("load", sync);
      window.removeEventListener("scroll", scrolled);
      window.removeEventListener("resize", sync);
    };
  }, []);

  return (
    <div ref={ref} className={s.room}>
      <CarFrame
        src="/services/room/index.html"
        title="A kid typing at a Macintosh on the floor beside a big screen that plays our services"
      />
    </div>
  );
}
