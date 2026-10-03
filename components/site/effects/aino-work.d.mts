import type { EffectPreferences } from "./aino-kernel.mjs";

export type WorkView = "grid" | "list";

export type AinoWorkHost = {
  workView: WorkView;
  /** Called when the Grid/List buttons change the view. */
  onWorkView(view: WorkView): void;
  /** Replaces Aino's history.pushState after the list-row exit animation. */
  navigate(href: string): void;
};

export function createAinoWork(
  root: HTMLElement,
  initialPreferences: EffectPreferences,
  host: AinoWorkHost,
): {
  run(): Promise<void>;
  update(preferences: Partial<EffectPreferences>): void;
  dispose(): void;
};
