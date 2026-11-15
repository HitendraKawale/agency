"use client";

// One question, after Symbol's accordion (symbolstudio.pl/en, FAQ, measured live at 1440): question
// 22/1.4 regular, grey when closed and full colour when open; hairline rules between rows (theirs, kept
// as in the source); a 40px round +/- on the right; answer 16/1.3, ~26px under the question.
// Motion animates the answer's height, so it opens the same way in every browser.
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import { EXPO } from "@/lib/motion/gsap";
import s from "./faq.module.css";

type Props = { q: string; a: string; defaultOpen?: boolean; delay: number };

export function FaqItem({ q, a, defaultOpen = false, delay }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  const id = useId();

  return (
    <div className={s.item} data-open={open || undefined} data-reveal="fade" data-delay={delay.toFixed(2)}>
      <h3>
        <button type="button" className={s.question} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
          {q}
          <i aria-hidden />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            role="region"
            className={s.answer}
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: reduce ? 0 : 0.5, ease: EXPO }}
          >
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
