"use client";

// One place that registers GSAP's plugins and the page's easing, so every client module imports
// gsap from here and gets the same setup.
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);

/** cubic-bezier(.16,1,.3,1), the page's only curve. Same as --ease-expo in globals.css. */
export const EXPO = [0.16, 1, 0.3, 1] as const;
CustomEase.create("out", EXPO.join(","));

/**
 * True when the page runs its motion. The pre-paint script in app/layout.tsx adds `.intro` to <html>
 * unless the viewer prefers reduced motion or the URL has `?still` (static screenshots).
 */
export const motionOn = () => document.documentElement.classList.contains("intro");

export { gsap, ScrollTrigger, useGSAP };
