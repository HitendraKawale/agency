"use client";

// Other visitors on the page, live, after basement.studio's: their cursors, each with a label of
// [flag NAME] and whatever they last said, and my own chat. Press / to type a message at the
// cursor: Enter sends it (it shows to everyone on the page for 6 s), "@name" names my cursor,
// Escape closes. The connection and its rules are lib/realtime/client.ts.
//
// Cursors are drawn in the page's neutrals, not basement's orange: colour on this site is only ever
// the heat. They ease to each new position on a spring, and jump with the page as it scrolls.
import { AnimatePresence, motion, useReducedMotion, useSpring } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useReducer, useRef, useState } from "react";
import { connect, setChat, setName, useRealtime, type Cursor } from "@/lib/realtime/client";
import s from "./realtime.module.css";

const SPRING = { damping: 50, stiffness: 500 };
const LABEL = { initial: { opacity: 0, scale: 0 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0 }, transition: { duration: 0.2 } };

const flag = (c: string) => (/^[A-Z]{2}$/.test(c) ? String.fromCodePoint(...[...c].map((ch) => 127397 + ch.charCodeAt(0))) : "");
const tag = (country: string, name: string) => {
  const t = [flag(country), name.toUpperCase()].filter(Boolean).join(" ");
  return t ? `[${t}]` : "";
};

export function Realtime() {
  useEffect(connect, []);
  return (
    <div className={s.layer} aria-hidden>
      <Others />
      <Me />
    </div>
  );
}

function Others() {
  const cursors = useRealtime((st) => st.cursors);
  const path = usePathname();
  // re-place every cursor when the page scrolls or the window resizes
  const [tick, bump] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    let raf = 0;
    const on = () => void (raf ||= requestAnimationFrame(() => ((raf = 0), bump())));
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", on);
      removeEventListener("resize", on);
    };
  }, []);
  return Object.values(cursors)
    .filter((c) => c.path === path)
    .map((c) => <Other key={c.id} cursor={c} tick={tick} />);
}

function Other({ cursor, tick }: { cursor: Cursor; tick: number }) {
  const x = useSpring(0, SPRING), y = useSpring(0, SPRING);
  const placed = useRef(false), still = useReducedMotion();
  const at = () => ({ x: cursor.x * innerWidth, y: cursor.y - scrollY });
  useEffect(() => {
    const p = at();
    // the first position and reduced motion jump; later moves ease
    if (placed.current && !still) {
      x.set(p.x);
      y.set(p.y);
    } else {
      x.jump(p.x);
      y.jump(p.y);
    }
    placed.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor]);
  useEffect(() => {
    if (!placed.current) return;
    const p = at();
    x.jump(p.x);
    y.jump(p.y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);
  const label = tag(cursor.country, cursor.name);
  return (
    <motion.div className={s.cursor} style={{ x, y }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M1 1L6.5 14.5L8.5 8.5L14.5 6.5L1 1Z" />
      </svg>
      <div className={s.at}>
        <AnimatePresence mode="wait" initial={false}>
          {(label || cursor.msg) && (
            <motion.p key={cursor.msg ? `m:${cursor.msg}` : "label"} className={s.label} {...LABEL}>
              {label}
              {cursor.msg ? ` ${cursor.msg}` : ""}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Me() {
  const n = useRealtime((st) => st.n), name = useRealtime((st) => st.name), msg = useRealtime((st) => st.msg);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const [opens, setOpens] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const x = useSpring(0, SPRING), y = useSpring(0, SPRING);

  // follow the mouse, 16 px down and right, flipping to the other side at the window's edges
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const w = box.current?.offsetWidth ?? 0, h = box.current?.offsetHeight ?? 0;
      x.set(e.clientX + 16 + w > innerWidth ? e.clientX - 16 - w : e.clientX + 16);
      y.set(e.clientY + 16 + h > innerHeight ? e.clientY - 16 - h : e.clientY + 16);
    };
    addEventListener("mousemove", move, { passive: true });
    return () => removeEventListener("mousemove", move);
  }, [x, y]);

  // "/" opens the chat, unless typing somewhere else
  const here = n !== null;
  useEffect(() => {
    if (!here) return;
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key !== "/" || e.metaKey || e.ctrlKey || typing) return;
      e.preventDefault();
      setOpens((o) => o + 1);
      setOpen(true);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [here]);

  const close = () => {
    setOpen(false);
    setDraft("");
    setNote("");
  };
  const hint = note || (opens === 1 ? "Press enter to send message." : opens === 2 && !name ? "Type @name to change your name" : "");
  const mine = tag("", name);

  return (
    <motion.div ref={box} className={s.me} style={{ x, y }} data-open={open || undefined}>
      <AnimatePresence mode="popLayout" initial={false}>
        {open ? (
          <motion.div key="input" className={s.field} {...LABEL}>
            {/* sizes the field to its text */}
            <span aria-hidden>{draft || hint}</span>
            <input
              autoFocus
              // no intrinsic width: the hidden copy beside it sizes the field to the text
              size={1}
              value={draft}
              placeholder={hint}
              maxLength={120}
              spellCheck={false}
              aria-label="Message to everyone on the page"
              onChange={(e) => (setDraft(e.target.value), setNote(""))}
              onBlur={close}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Escape") close();
                if (e.key !== "Enter") return;
                const text = draft.trim(), named = text.match(/^@(.+)/);
                if (named) {
                  setName(named[1]);
                  setDraft("");
                  setNote(`Name set to ${named[1].trim().slice(0, 20).toUpperCase()}`);
                } else {
                  if (text) setChat(text);
                  close();
                }
              }}
            />
          </motion.div>
        ) : msg ? (
          <motion.p key="sent" className={s.label} {...LABEL}>
            {mine ? `${mine} ` : ""}
            {msg}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
