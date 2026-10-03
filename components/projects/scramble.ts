/**
 * Text scramble, ported from reference/lebedev/js/inline/17_at202867.js
 * (v6): CONFIG, CHARS, the per-character queue and the flicker interval are
 * theirs. Classes toggled on the element: is-scrambling, is-done.
 */

export const CONFIG = {
  charStagger: 42,
  scrambleMin: 520,
  scrambleMax: 920,
} as const;

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

/** Desktop gate from the source (DESKTOP_MIN). */
export const SCRAMBLE_DESKTOP_MIN = 992;

type QueueItem = {
  from: string;
  to: string;
  start: number;
  end: number;
  char: string | null;
  lastFlicker: number;
};

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)] ?? "";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Scrambles `el` from `oldText` into `newText`. Returns a cancel function.
 * Reduced motion sets the text at once (their setText branch).
 */
export function scrambleText(el: HTMLElement, newText: string, oldText = el.textContent ?? "") {
  if (prefersReducedMotion()) {
    el.textContent = newText;
    el.classList.remove("is-scrambling");
    el.classList.add("is-done");
    return () => {};
  }

  const length = Math.max(oldText.length, newText.length);
  el.classList.remove("is-done");
  el.classList.add("is-scrambling");

  const queue: QueueItem[] = [];
  for (let i = 0; i < length; i++) {
    const start = i * CONFIG.charStagger + Math.random() * 40;
    const end = start + CONFIG.scrambleMin + Math.random() * (CONFIG.scrambleMax - CONFIG.scrambleMin);
    queue.push({ from: oldText[i] ?? "", to: newText[i] ?? "", start, end, char: null, lastFlicker: 0 });
  }

  const startTime = performance.now();
  let frame = 0;

  const update = () => {
    const now = performance.now();
    const elapsed = now - startTime;
    let output = "";
    let complete = 0;

    for (const item of queue) {
      if (elapsed >= item.end) {
        complete++;
        output += item.to;
      } else if (elapsed >= item.start) {
        if (!item.char || now - item.lastFlicker > 55 + Math.random() * 45) {
          item.char = randomChar();
          item.lastFlicker = now;
        }
        output += item.char;
      } else {
        output += item.from;
      }
    }

    el.textContent = output;

    if (complete === queue.length) {
      el.classList.remove("is-scrambling");
      el.classList.add("is-done");
    } else {
      frame = requestAnimationFrame(update);
    }
  };

  update();
  return () => cancelAnimationFrame(frame);
}

/** Picks a phrase, never the one shown last (sessionStorage, as theirs). */
export function pickPhrase(phrases: readonly string[], storageKey: string) {
  if (phrases.length === 1) return phrases[0] ?? "";

  let last = "";
  try {
    last = sessionStorage.getItem(storageKey) ?? "";
  } catch {}

  let pool = phrases.filter((phrase) => phrase !== last);
  if (!pool.length) pool = phrases.slice();

  const next = pool[Math.floor(Math.random() * pool.length)] ?? "";

  try {
    sessionStorage.setItem(storageKey, next);
  } catch {}

  return next;
}
