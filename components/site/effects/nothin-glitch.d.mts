import type { gsap } from "gsap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";

/** F is gsap and Oe is ScrollTrigger, as in noth.in's bundle. */
export function createNothinGlitch(
  F: typeof gsap,
  Oe: typeof ScrollTrigger,
): { init(): void; destroy(): void };
