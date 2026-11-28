// Runs blurLevels (heat-blur.ts) for heat-logo.ts off the main thread. Takes { id, rgba, w, h, sigmas }
// and answers { id, levels }, handing the buffers over rather than copying them.
import { blurLevels } from "./heat-blur";

type Job = { id: number; rgba: Uint8ClampedArray; w: number; h: number; sigmas: number[] };

self.onmessage = ({ data }: MessageEvent<Job>) => {
  const levels = blurLevels(data.rgba, data.w, data.h, data.sigmas);
  (self as unknown as Worker).postMessage({ id: data.id, levels }, levels.map((l) => l.buffer));
};
