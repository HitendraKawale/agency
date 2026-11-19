"use client";

// The site's sound: moving the cursor plays soft Mist notes, the synth from patch.nrly.fun with
// nothing drawn. It covers the whole viewport and starts on the first click or key press, as browsers
// require. The nav's music button turns it on and off (lib/sound/music.ts). All of the sound lives in
// lib/sound/cursor-synth.ts; this mounts it once, in the layout, so page changes never stop it.
import { useEffect } from "react";
import { createCursorSynth } from "@/lib/sound/cursor-synth";
import { music } from "@/lib/sound/music";

export function CursorSynth() {
  useEffect(() => {
    const synth = createCursorSynth();
    synth.setEnabled(music.get());
    // synchronous, so the button's click itself starts or resumes the audio
    const off = music.subscribe(() => synth.setEnabled(music.get()));
    return () => {
      off();
      synth.dispose();
    };
  }, []);
  return null;
}
