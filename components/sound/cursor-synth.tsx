"use client";

// The site's sound: moving the cursor plays soft Mist notes, the synth from patch.nrly.fun with
// nothing drawn. It covers the whole viewport and starts on the first click or key press, as browsers
// require. All of it lives in lib/sound/cursor-synth.ts; this only mounts it once.
import { useEffect } from "react";
import { createCursorSynth } from "@/lib/sound/cursor-synth";

export function CursorSynth() {
  useEffect(() => createCursorSynth().dispose, []);
  return null;
}
