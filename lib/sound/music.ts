// Whether the site's sound is on. It starts on for every visit and lives in module scope, so it holds
// across page changes (links are client-side). The nav's music button flips it; the cursor synth
// listens and starts or pauses its audio inside the same click, which browsers need for resuming.
import { useSyncExternalStore } from "react";

let on = true;
const listeners = new Set<() => void>();

export const music = {
  get: () => on,
  set(next: boolean) {
    if (next === on) return;
    on = next;
    for (const l of listeners) l();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export const useMusic = () => useSyncExternalStore(music.subscribe, music.get, () => true);
