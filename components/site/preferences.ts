"use client";

import { useSyncExternalStore } from "react";

/**
 * The Settings panel's two choices, Aino's Mood and Img. They live on
 * `<html data-mood data-mode>` (written before first paint by the boot script
 * in app/layout.tsx) and in localStorage, so CSS and the effect kernel read the
 * same source and a reload keeps the choice.
 */

export type Mood = "dark" | "light";
export type MediaMode = "image" | "text" | "pixel";
export type Preferences = { appearance: Mood; mode: MediaMode };

const STORAGE_KEY = "blank-site";
const CHANGE_EVENT = "blank-site-preferences";
const DEFAULT_SNAPSHOT = "dark:image";

export function readPreferences(): Preferences {
  const { mood, mode } = document.documentElement.dataset;
  return {
    appearance: mood === "light" ? "light" : "dark",
    mode: mode === "text" || mode === "pixel" ? mode : "image",
  };
}

export function setPreferences(update: Partial<Preferences>) {
  const next = { ...readPreferences(), ...update };
  const root = document.documentElement;
  root.dataset.mood = next.appearance;
  root.dataset.mode = next.mode;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private windows can refuse storage; the choice still holds for this visit.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function snapshot() {
  const { appearance, mode } = readPreferences();
  return `${appearance}:${mode}`;
}

/** Re-renders on every Settings change, in this tab or another. */
export function usePreferences(): Preferences {
  const [appearance, mode] = useSyncExternalStore(
    subscribe,
    snapshot,
    () => DEFAULT_SNAPSHOT,
  ).split(":") as [Mood, MediaMode];
  return { appearance, mode };
}

export function subscribePreferences(onChange: () => void) {
  return subscribe(onChange);
}

export function motionAllowed() {
  return (
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    document.visibilityState === "visible"
  );
}
