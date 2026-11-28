"use client";

// The /contact form. One line at a time at big-type size: four questions, then a closing screen
// (the team, a short paragraph on what happens next, Send), then the thank-you. Words are in
// content/contact.ts.
//
// The stack is creatoroly's request form at our scale: the current line sharp, the one before it
// above at 20% with a 5px blur, fading out upward and clipped before the title, moves on
// cubic-bezier(.22,.8,.25,1) over 0.6s.
//
// Each question is written out before anything can be typed: the answer field and the buttons fade
// in only when the line is complete, and focus moves into the field then. Questions marked `agent`
// are asked of the Concierge (realtime/concierge.ts), which rewrites them from the answers so far
// and streams them in; if it hasn't started within WAIT, or isn't configured, the fixed line is
// written out word by word instead, so the form never waits on the model. Arriving at the company
// question fills in the organisation the email's domain suggests. The closing paragraph is a
// template; the Concierge only names the project in it ("your booking site").
//
// Next and Send are the site's quiet button ("See the work"), Next dim until the answer would be accepted; as it becomes ready its
// label strikes like the nav links' tubelight (.tube-on in globals.css). Return moves on, Shift
// Return adds a line in the project field, Backspace in an empty field goes back, and clicking the
// faded line returns to it. ?name=&email=&company=&details= prefills the answers: that is the link a
// visitor's own agent builds from /contact.md.
import Image from "next/image";
import { ArrowBigUp, CornerDownLeft, type LucideIcon } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { contact, organisationFromEmail, type Answers, type ConciergeMoment, type Field, type Step } from "@/content/contact";
import { conciergeLine, realtimeEnabled, sendRequest } from "@/lib/realtime/contact";
import { cn } from "@/lib/utils";

const STEPS: readonly Step[] = contact.steps;
const LAST = STEPS.length - 1;
const FIELDS: readonly Field[] = ["name", "email", "company", "details"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WAIT = 1500; // ms the Concierge has to start a line before the fixed one shows
const WORD = 70; // ms per word as a line is written out
const MAX_LINE = 140; // characters; anything longer from the model is cut off
const EASE = "cubic-bezier(.22,.8,.25,1)";
const NBSP = " ";

/** What stops `step` being accepted with these answers, or null when nothing does. */
function problem(step: Step, a: Answers): string | null {
  if (step.kind !== "ask") return null;
  const value = a[step.field].trim();
  if (step.field === "email" && value && !EMAIL.test(value)) return contact.errors.email;
  if (step.optional || value) return null;
  return step.need ?? "";
}

/**
 * The Concierge's project name if it reads right: "your", then only words the person wrote.
 * Anything else (an invented "platform", a sentence, nothing) is null and the fallback is used.
 */
function projectName(text: string, details: string): string | null {
  const name = text.trim().toLowerCase().replace(/[."']/g, "");
  const words = name.split(/\s+/);
  if (words[0] !== "your" || words.length < 2 || words.length > 6 || name === "your project") return null;
  const wrote = details.toLowerCase();
  return words.slice(1).every((w) => ["for", "a", "an", "the", "of", "and", "to", "new"].includes(w) || wrote.includes(w)) ? name : null;
}

/** This visit's id, kept for the tab, so a reload talks to the same Concierge. */
function visitId() {
  try {
    const saved = sessionStorage.getItem("contact-visit");
    if (saved) return saved;
    const id = crypto.randomUUID();
    sessionStorage.setItem("contact-visit", id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

// The homepage's "fade" (lib/motion/choreography.ts): from transparent, a 10px blur and 8px low,
// sharpening into place over 1.1s on the site's one curve (--ease-expo).
const EXPO = "cubic-bezier(.16,1,.3,1)";
const FADE = `opacity 1.1s ${EXPO}, filter 1.1s ${EXPO}, translate 1.1s ${EXPO}`;

/** Play the fade on an element as it mounts. A stable function, so React calls it on mount only. */
function fadeIn(el: HTMLElement | null) {
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(
    [
      { opacity: 0, filter: "blur(10px)", translate: "0 8px" },
      { opacity: 1, filter: "blur(0px)", translate: "0 0" },
    ],
    { duration: 1200, easing: EXPO, fill: "backwards" },
  );
}

/** A line as word spans that each fade in as they arrive, like the homepage headline's words. */
function Words({ text }: { text: string }) {
  if (!text) return NBSP;
  return text.split(" ").map((w, i) => (
    // spaces stay as text between the spans, so the line wraps as plain text would
    <Fragment key={i}>
      {i > 0 && " "}
      <span ref={fadeIn} className="inline-block">{w}</span>
    </Fragment>
  ));
}

function Key({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <kbd aria-label={label} className="inline-grid size-[30px] place-items-center rounded-[6px] bg-raised font-sans text-ink-1">
      <Icon aria-hidden className="size-4" strokeWidth={2} />
    </kbd>
  );
}

export function RequestForm() {
  const [answers, setAnswers] = useState<Answers>({ name: "", email: "", company: "", details: "" });
  const [active, setActive] = useState(0);
  /** each step's line as written so far */
  const [shown, setShown] = useState<Record<number, string>>({ 0: contact.steps[0].line as string });
  /** steps whose line is fully written, so their field and buttons can show */
  const [written, setWritten] = useState<Record<number, boolean>>({ 0: true });
  const [msg, setMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<"form" | "sending" | "sent">("form");
  const [sentLine, setSentLine] = useState("");
  const [copied, setCopied] = useState(false);
  const [heights, setHeights] = useState<number[]>([]);
  const reduced = useReducedMotion() ?? false;

  const steps = useRef<(HTMLDivElement | null)[]>([]);
  const fields = useRef<Partial<Record<Field, HTMLInputElement | HTMLTextAreaElement | null>>>({});
  const hint = useRef<HTMLDivElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const visit = useRef("");
  const started = useRef(new Set([0]));
  const cleanups = useRef<(() => void)[]>([]);
  const moved = useRef(false);

  // the visit id, and a prefill from the link an agent built
  useEffect(() => {
    visit.current = visitId();
    const q = new URLSearchParams(location.search);
    if (FIELDS.some((f) => q.get(f))) {
      // once, after hydration: reading the URL during render would differ from the server's empty form
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswers(Object.fromEntries(FIELDS.map((f) => [f, (q.get(f) ?? "").slice(0, f === "details" ? 2000 : 120)])) as Answers);
    }
    const pending = cleanups.current;
    return () => pending.forEach((stop) => stop());
  }, []);

  // every step's height, kept current as lines stream in and the project field grows
  useLayoutEffect(() => {
    const measure = () => setHeights(steps.current.map((el) => el?.offsetHeight ?? 0));
    measure();
    const observer = new ResizeObserver(measure);
    steps.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [status]);

  // the project field grows with what is typed
  useLayoutEffect(() => {
    const el = fields.current.details;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [answers.details]);

  // once a step's line is written: focus its field, or Send on the closing screen
  const ready = !!written[active];

  // The Next row shows a frame after the step it belongs to is written and measured, so it has
  // already been drawn, hidden, at its new place: it fades in there instead of sliding to it.
  const [hintFor, setHintFor] = useState(-1);
  const placed = ready && (heights[active] ?? 0) > 0;
  useEffect(() => {
    if (!placed) return;
    const frame = requestAnimationFrame(() => setHintFor(active));
    return () => cancelAnimationFrame(frame);
  }, [placed, active]);
  useEffect(() => {
    if (!moved.current || !ready) return;
    const step = STEPS[active];
    const el = step.kind === "ask" ? fields.current[step.field] : hint.current?.querySelector("button");
    const timer = setTimeout(() => el?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(timer);
  }, [active, ready]);

  /** Write a line out word by word, then call `done`. */
  const writeOut = (line: string, set: (text: string) => void, done: () => void) => {
    if (reduced) return (set(line), done());
    const words = line.split(" ");
    let n = 0;
    const timer = setInterval(() => {
      set(words.slice(0, ++n).join(" "));
      if (n < words.length) return;
      clearInterval(timer);
      done();
    }, WORD);
    cleanups.current.push(() => clearInterval(timer));
  };

  /**
   * Ask the Concierge for `moment`, giving up after WAIT with no text. `onText` gets the text so far
   * as it arrives; `onEnd` gets all of it, or "" when it failed or was too slow.
   */
  const ask = (moment: ConciergeMoment, a: Answers, onText: ((text: string) => void) | null, onEnd: (text: string) => void) => {
    if (!realtimeEnabled) return onEnd("");
    const abort = new AbortController();
    let text = "";
    let over = false;
    const end = (result: string) => {
      if (over) return;
      over = true;
      clearTimeout(timer);
      onEnd(result);
    };
    const timer = setTimeout(() => (text ? undefined : (abort.abort(), end(""))), WAIT);
    cleanups.current.push(() => (clearTimeout(timer), abort.abort()));
    conciergeLine(visit.current, moment, a, (piece) => {
      if (over || text.length > MAX_LINE) return;
      text += piece;
      onText?.(text.slice(0, MAX_LINE).trim());
    }, abort.signal)
      .then(() => end(text.slice(0, MAX_LINE).trim()))
      .catch(() => end(""));
  };

  /** Show step `i`'s line for answers `a`, then mark it written. */
  const speak = (i: number, a: Answers) => {
    const set = (text: string) => setShown((m) => ({ ...m, [i]: text }));
    const done = () => setWritten((m) => ({ ...m, [i]: true }));
    const step = STEPS[i];
    set("");
    if (step.kind === "close") {
      // the Concierge names the project if there's enough to name; the paragraph is ours
      const say = (name: string | null) => writeOut(contact.close.paragraph(a, name ?? contact.close.fallback), set, done);
      if (a.details.trim().split(/\s+/).length < 4) return say(null);
      return ask("project", a, null, (text) => say(projectName(text, a.details)));
    }
    if (!step.agent) return writeOut(step.line, set, done);
    ask(step.field as ConciergeMoment, a, set, (text) => (text ? done() : writeOut(step.line, set, done)));
  };

  const shake = (i: number) => {
    const el = steps.current[i];
    if (!el) return;
    el.classList.remove("animate-shake");
    void el.offsetWidth; // restart the animation
    el.classList.add("animate-shake");
  };

  const go = (i: number) => {
    if (i < 0 || i > LAST || i === active || status !== "form") return;
    if (i > active) {
      for (let k = active; k < i; k++) {
        const p = problem(STEPS[k], answers);
        if (p === null) continue;
        setActive(k);
        shake(k);
        setMsg(p);
        return;
      }
    }
    // nothing can be typed into a step that's leaving while the next line is written
    (document.activeElement as HTMLElement | null)?.blur();
    moved.current = true;
    setMsg(null);
    setActive(i);
    let a = answers;
    const step = STEPS[i];
    if (step.kind === "ask" && step.field === "company" && !a.company.trim()) {
      a = { ...a, company: organisationFromEmail(a.email) };
      setAnswers(a);
    }
    if (!started.current.has(i)) {
      started.current.add(i);
      speak(i, a);
    }
  };

  const submit = async () => {
    if (status !== "form" || !written[LAST]) return;
    const missing = STEPS.findIndex((s) => problem(s, answers) !== null);
    if (missing >= 0) {
      setActive(missing);
      shake(missing);
      setMsg(problem(STEPS[missing], answers));
      return;
    }
    setStatus("sending");
    setMsg(null);
    const trimmed = Object.fromEntries(FIELDS.map((f) => [f, answers[f].trim()])) as Answers;
    const failure = await sendRequest(visit.current, trimmed, honeypot.current?.value ?? "");
    if (failure) {
      setStatus("form");
      setMsg(contact.errors[failure]);
      return;
    }
    setStatus("sent");
    setSentLine("");
    const fixed = contact.sent(trimmed.name);
    ask("sent", trimmed, setSentLine, (text) => !text && writeOut(fixed, setSentLine, () => {}));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.handoff.prompt);
      setCopied(true);
    } catch {
      // no clipboard (an old or locked-down browser): the label stays as it was
    }
  };

  const onKey = (i: number) => (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !(e.shiftKey && e.currentTarget.tagName === "TEXTAREA")) {
      e.preventDefault();
      go(i + 1);
    } else if (e.key === "Backspace" && e.currentTarget.value === "" && i > 0) {
      e.preventDefault();
      go(i - 1);
    }
  };

  const step = STEPS[active];
  const accepted = step.kind === "close" || (problem(step, answers) === null && (step.optional || answers[step.field].trim() !== ""));
  const h = heights[active] ?? 0;
  /** heights are known only after the first layout; until then nothing below a line may show */
  const measured = h > 0;
  const showHint = ready && measured && hintFor === active;
  const move = reduced ? "none" : `transform .6s ${EASE}, opacity .45s ease, filter .45s ease`;
  /** how a field comes in once the line above it is written: the homepage fade */
  const reveal = (on: boolean) => ({
    opacity: on ? 1 : 0,
    filter: on ? "none" : "blur(10px)",
    translate: on ? "0 0" : "0 8px",
    transition: reduced ? "none" : FADE,
  });

  return (
    <main className="grid-12 mt-[56px] min-h-[calc(100svh-92px)] content-start max-[760px]:mt-10">
      <h1 className="s-title in row-start-1">{contact.title}</h1>
      {status !== "sent" && (
        <button
          type="button"
          onClick={copy}
          className="col-[8/-1] row-start-1 cursor-pointer self-end justify-self-end text-[20px] leading-[1.25] tracking-[-0.01em] text-ink-3 transition-colors hover:text-ink-1 max-[760px]:col-[1/-1] max-[760px]:row-start-3 max-[760px]:mt-6 max-[760px]:justify-self-start"
        >
          {copied ? contact.handoff.copied : contact.handoff.label}
        </button>
      )}

      {status === "sent" ? (
        <p aria-live="polite" className="big-type col-[1/span_10] row-start-2 mt-[220px] text-ink max-[760px]:col-[1/-1] max-[760px]:mt-[150px]">
          <Words text={sentLine} />
        </p>
      ) : (
        <form
          noValidate
          onSubmit={(e) => (e.preventDefault(), submit())}
          className="relative col-[1/span_10] row-start-2 mt-[220px] [clip-path:inset(-170px_-100vw_-100vw_-100vw)] max-[760px]:col-[1/-1] max-[760px]:mt-[150px] max-[760px]:[clip-path:inset(-110px_-100vw_-100vw_-100vw)]"
          style={{ height: h + 140 }}
        >
          {STEPS.map((s, i) => {
            const d = i - active;
            const own = heights[i] ?? 0;
            const y = d === 0 ? 0 : d === -1 ? -(own + 36) : d < -1 ? -(own + 76) : h + 94;
            const seen = d === 0 || d === -1;
            const line = shown[i] ?? "";
            const live = d === 0 && !!written[i];
            return (
              <div
                key={i}
                ref={(el) => {
                  steps.current[i] = el;
                }}
                inert={!seen}
                aria-hidden={d !== 0}
                onPointerDown={d === -1 ? (e) => (e.preventDefault(), go(i)) : undefined}
                className={cn("absolute inset-x-0 top-0", d === -1 && "cursor-pointer")}
                style={{
                  transform: `translateY(${y}px)`,
                  opacity: d === 0 ? 1 : d === -1 ? 0.2 : 0,
                  filter: d === 0 ? "none" : `blur(${d === -1 ? 5 : 10}px)`,
                  maskImage: d === -1 ? "linear-gradient(to top, #000 35%, transparent)" : undefined,
                  visibility: seen ? "visible" : "hidden",
                  transition: reduced ? "none" : `${move}, visibility 0s linear ${seen ? "0s" : ".45s"}`,
                }}
              >
                {s.kind === "ask" ? (
                  <>
                    <label htmlFor={`q-${s.field}`} className="big-type block text-ink-3"><Words text={line} /></label>
                    <div style={reveal(!!written[i] && measured)}>
                      {s.long ? (
                        <textarea
                          id={`q-${s.field}`}
                          ref={(el) => {
                            fields.current[s.field] = el;
                          }}
                          rows={1}
                          tabIndex={live ? 0 : -1}
                          readOnly={!live}
                          value={answers[s.field]}
                          placeholder={s.placeholder}
                          maxLength={2000}
                          onChange={(e) => (setAnswers((a) => ({ ...a, [s.field]: e.target.value })), setMsg(null))}
                          onKeyDown={onKey(i)}
                          className="mt-[22px] block w-full resize-none overflow-hidden bg-transparent p-0 text-[clamp(28px,2.6vw,38px)] leading-[1.1] font-semibold tracking-[-0.03em] text-ink caret-ink outline-none placeholder:text-ink-4"
                        />
                      ) : (
                        <input
                          id={`q-${s.field}`}
                          ref={(el) => {
                            fields.current[s.field] = el;
                          }}
                          type={s.field === "email" ? "email" : "text"}
                          autoComplete={s.field === "company" ? "organization" : s.field}
                          tabIndex={live ? 0 : -1}
                          readOnly={!live}
                          value={answers[s.field]}
                          placeholder={s.placeholder}
                          maxLength={120}
                          onChange={(e) => (setAnswers((a) => ({ ...a, [s.field]: e.target.value })), setMsg(null))}
                          onKeyDown={onKey(i)}
                          className="mt-[14px] block w-full bg-transparent p-0 text-[clamp(40px,5.28vw,76px)] leading-[0.95] font-semibold tracking-[-0.04em] text-ink caret-ink outline-none placeholder:text-ink-4"
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-8 flex gap-2.5 max-[760px]:mb-5">
                      {contact.close.team.map((src) => (
                        <Image key={src} src={src} alt="" width={72} height={72} className="size-[72px] rounded-full object-cover object-[50%_20%] max-[760px]:size-14" />
                      ))}
                    </div>
                    <p id="close-line" className="max-w-[30em] text-[clamp(24px,2.3vw,34px)] leading-[1.18] font-semibold tracking-[-0.03em] text-ink">
                      <Words text={line} />
                    </p>
                  </>
                )}
              </div>
            );
          })}

          <div
            ref={hint}
            inert={!showHint}
            className="absolute top-0 left-0 flex items-center gap-6 text-[20px] leading-[1.25] tracking-[-0.01em] text-ink-3"
            style={{
              // its place under the line changes at once (the line wraps as it streams, the field
              // grows as it's typed in); only the homepage fade animates. Animating the place made it
              // slide down from the top.
              transform: `translateY(${h + 32}px)`,
              translate: showHint ? "0 0" : "0 8px",
              filter: showHint ? "none" : "blur(10px)",
              opacity: showHint ? 1 : 0,
              transition: reduced || !showHint ? "none" : FADE,
            }}
          >
            {/* separate keys: reusing one <button> would let the click that reaches the last step also
                submit, because its type turns to submit before the click's default action runs */}
            {active === LAST ? (
              <Button
                key="send"
                type="submit"
                variant="quiet"
                aria-describedby="close-line"
                label={<span key={`send-${ready}`} className={cn("tube", ready && "tube-on")}>{status === "sending" ? contact.buttons.sending : contact.buttons.send}</span>}
              />
            ) : (
              <Button
                key="next"
                variant="quiet"
                onClick={() => go(active + 1)}
                className={cn(!accepted && "text-ink-4")}
                label={<span key={`${active}-${accepted && ready}`} className={cn("tube", accepted && ready && "tube-on")}>{contact.buttons.next}</span>}
              />
            )}
            {msg ? (
              <span role="alert" className="text-ink-1">{msg}</span>
            ) : (
              <span className="flex items-center gap-2.5 max-[760px]:hidden">
                {step.kind === "ask" && step.long ? (
                  <>
                    <Key icon={CornerDownLeft} label="Return" /> {contact.hints.next}
                    <span className="w-3.5" />
                    <span className="flex gap-1"><Key icon={ArrowBigUp} label="Shift" /><Key icon={CornerDownLeft} label="Return" /></span>
                    {contact.hints.newLine}
                  </>
                ) : (
                  <>
                    {contact.hints.press} <Key icon={CornerDownLeft} label="Return" />
                  </>
                )}
              </span>
            )}
            {active > 0 && (
              <button type="button" onClick={() => go(active - 1)} className="cursor-pointer text-ink-3 transition-colors hover:text-ink-1">
                {contact.buttons.back}
              </button>
            )}
          </div>

          {/* a field only bots fill in; people never see it */}
          <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] size-px opacity-0" />
        </form>
      )}
    </main>
  );
}
