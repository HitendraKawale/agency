"use client";

import { createAinoEffects, type AinoEffects } from "./effects/aino-kernel.mjs";
import { readPreferences } from "./preferences";

/**
 * Aino's own effect code (pinned and extracted from reference/aino, see
 * effects/aino-kernel.mjs), bound to one region of the page. Settings live on
 * <html>, so every region reads the same Mood and Img.
 */
export function effectsFor(root: HTMLElement): AinoEffects {
  return createAinoEffects(root, readPreferences());
}
