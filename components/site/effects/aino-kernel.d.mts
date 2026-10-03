export type MediaMode = "image" | "text" | "pixel";
export type Appearance = "dark" | "light";
export type EffectPreferences = { appearance: Appearance; mode: MediaMode };
export type ScrambleOptions = {
  speed?: number;
  duration?: number;
  random?: boolean;
  ready?: () => void;
};
export type AsciiOptions = {
  forceShow?: boolean;
  opacity?: number;
  onReady?: (element: HTMLDivElement) => void;
};
export type AinoEffects = {
  ascii(image: HTMLImageElement, options?: AsciiOptions): () => void;
  pixel(image: HTMLImageElement): () => void;
  scramble(element: HTMLElement, options?: ScrambleOptions): () => void;
  hover(): () => void;
  update(preferences: EffectPreferences): void;
  dispose(): void;
};
export function createAinoEffects(root: HTMLElement, preferences: EffectPreferences): AinoEffects;
