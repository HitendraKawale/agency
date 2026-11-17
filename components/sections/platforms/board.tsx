"use client";

// The platforms board: the BI icon in the middle, four platform marks around it, each joined to the
// icon by a bus of three circuit traces. Every trace runs straight out of its mark, turns 45 degrees,
// and runs straight into the icon. The colour at a point is spectrum(0.2t + distance from the icon /
// PERIOD), the icon's own phase law, so the bands travel along the wires into Blank as fast as the
// icon's rings move. GSAP's ticker runs it only while the board is on screen; still mode draws t=2.
import { useRef } from "react";
import { gsap, motionOn, ScrollTrigger, useGSAP } from "@/lib/motion/gsap";
import { makeBiIcon, spectrum } from "@/lib/mark/bi-icon";
import s from "./platforms.module.css";

type Mark = { name: string; path: string };
type Point = readonly [number, number];

const GAP = 12; // centre-to-centre spacing of the three traces, px
const PERIOD = 170; // px of trace per spectrum cycle
const NARROW = 700; // below this board width the marks sit above and below the icon

/**
 * Routes for every trace, icon end first. Built in a "wide" frame (marks left and right of the icon)
 * and transposed when narrow (marks above and below). Also returns where each mark's centre goes.
 */
function route(width: number, height: number, hubSize: number) {
  const narrow = width < NARROW;
  const W = narrow ? height : width, H = narrow ? width : height;
  const hub = hubSize / 2, cx = W / 2, cy = H / 2;
  const nx = narrow ? 0.09 : 0.1, ny = narrow ? 0.24 : 0.25, clear = narrow ? 44 : 52;
  const tr = (x: number, y: number): Point => (narrow ? [y, x] : [x, y]);
  const slots = [[nx, ny, -1], [nx, 1 - ny, -1], [1 - nx, ny, 1], [1 - nx, 1 - ny, 1]] as const;

  const marks: Point[] = [], traces: Point[][] = [];
  for (const [fx, fy, side] of slots) {
    marks.push(tr(fx * W, fy * H));
    // when narrow, the name sits under the top marks, so their traces start below it
    const lift = narrow && side < 0 ? 26 : 0;
    const x0 = fx * W - side * (clear + lift), x1 = cx + side * (hub + 10);
    const yIn = cy + (fy < 0.5 ? -1 : 1) * hub * 0.42;
    for (let i = -1; i <= 1; i++) {
      const y0 = fy * H + i * GAP, y1 = yIn + i * GAP, dy = y1 - y0;
      // offset each trace's bends by gap * (sqrt2 - 1) so the bus keeps its spacing through both turns
      const mid = (x0 + x1) / 2 + i * GAP * (Math.SQRT2 - 1) * Math.sign(dy) * side;
      const b0 = mid + (side * Math.abs(dy)) / 2, b1 = mid - (side * Math.abs(dy)) / 2;
      traces.push([tr(x1, y1), tr(b1, y1), tr(b0, y0), tr(x0, y0)]);
    }
  }
  return { marks, traces };
}

export function Board({ marks, label }: { marks: readonly Mark[]; label: string }) {
  const host = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const board = host.current!;
    const wires = board.querySelector<HTMLCanvasElement>("canvas[data-wires]")!;
    const hubCanvas = board.querySelector<HTMLCanvasElement>("canvas[data-hub]")!;
    const nodes = [...board.querySelectorAll<HTMLElement>("[data-mark]")];
    const g = wires.getContext("2d")!;

    let traces: Point[][] = [], dpr = 1, t = 2;
    let drawHub: ((t: number) => void) | undefined;

    const drawWires = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, wires.width, wires.height);
      g.lineCap = "butt";
      for (const pts of traces) {
        let L = 0;
        g.lineWidth = 2;
        for (let k = 0; k < pts.length - 1; k++) {
          const [ax, ay] = pts[k], [bx, by] = pts[k + 1], len = Math.hypot(bx - ax, by - ay);
          const grad = g.createLinearGradient(ax, ay, bx, by), n = Math.max(2, Math.ceil(len / 6));
          for (let j = 0; j <= n; j++) grad.addColorStop(j / n, spectrum(0.2 * t + (L + (len * j) / n) / PERIOD));
          g.strokeStyle = grad;
          g.beginPath();
          g.moveTo(ax, ay);
          g.lineTo(bx, by);
          g.stroke();
          L += len;
        }
        // pads: a ring where the trace leaves the platform, a dot where it lands on Blank
        const [ex, ey] = pts[pts.length - 1];
        g.strokeStyle = spectrum(0.2 * t + L / PERIOD);
        g.lineWidth = 1.5;
        g.beginPath();
        g.arc(ex, ey, 3.5, 0, Math.PI * 2);
        g.stroke();
        g.fillStyle = spectrum(0.2 * t);
        g.beginPath();
        g.arc(pts[0][0], pts[0][1], 2.5, 0, Math.PI * 2);
        g.fill();
      }
    };
    const draw = () => {
      drawHub?.(t);
      drawWires();
    };

    const size = () => {
      const r = board.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      wires.width = Math.round(r.width * dpr);
      wires.height = Math.round(r.height * dpr);
      const laid = route(r.width, r.height, hubCanvas.getBoundingClientRect().width);
      traces = laid.traces;
      laid.marks.forEach(([x, y], k) => {
        nodes[k].style.left = `${x}px`;
        nodes[k].style.top = `${y}px`;
      });
      drawHub = makeBiIcon(hubCanvas);
      draw();
    };
    const ro = new ResizeObserver(size);
    ro.observe(board);
    size();

    if (!motionOn()) return () => ro.disconnect();

    const t0 = gsap.ticker.time;
    const tick = () => {
      t = 2 + gsap.ticker.time - t0;
      draw();
    };
    ScrollTrigger.create({
      trigger: board,
      start: "top bottom",
      end: "bottom top",
      onToggle: ({ isActive }) => (isActive ? gsap.ticker.add(tick) : gsap.ticker.remove(tick)),
    });
    return () => {
      ro.disconnect();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <div ref={host} className={s.board} role="img" aria-label={label} data-reveal="fade">
      <canvas data-wires className={s.wires} />
      <div className={s.hub}>
        <canvas data-hub />
      </div>
      {marks.map((m) => (
        <div key={m.name} className={s.mark} data-mark>
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d={m.path} />
          </svg>
          {m.name}
        </div>
      ))}
    </div>
  );
}
