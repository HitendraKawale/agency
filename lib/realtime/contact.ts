// The /contact form's calls to the realtime worker (realtime/worker.ts): the Concierge's lines
// (POST /concierge) and the request itself (POST /contact). Same worker and URL as Ask anything.
// Bodies are JSON sent as text/plain, which the browser sends without a CORS preflight.
import type { Answers, ConciergeMoment } from "@/content/contact";

const URL_ = process.env.NEXT_PUBLIC_REALTIME_URL?.replace(/^ws/, "http");

/** False without NEXT_PUBLIC_REALTIME_URL: the form then shows its fixed lines and cannot send. */
export const realtimeEnabled = Boolean(URL_);

export type { Answers };

/**
 * Ask the Concierge for its line at `moment`. `onText` gets each piece as it is written. Resolves when
 * the line is complete, or quietly on any failure (the form keeps its fixed line). Rejects only when
 * `signal` aborts it.
 */
export async function conciergeLine(
  visit: string,
  moment: ConciergeMoment,
  answers: Answers,
  onText: (piece: string) => void,
  signal: AbortSignal,
): Promise<void> {
  if (!URL_) return;
  try {
    const res = await fetch(`${URL_}/concierge`, { method: "POST", body: JSON.stringify({ visit, moment, answers }), signal });
    if (!res.ok || !res.body) return;
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      if (value) onText(value);
    }
  } catch (error) {
    if (signal.aborted) throw error;
  }
}

/** Why a request did not send: too many from here (429), or the worker is down or missing. */
export type SendFailure = "limit" | "down";

/** Send the request. `website` is the hidden field only bots fill in. Resolves null once saved. */
export async function sendRequest(visit: string, answers: Answers, website: string): Promise<SendFailure | null> {
  if (!URL_) return "down";
  try {
    const res = await fetch(`${URL_}/contact`, { method: "POST", body: JSON.stringify({ visit, website, ...answers }) });
    if (res.status === 429) return "limit";
    return res.ok ? null : "down";
  } catch {
    return "down";
  }
}
