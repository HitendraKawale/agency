"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type Phase = "brief" | "draft" | "check" | "ship";

interface TraceLine {
  offset: string;
  rails: string;
  op: string;
  /** Where the line meets the back-edge rail from br_if up to loop[]. */
  edge?: "top" | "mid" | "bottom";
  phase: Phase;
}

const LINES: TraceLine[] = [
  { offset: "", rails: "", op: "agent #0:", phase: "brief" },
  { offset: "+3", rails: "│ ", op: "brief.read[parflow]", phase: "brief" },
  { offset: "+7", rails: "│ ", op: "catalogue.load[92]", phase: "brief" },
  { offset: "+9", rails: "│ ┌ ", op: "loop[]", edge: "top", phase: "draft" },
  { offset: "+11", rails: "│ │ ", op: "page.draft[]", edge: "mid", phase: "draft" },
  { offset: "+14", rails: "│ │ ┌ ", op: "block[]", edge: "mid", phase: "check" },
  { offset: "+16", rails: "│ │ │ ", op: "type.check[]", edge: "mid", phase: "check" },
  { offset: "+19", rails: "│ │ │ ", op: "a11y.audit[wcag 2.2]", edge: "mid", phase: "check" },
  { offset: "+23", rails: "│ │ │ ", op: "lighthouse[>= 99]", edge: "mid", phase: "check" },
  { offset: "+26", rails: "│ │ └ ", op: "end", edge: "mid", phase: "check" },
  { offset: "+28", rails: "│ │ ", op: "br_if[verified=0]", edge: "bottom", phase: "check" },
  { offset: "+31", rails: "│ └ ", op: "ship[parflowengineering.com]", phase: "ship" },
  { offset: "+34", rails: "└>", op: "end", phase: "ship" },
];

const PHASES: Phase[] = ["brief", "draft", "check", "ship"];
const LOOP = 3;
const BLOCK = 5;
const BR_IF = 10;
const SHIP = 11;
const LAST = LINES.length - 1;
/** Draft-and-verify passes per run, cycled so the counters drift apart. */
const PLAN = [3, 2, 4, 3];
/** Column of the back-edge rail, one clear of the widest instruction. */
const EDGE = 40;
const WIDTH = 52;
const STEP_MS = 230;
const HOLD_MS = 1800;

interface Machine {
  cursor: number;
  counts: number[];
  run: number;
  iteration: number;
}

const IDLE: Machine = { cursor: -1, counts: LINES.map(() => 0), run: -1, iteration: 0 };
/** One finished run, shown whole when motion is reduced. */
const FINISHED: Machine = {
  cursor: -1,
  counts: LINES.map((_, index) => (index >= LOOP && index <= BR_IF ? PLAN[0] : 1)),
  run: 0,
  iteration: PLAN[0],
};

function bump(counts: number[], index: number) {
  return counts.map((count, i) => (i === index ? count + 1 : count));
}

function branchTaken(machine: Machine) {
  return machine.cursor === BR_IF && machine.iteration < PLAN[machine.run % PLAN.length];
}

function beginRun(machine: Machine): Machine {
  return { cursor: 1, counts: bump(bump(machine.counts, 0), 1), run: machine.run + 1, iteration: 0 };
}

function advance(machine: Machine): Machine {
  if (machine.cursor < 0 || machine.cursor === LAST) return beginRun(machine);
  if (branchTaken(machine)) {
    return { ...machine, cursor: LOOP, counts: bump(machine.counts, LOOP), iteration: machine.iteration + 1 };
  }
  const cursor = machine.cursor + 1;
  return { ...machine, cursor, counts: bump(machine.counts, cursor), iteration: cursor === LOOP ? 1 : machine.iteration };
}

function jump(machine: Machine, phase: Phase): Machine {
  if (phase === "brief") return beginRun(machine);
  const cursor = phase === "draft" ? LOOP : phase === "check" ? BLOCK : SHIP;
  return { ...machine, cursor, counts: bump(machine.counts, cursor), iteration: Math.max(1, machine.iteration) };
}

function edgeText(line: TraceLine, used: number) {
  if (line.edge === "top") return " ".repeat(EDGE - 2 - used) + "<─┐";
  if (line.edge === "mid") return " ".repeat(EDGE - used) + "│";
  if (line.edge === "bottom") return ` ${"─".repeat(EDGE - used - 1)}┘`;
  return "";
}

function subscribeVisibility(callback: () => void) {
  document.addEventListener("visibilitychange", callback);
  return () => document.removeEventListener("visibilitychange", callback);
}

export interface AgentTraceProps {
  /** Freezes the trace on one finished run, with no cursor until a phase is picked. */
  reducedMotion: boolean;
  ink: string;
  paper: string;
}

/**
 * An agent's build-and-verify loop drawn as an interpreter control-flow trace.
 * A cursor walks the instructions, the br_if back edge lights when the check
 * fails, and every line counts its executions from zero.
 */
export default function AgentTrace({ reducedMotion, ink, paper }: AgentTraceProps) {
  const [machine, setMachine] = useState<Machine>(IDLE);
  const [staticCursor, setStaticCursor] = useState(-1);
  const hidden = useSyncExternalStore(subscribeVisibility, () => document.hidden, () => false);
  const view = reducedMotion ? { ...FINISHED, cursor: staticCursor } : machine;
  const taken = !reducedMotion && branchTaken(view);
  const phase = LINES[view.cursor]?.phase ?? (reducedMotion ? "ship" : "brief");

  useEffect(() => {
    if (reducedMotion || hidden) return;
    const delay = machine.cursor === LAST ? HOLD_MS : machine.cursor < 0 ? 600 : branchTaken(machine) ? STEP_MS * 1.6 : STEP_MS;
    const timer = window.setTimeout(() => setMachine(advance), delay);
    return () => window.clearTimeout(timer);
  }, [machine, reducedMotion, hidden]);

  function pick(next: Phase) {
    if (reducedMotion) setStaticCursor(LINES.findIndex((line, index) => index > 0 && line.phase === next));
    else setMachine((current) => jump(current, next));
  }

  return (
    <>
      <style>{styles}</style>
      <figure className="hero-trace" aria-label="Agent build trace">
        <pre className="hero-trace-text">
          {LINES.map((line, index) => {
            const gutter = line.offset ? `${line.offset.padStart(4)}   ` : "";
            const used = gutter.length + line.rails.length + line.op.length;
            const edge = edgeText(line, used);
            const count = `x ${view.counts[index]}`;
            const pad = " ".repeat(Math.max(1, WIDTH - used - edge.length - count.length));
            const current = index === view.cursor;
            return (
              <span className="hero-trace-line" key={line.offset || "head"}>
                <span className="hero-trace-dim">{gutter}{line.rails}</span>
                <span className={current ? "hero-trace-op is-current" : "hero-trace-op"} style={current ? { background: ink, color: paper, boxShadow: `-.3ch 0 0 ${ink}, .3ch 0 0 ${ink}` } : undefined}>{line.op}</span>
                <span className={taken ? "hero-trace-edge is-hot" : "hero-trace-edge"}>{edge}</span>
                {pad}
                <span className="hero-trace-count">{count}</span>
                {"\n"}
              </span>
            );
          })}
        </pre>
      </figure>
      <div className="hero-legend" role="group" aria-label="Trace phase">
        {PHASES.map((entry) => (
          <button type="button" key={entry} className="hero-legend-item" aria-current={entry === phase ? "step" : undefined} onClick={() => pick(entry)}>
            {entry}
          </button>
        ))}
      </div>
    </>
  );
}

const styles = `
.hero-trace {
  position: absolute;
  inset: 0 0 72px;
  display: grid;
  place-items: center;
  margin: 0;
  pointer-events: none;
}
.hero-trace-text {
  margin: 0;
  font-family: var(--font-code), ui-monospace, monospace;
  /* 52 columns at 0.6em each, so the widest line always fits the gutters. */
  font-size: clamp(9px, calc((100vw - 32px) / 31.6), 17px);
  /* JetBrains Mono's own ascent + descent, so the box rails join line to line. */
  line-height: 1.32;
  font-variant-ligatures: none;
  white-space: pre;
  pointer-events: auto;
  user-select: text;
}
.hero-trace-line { display: inline; }
.hero-trace-dim { opacity: .42; }
.hero-trace-edge { opacity: .42; transition: opacity 120ms ease-out; }
.hero-trace-edge.is-hot { opacity: 1; }
.hero-trace-count { font-variant-numeric: tabular-nums; }
.hero-legend {
  position: absolute;
  left: max(24px, calc((100% - 1752px) / 2 + 24px));
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border-left: 1px solid currentColor;
  font: 10px/1 "Search System Pro Mono", ui-monospace, monospace;
}
.hero-legend-item {
  position: relative;
  appearance: none;
  margin: 0;
  padding: 5px 0 5px 9px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  transition: opacity 140ms ease-out;
}
.hero-legend-item:hover { opacity: .55; }
.hero-legend-item[aria-current]::before {
  content: "";
  position: absolute;
  left: -4px;
  top: 50%;
  width: 7px;
  height: 1px;
  background: currentColor;
}
@media (max-width: 767px) {
  .hero-trace { inset: 0 0 96px; }
  .hero-legend { left: 16px; top: auto; bottom: 64px; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-trace-edge, .hero-legend-item { transition: none; }
}
`;
