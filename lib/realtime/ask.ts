// Questions to the realtime worker's POST /ask (realtime/ask.ts). It is the same worker as the
// room, so the URL is NEXT_PUBLIC_REALTIME_URL over http(s). The answer arrives as plain text in
// pieces. The question goes as a text/plain body, which the browser sends without a CORS preflight.

const URL_ = process.env.NEXT_PUBLIC_REALTIME_URL?.replace(/^ws/, "http");

export const askEnabled = Boolean(URL_);

/** Why there is no answer: this visitor asked too often (429), or the worker or model is down. */
export type AskFailure = "limit" | "down";

/**
 * Ask `question`. `onText` gets each piece of the answer as it arrives. Resolves with null once the
 * answer is complete, or with the failure. Rejects only when `signal` aborts it.
 */
export async function ask(question: string, onText: (piece: string) => void, signal: AbortSignal): Promise<AskFailure | null> {
  try {
    const res = await fetch(`${URL_}/ask`, { method: "POST", body: question, signal });
    if (res.status === 429) return "limit";
    if (!res.ok || !res.body) return "down";
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return null;
      if (value) onText(value);
    }
  } catch (error) {
    if (signal.aborted) throw error;
    return "down";
  }
}
