"use client";

// The FAQ's last row: a question the visitor writes. It sits in the same shell as the questions
// above (faq-item.tsx): the placeholder "Ask anything" takes the place and type of a question, and
// the round button on the right sends it. Enter opens the answer below with the same height motion,
// and the answer streams in from the model (lib/realtime/ask.ts), each piece fading in after
// Beautiful UI's Streaming Text. While it streams the button stops it; a new question replaces it.
import { ArrowRight, Square } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import type { HomeContent } from "@/content/home";
import { ask, type AskFailure } from "@/lib/realtime/ask";
import { EXPO } from "@/lib/motion/gsap";
import s from "./faq.module.css";

type Props = HomeContent["faq"]["ask"] & { delay: number };
type Answer = { pieces: string[]; streaming: boolean; failure: AskFailure | null };

export function FaqAsk({ placeholder, label, errors, delay }: Props) {
  const [draft, setDraft] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const running = useRef<AbortController | null>(null);
  const reduce = useReducedMotion();
  const id = useId();

  useEffect(() => () => running.current?.abort(), []);

  const stop = () => {
    running.current?.abort();
    running.current = null;
    setAnswer((a) => a && { ...a, streaming: false });
  };

  const send = async () => {
    const question = draft.trim();
    if (!question) return;
    running.current?.abort();
    const run = (running.current = new AbortController());
    setAnswer({ pieces: [], streaming: true, failure: null });
    try {
      const failure = await ask(question, (piece) => setAnswer((a) => a && { ...a, pieces: [...a.pieces, piece] }), run.signal);
      setAnswer((a) => a && { ...a, streaming: false, failure });
    } catch {
      // stopped, or replaced by a newer question
    } finally {
      if (running.current === run) running.current = null;
    }
  };

  const streaming = answer?.streaming ?? false;

  return (
    <div className={s.item} data-open={answer ? true : undefined} data-reveal="fade" data-delay={delay.toFixed(2)}>
      <form
        className={`${s.question} ${s.ask}`}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={label}
          aria-controls={id}
          maxLength={300}
          autoComplete="off"
          enterKeyHint="send"
        />
        {streaming ? (
          <button type="button" className={s.send} onClick={stop} aria-label="Stop the answer">
            <Square size={10} strokeWidth={0} fill="currentColor" aria-hidden />
          </button>
        ) : (
          <button type="submit" className={s.send} disabled={!draft.trim()} aria-label="Ask">
            <ArrowRight size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          </button>
        )}
      </form>
      <AnimatePresence initial={false}>
        {answer && (
          <motion.div
            id={id}
            role="region"
            aria-label="Answer"
            aria-live="polite"
            aria-busy={streaming}
            className={s.answer}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: reduce ? 0 : 0.5, ease: EXPO }}
          >
            <p>
              {answer.failure
                ? errors[answer.failure]
                : answer.pieces.map((piece, i) => (
                    <span key={i} className={s.piece}>
                      {piece}
                    </span>
                  ))}
              {streaming && <span className={s.caret} aria-hidden />}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
