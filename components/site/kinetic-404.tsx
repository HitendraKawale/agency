"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Full-viewport kinetic 404. Monospace text is poured row by row into a
 * character grid, but only into cells inside a silhouette, so the text reflows
 * through the shape. The silhouette alternates between the numerals "404" and
 * the studio logo (its plate filled with text, its letters as solid cells);
 * solid blocks snap on and off on a coarse grid inside it.
 *
 * Rendered with canvas 2D through a runtime glyph atlas, so a frame is a few
 * thousand drawImage calls rather than fillText calls.
 */
export interface Kinetic404Props {
  /** Logo whose light letterforms become the second silhouette. */
  logoSrc?: string;
  /** How long the numerals hold before dissolving, in ms. */
  numeralsHoldMs?: number;
  /** How long the logo holds before dissolving, in ms. */
  logoHoldMs?: number;
  /** Length of one dissolve between silhouettes, in ms. */
  morphMs?: number;
}

export const DEFAULT_KINETIC_404 = {
  logoSrc: "/blank-interfaces-header.svg",
  numeralsHoldMs: 5200,
  logoHoldMs: 3800,
  morphMs: 1700,
} as const;

const BG = "#05090A";
const INK = "#BBC9C7";
const BLOCK = "#DFEAE8";

// The site's code face (JetBrains Mono via --font-code) is prepended at runtime.
const TEXT_FALLBACK = "ui-monospace, SFMono-Regular, Menlo, monospace";
const NUMERAL_FALLBACK = '"Inter Tight", "Helvetica Neue", Arial, sans-serif';

const SITE_WORDS = [
  "blank interfaces",
  "projects",
  "about",
  "blog",
  "privacy",
  "mumbai",
  "uk",
  "remote",
  "aryan@blankinterface.com",
];

// Glyphs a changing cell flashes through while it scrambles.
const SCRAMBLE_CHARS =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/.-_@:;,+*#=%";

// Coarse block grid, in character cells. 4x2 cells is roughly square.
const BLOCK_W = 4;
const BLOCK_H = 2;

// A cell scrambles for this long around its switch moment during a dissolve.
const SCRAMBLE_MS = 420;
const FRAME_MS = 1000 / 30;

type Kind = "empty" | "numerals" | "logo";

interface Grid {
  cssW: number;
  cssH: number;
  dpr: number;
  fontSize: number;
  cw: number;
  ch: number;
  cols: number;
  rows: number;
  n: number;
  /** Cell boundaries in device pixels, length cols + 1 and rows + 1. */
  colX: Int32Array;
  rowY: Int32Array;
  bCols: number;
  bRows: number;
  nb: number;
  cellBlock: Int32Array;
  atlas: HTMLCanvasElement;
  /** Atlas cell size in device pixels, including a 1px pad on each side. */
  aw: number;
  ah: number;
  glyphOf: Map<string, number>;
  pool: Int16Array;
}

interface Shape {
  /** 1 where a character lives. */
  mask: Uint8Array;
  /** 1 where a cell is drawn solid. Subset of `mask`. */
  fill: Uint8Array;
}

interface Silhouette {
  kind: Kind;
  /** 1 where a character lives. */
  mask: Uint8Array;
  fill: Uint8Array;
  /** Atlas index per cell, -1 for blank. */
  glyph: Int16Array;
  /** Per block: 1 when the block sits mostly inside the mask. */
  eligible: Uint8Array;
  count: number;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function hash3(x: number, y: number, z: number): number {
  let h =
    (Math.imul(x, 374761393) +
      Math.imul(y, 668265263) +
      Math.imul(z, 1440662683)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

/** Smooth 3D value noise in [0, 1]. Drives the clustered block field. */
function noise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const xf = x - xi;
  const yf = y - yi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const w = zf * zf * (3 - 2 * zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const x00 = lerp(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u);
  const x10 = lerp(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u);
  const x01 = lerp(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u);
  const x11 = lerp(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}

/** The not-found path, interleaved with the site's own words. */
function buildStream(pathname: string): string {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch {
    // Keep the raw path when it is not valid percent-encoding.
  }
  path = path.replace(/\s+/g, "-");
  if (path.length > 64) path = `${path.slice(0, 64)}...`;
  if (path.length === 0) path = "/";
  const parts: string[] = [];
  SITE_WORDS.forEach((word, i) => {
    if (i % 3 === 0) parts.push(path);
    parts.push(word);
  });
  return `${parts.join(" ")} `;
}

/** The area silhouettes are composed into: clear of the fixed nav and the link. */
function safeBox(w: number, h: number): Box {
  const top = Math.max(84, h * 0.12);
  const bottom = Math.max(96, h * 0.13);
  const side = Math.max(16, w * 0.05);
  return { x: side, y: top, w: Math.max(1, w - side * 2), h: Math.max(1, h - top - bottom) };
}

/**
 * `siteCh` is the site's character width (--ch, set by the boot script in
 * layout.tsx). Using it, with the same font-size formula, puts the 404's
 * columns on the grid every other page is set on.
 */
function buildGrid(
  cssW: number,
  cssH: number,
  dpr: number,
  charset: string,
  family: string,
  siteCh: number,
): Grid {
  let cw: number;
  let fontSize: number;
  if (siteCh > 0) {
    cw = siteCh;
    fontSize = siteCh / 0.6 - 0.9;
  } else {
    fontSize = clamp(Math.round(cssW / 120), 10, 13);
    const probe = document.createElement("canvas").getContext("2d");
    if (!probe) throw new Error("kinetic-404: 2D canvas unavailable");
    probe.font = `${fontSize}px ${family}`;
    cw = probe.measureText("0000000000").width / 10;
  }
  // Tight leading, as in the reference: rows a little over one and a half
  // characters tall.
  const ch = Math.round(cw * 1.6);

  const cols = Math.max(1, Math.floor(cssW / cw));
  const rows = Math.max(1, Math.floor(cssH / ch));
  const ox = (cssW - cols * cw) / 2;
  const oy = (cssH - rows * ch) / 2;
  const colX = new Int32Array(cols + 1);
  const rowY = new Int32Array(rows + 1);
  for (let c = 0; c <= cols; c++) colX[c] = Math.round((ox + c * cw) * dpr);
  for (let r = 0; r <= rows; r++) rowY[r] = Math.round((oy + r * ch) * dpr);

  const bCols = Math.ceil(cols / BLOCK_W);
  const bRows = Math.ceil(rows / BLOCK_H);
  const cellBlock = new Int32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cellBlock[r * cols + c] = Math.floor(r / BLOCK_H) * bCols + Math.floor(c / BLOCK_W);
    }
  }

  // Glyph atlas: row 0 is ink on transparent, row 1 is the knocked-out
  // variant drawn in the background colour for cells inside a solid block.
  const glyphs = Array.from(new Set(charset.replace(/\s/g, "")));
  const glyphOf = new Map<string, number>();
  glyphs.forEach((g, i) => glyphOf.set(g, i));
  const aw = Math.ceil(cw * dpr) + 2;
  const ah = Math.ceil(ch * dpr) + 2;
  const atlas = document.createElement("canvas");
  atlas.width = aw * glyphs.length;
  atlas.height = ah * 2;
  const actx = atlas.getContext("2d");
  if (!actx) throw new Error("kinetic-404: 2D canvas unavailable");
  actx.font = `${fontSize * dpr}px ${family}`;
  actx.textBaseline = "alphabetic";
  actx.textAlign = "center";
  // Centre on the glyph extents rather than the font box: the rows are
  // shorter than the face's line gap.
  const m = actx.measureText("Hgjy");
  const asc = m.actualBoundingBoxAscent;
  const desc = m.actualBoundingBoxDescent;
  const baseline = 1 + Math.round((ch * dpr - (asc + desc)) / 2 + asc);
  const mid = 1 + (cw * dpr) / 2;
  glyphs.forEach((g, i) => {
    actx.fillStyle = INK;
    actx.fillText(g, i * aw + mid, baseline);
    actx.fillStyle = BG;
    actx.fillText(g, i * aw + mid, ah + baseline);
  });

  const pool = new Int16Array(SCRAMBLE_CHARS.length);
  for (let i = 0; i < SCRAMBLE_CHARS.length; i++) {
    pool[i] = glyphOf.get(SCRAMBLE_CHARS[i]) ?? 0;
  }

  return {
    cssW,
    cssH,
    dpr,
    fontSize,
    cw,
    ch,
    cols,
    rows,
    n: cols * rows,
    colX,
    rowY,
    bCols,
    bRows,
    nb: bCols * bRows,
    cellBlock,
    atlas,
    aw,
    ah,
    glyphOf,
    pool,
  };
}

interface PixelTest {
  /** Whether one sampled RGBA pixel counts as inside. */
  test: (r: number, g: number, b: number, a: number) => boolean;
  /** Of the five samples per cell, how many must pass. */
  minHits: number;
}

/**
 * Rasterises a silhouette with `paint`, then samples five points per character
 * cell, producing one cell mask per test.
 */
function sampleMasks(
  grid: Grid,
  paint: (ctx: CanvasRenderingContext2D, scale: number) => void,
  tests: readonly PixelTest[],
): Uint8Array[] {
  const scale = Math.min(1, 1100 / Math.max(grid.cssW, grid.cssH));
  const W = Math.max(1, Math.round(grid.cssW * scale));
  const H = Math.max(1, Math.round(grid.cssH * scale));
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  const octx = off.getContext("2d", { willReadFrequently: true });
  const masks = tests.map(() => new Uint8Array(grid.n));
  if (!octx) return masks;
  paint(octx, scale);
  const data = octx.getImageData(0, 0, W, H).data;
  const ox = (grid.cssW - grid.cols * grid.cw) / 2;
  const oy = (grid.cssH - grid.rows * grid.ch) / 2;
  const offsets: ReadonlyArray<readonly [number, number]> = [
    [0.5, 0.5],
    [0.22, 0.25],
    [0.78, 0.25],
    [0.22, 0.75],
    [0.78, 0.75],
  ];
  const hits = new Uint8Array(tests.length);
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      hits.fill(0);
      for (const [fx, fy] of offsets) {
        const px = Math.min(W - 1, Math.max(0, Math.floor((ox + (c + fx) * grid.cw) * scale)));
        const py = Math.min(H - 1, Math.max(0, Math.floor((oy + (r + fy) * grid.ch) * scale)));
        const k = (py * W + px) * 4;
        tests.forEach(({ test }, t) => {
          if (test(data[k], data[k + 1], data[k + 2], data[k + 3])) hits[t]++;
        });
      }
      tests.forEach(({ minHits }, t) => {
        if (hits[t] >= minHits) masks[t][r * grid.cols + c] = 1;
      });
    }
  }
  return masks;
}

/** Heavy "404". Stacked vertically when the viewport is portrait. */
function numeralsShape(grid: Grid, family: string): Shape {
  const box = safeBox(grid.cssW, grid.cssH);
  const stacked = box.w / box.h < 0.85;
  const [mask] = sampleMasks(
    grid,
    (ctx, s) => {
      ctx.scale(s, s);
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "alphabetic";
      ctx.font = `800 100px ${family}`;
      ctx.letterSpacing = "-4px";
      const lines = stacked ? ["4", "0", "4"] : ["404"];
      const ms = lines.map((l) => ctx.measureText(l));
      const widths = ms.map((m) => m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
      const asc = Math.max(...ms.map((m) => m.actualBoundingBoxAscent));
      const desc = Math.max(...ms.map((m) => m.actualBoundingBoxDescent));
      const lineH = asc + desc;
      const gap = stacked ? lineH * 0.08 : 0;
      const totalH = lineH * lines.length + gap * (lines.length - 1);
      const k = Math.min(box.w / Math.max(...widths), box.h / totalH);
      ctx.font = `800 ${100 * k}px ${family}`;
      ctx.letterSpacing = `${-4 * k}px`;
      const top = box.y + (box.h - totalH * k) / 2;
      lines.forEach((line, i) => {
        const m = ctx.measureText(line);
        const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
        const x = box.x + (box.w - w) / 2 + m.actualBoundingBoxLeft;
        const y = top + (i * (lineH + gap) + asc) * k;
        ctx.fillText(line, x, y);
      });
    },
    [{ test: (_r, _g, _b, a) => a > 127, minHits: 3 }],
  );
  return { mask, fill: new Uint8Array(grid.n) };
}

/**
 * The logo. The source SVG is light lettering on a dark folder-tab plate: the
 * plate becomes the text silhouette and luminance picks out the letters, which
 * become solid cells. Letter strokes are only a few cells wide, so a cell
 * counts as letter at two of five samples rather than three. Rotated a quarter
 * turn when the viewport is portrait so the letters stay large enough to read.
 */
function logoShape(grid: Grid, img: HTMLImageElement): Shape {
  const box = safeBox(grid.cssW, grid.cssH);
  const ratio =
    img.naturalWidth > 0 && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 975 / 331;
  const rotate = box.w / box.h < 0.85;
  const [plate, letters] = sampleMasks(
    grid,
    (ctx, s) => {
      ctx.scale(s, s);
      const availLong = rotate ? box.h : box.w;
      const availShort = rotate ? box.w : box.h;
      const long = Math.min(availLong, availShort * ratio);
      const short = long / ratio;
      ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
      if (rotate) ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -long / 2, -short / 2, long, short);
    },
    [
      { test: (_r, _g, _b, a) => a > 127, minHits: 3 },
      { test: (r, g, b, a) => a > 127 && r * 0.299 + g * 0.587 + b * 0.114 > 110, minHits: 2 },
    ],
  );
  const mask = new Uint8Array(grid.n);
  for (let i = 0; i < grid.n; i++) mask[i] = plate[i] | letters[i];
  return { mask, fill: letters };
}

/**
 * Pours the stream into the mask row by row. A run never starts on a space,
 * so the silhouette edges stay crisp. Blocks are eligible where they sit
 * mostly inside the mask and clear of solid cells, so a random block never
 * merges with a letter.
 */
function layoutText(grid: Grid, kind: Kind, shape: Shape, stream: string, offset: number): Silhouette {
  const { cols, rows, n } = grid;
  const { mask, fill } = shape;
  const glyph = new Int16Array(n).fill(-1);
  const L = stream.length;
  let pos = offset % L;
  let count = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (mask[i] === 0) continue;
      count++;
      const runStart = c === 0 || mask[i - 1] === 0;
      if (runStart) {
        let guard = 0;
        while (stream[pos] === " " && guard++ < L) pos = (pos + 1) % L;
      }
      const chr = stream[pos];
      pos = (pos + 1) % L;
      glyph[i] = chr === " " ? -1 : grid.glyphOf.get(chr) ?? -1;
    }
  }
  const eligible = new Uint8Array(grid.nb);
  for (let by = 0; by < grid.bRows; by++) {
    for (let bx = 0; bx < grid.bCols; bx++) {
      let total = 0;
      let inside = 0;
      let nearFill = false;
      for (let r = by * BLOCK_H; r < Math.min(rows, (by + 1) * BLOCK_H); r++) {
        for (let c = bx * BLOCK_W; c < Math.min(cols, (bx + 1) * BLOCK_W); c++) {
          total++;
          inside += mask[r * cols + c];
        }
      }
      // One cell of clearance around the block.
      for (let r = Math.max(0, by * BLOCK_H - 1); r < Math.min(rows, (by + 1) * BLOCK_H + 1) && !nearFill; r++) {
        for (let c = Math.max(0, bx * BLOCK_W - 1); c < Math.min(cols, (bx + 1) * BLOCK_W + 1); c++) {
          if (fill[r * cols + c] === 1) {
            nearFill = true;
            break;
          }
        }
      }
      eligible[by * grid.bCols + bx] = total > 0 && !nearFill && inside >= Math.ceil(total * 0.75) ? 1 : 0;
    }
  }
  return { kind, mask, fill, glyph, eligible, count };
}

export default function Kinetic404({
  logoSrc = DEFAULT_KINETIC_404.logoSrc,
  numeralsHoldMs = DEFAULT_KINETIC_404.numeralsHoldMs,
  logoHoldMs = DEFAULT_KINETIC_404.logoHoldMs,
  morphMs = DEFAULT_KINETIC_404.morphMs,
}: Kinetic404Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reducedMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stream = buildStream(window.location.pathname);
    const charset = `${stream}${SCRAMBLE_CHARS}`;
    // The layout loads Inter Tight and JetBrains Mono through next/font under
    // hashed family names exposed as --font-grotesk and --font-code.
    const sectionStyle = getComputedStyle(section);
    const grotesk = sectionStyle.getPropertyValue("--font-grotesk").trim();
    const numeralFamily = grotesk ? `${grotesk}, ${NUMERAL_FALLBACK}` : NUMERAL_FALLBACK;
    const code = sectionStyle.getPropertyValue("--font-code").trim();
    const textFamily = code ? `${code}, ${TEXT_FALLBACK}` : TEXT_FALLBACK;
    // Re-read on every rebuild: the boot script updates --ch on resize.
    const siteCh = () => {
      const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ch"));
      return Number.isFinite(v) && v > 0 ? v : 0;
    };

    let disposed = false;
    let ready = false;
    let inView = true;
    let grid: Grid | null = null;
    let logoImg: HTMLImageElement | null = null;
    let numerals: Shape | null = null;
    let logo: Shape | null = null;

    // Silhouette state machine: hold `cur`, then dissolve `from` into `to`.
    let cur: Silhouette | null = null;
    let from: Silhouette | null = null;
    let to: Silhouette | null = null;
    let phase: "hold" | "morph" = "hold";
    let phaseStart = 0;
    let switchAt = new Float32Array(0);
    let blockSwitchAt = new Float32Array(0);

    // Block field and small disturbances.
    let solid = new Uint8Array(0);
    let blockOn = new Uint8Array(0);
    let hi = new Uint8Array(0);
    let glitchUntil = new Float32Array(0);
    let glitchGlyph = new Int16Array(0);
    let rowShift = new Int8Array(0);
    let rowShiftUntil = new Float32Array(0);
    let stepZ = Math.random() * 100;
    let nextStepAt = 0;

    let raf = 0;
    let running = false;
    let last = 0;
    let clock = 0;
    let lastDraw = -Infinity;

    const emptySilhouette = (g: Grid): Silhouette => ({
      kind: "empty",
      mask: new Uint8Array(g.n),
      fill: new Uint8Array(g.n),
      glyph: new Int16Array(g.n).fill(-1),
      eligible: new Uint8Array(g.nb),
      count: 0,
    });

    const shapeFor = (kind: Kind): Shape | null =>
      kind === "numerals" ? numerals : kind === "logo" ? logo : null;

    const randomOffset = () => Math.floor(Math.random() * stream.length);

    /** Re-picks which eligible blocks are solid and which runs are highlighted. */
    const step = (t: number) => {
      const g = grid;
      const target = phase === "morph" ? to : cur;
      if (!g || !target) return;
      stepZ += 0.25 + Math.random() * 0.45;
      for (let by = 0; by < g.bRows; by++) {
        for (let bx = 0; bx < g.bCols; bx++) {
          const v =
            0.64 * noise3(bx * 0.19, by * 0.19, stepZ) +
            0.36 * noise3(bx * 0.47 + 31, by * 0.47 + 17, stepZ * 1.6);
          let on = v > 0.6 ? 1 : 0;
          if (Math.random() < 0.02) on ^= 1;
          solid[by * g.bCols + bx] = on;
        }
      }
      hi.fill(0);
      if (target.count > 0) {
        const runs = Math.max(3, Math.round(target.count * 0.004));
        for (let k = 0; k < runs; k++) {
          for (let tries = 0; tries < 24; tries++) {
            const i = Math.floor(Math.random() * g.n);
            if (target.mask[i] === 0) continue;
            const len = 1 + Math.floor(Math.random() * 6);
            const rowEnd = (Math.floor(i / g.cols) + 1) * g.cols;
            for (let j = i; j < Math.min(i + len, rowEnd) && target.mask[j] === 1; j++) hi[j] = 1;
            break;
          }
        }
      }
      nextStepAt = t + (Math.random() < 0.2 ? 1400 + Math.random() * 1200 : 260 + Math.random() * 900);
    };

    const beginMorph = (t: number, nextKind: Kind) => {
      const g = grid;
      const shape = shapeFor(nextKind);
      if (!g || !cur || !shape) return;
      from = cur;
      to = layoutText(g, nextKind, shape, stream, randomOffset());
      // Staggered switch: a sweep across the block grid in a random direction,
      // broken up per block and per cell so the dissolve reads as pixels.
      const angle = [Math.PI / 2, 0, Math.PI * 0.3, Math.PI * 0.7, -Math.PI / 2][
        Math.floor(Math.random() * 5)
      ];
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const blockDelay = new Float32Array(g.nb);
      let lo = Infinity;
      let hiP = -Infinity;
      for (let by = 0; by < g.bRows; by++) {
        for (let bx = 0; bx < g.bCols; bx++) {
          const p = (bx / Math.max(1, g.bCols - 1)) * dx + (by / Math.max(1, g.bRows - 1)) * dy;
          blockDelay[by * g.bCols + bx] = p;
          lo = Math.min(lo, p);
          hiP = Math.max(hiP, p);
        }
      }
      const span = morphMs - SCRAMBLE_MS - 160;
      for (let b = 0; b < g.nb; b++) {
        const p = (blockDelay[b] - lo) / Math.max(1e-6, hiP - lo);
        blockDelay[b] = SCRAMBLE_MS / 2 + (0.72 * p + 0.28 * Math.random()) * span;
      }
      for (let i = 0; i < g.n; i++) {
        switchAt[i] = blockDelay[g.cellBlock[i]] + Math.random() * 160;
      }
      for (let b = 0; b < g.nb; b++) blockSwitchAt[b] = blockDelay[b] + SCRAMBLE_MS / 2;
      phase = "morph";
      phaseStart = t;
    };

    const nextKindAfter = (kind: Kind): Kind => {
      if (kind === "numerals" && logo) return "logo";
      return "numerals";
    };

    const tick = (t: number) => {
      const g = grid;
      if (!g || !cur) return;
      if (phase === "hold") {
        const hold = cur.kind === "empty" ? 200 : cur.kind === "logo" ? logoHoldMs : numeralsHoldMs;
        if (t - phaseStart >= hold) beginMorph(t, nextKindAfter(cur.kind));
      } else if (t - phaseStart >= morphMs && to) {
        cur = to;
        from = null;
        to = null;
        phase = "hold";
        phaseStart = t;
      }
      if (t >= nextStepAt) step(t);

      // Single-cell flicker: a few cells swap to a random glyph or drop out.
      const target = phase === "morph" ? to : cur;
      if (target && target.count > 0) {
        const k = Math.round(target.count * 0.0025 + Math.random());
        for (let j = 0; j < k * 3; j++) {
          const i = Math.floor(Math.random() * g.n);
          if (target.mask[i] === 0) continue;
          glitchUntil[i] = t + 40 + Math.random() * 220;
          glitchGlyph[i] = Math.random() < 0.35 ? -1 : g.pool[Math.floor(Math.random() * g.pool.length)];
        }
      }
      // Occasional dislocated line.
      if (Math.random() < 0.06) {
        const r = Math.floor(Math.random() * g.rows);
        rowShift[r] = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 3));
        rowShiftUntil[r] = t + 70 + Math.random() * 240;
      }
    };

    const draw = (t: number) => {
      const g = grid;
      if (!g || !cur) return;
      const { cols, rows, colX, rowY, aw, ah, atlas, pool, cellBlock } = g;
      const morphing = phase === "morph" && from !== null && to !== null;
      const a = from ?? cur;
      const b = to ?? cur;
      const mt = t - phaseStart;
      const half = SCRAMBLE_MS / 2;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = BLOCK;
      for (let by = 0; by < g.bRows; by++) {
        for (let bx = 0; bx < g.bCols; bx++) {
          const k = by * g.bCols + bx;
          const elig = morphing ? (mt < blockSwitchAt[k] ? a.eligible[k] : b.eligible[k]) : cur.eligible[k];
          const on = elig === 1 && solid[k] === 1 ? 1 : 0;
          blockOn[k] = on;
          if (on === 0) continue;
          const c0 = bx * BLOCK_W;
          const r0 = by * BLOCK_H;
          const c1 = Math.min(cols, c0 + BLOCK_W);
          const r1 = Math.min(rows, r0 + BLOCK_H);
          ctx.fillRect(colX[c0], rowY[r0], colX[c1] - colX[c0], rowY[r1] - rowY[r0]);
        }
      }

      const jitterX = g.cw * g.dpr * 0.35;
      const jitterY = g.ch * g.dpr * 0.45;
      for (let r = 0; r < rows; r++) {
        const shift = rowShiftUntil[r] > t ? rowShift[r] : 0;
        const y = rowY[r];
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          let src = cur;
          let scrambling = false;
          if (morphing) {
            const d = mt - switchAt[i];
            if (d < -half) src = a;
            else if (d > half) src = b;
            else scrambling = true;
          }
          let gi: number;
          if (scrambling) {
            if (a.mask[i] === 0 && b.mask[i] === 0) continue;
            gi = Math.random() < 0.2 ? -1 : pool[Math.floor(Math.random() * pool.length)];
          } else {
            if (src.mask[i] === 0) continue;
            if (shift !== 0) {
              const sc = c - shift;
              gi = sc >= 0 && sc < cols ? src.glyph[r * cols + sc] : -1;
            } else {
              gi = src.glyph[i];
            }
            if (glitchUntil[i] > t) gi = glitchGlyph[i];
          }
          const inBlock = blockOn[cellBlock[i]] === 1;
          const solidCell = !scrambling && src.fill[i] === 1;
          const lit = !scrambling && (hi[i] === 1 || solidCell);
          if (lit && !inBlock) {
            ctx.fillRect(colX[c], y, colX[c + 1] - colX[c], rowY[r + 1] - y);
          }
          // Letter cells stay plain solid so the letterforms read at full
          // size; a glyph shows through only while the cell flickers.
          if (solidCell && glitchUntil[i] <= t) continue;
          if (gi < 0) continue;
          let px = colX[c] - 1;
          let py = y - 1;
          if (scrambling) {
            px += Math.round((Math.random() - 0.5) * jitterX);
            py += Math.round((Math.random() - 0.5) * jitterY);
          }
          ctx.drawImage(atlas, gi * aw, inBlock || lit ? ah : 0, aw, ah, px, py, aw, ah);
        }
      }
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(now - last, 100);
      last = now;
      clock += dt;
      if (clock - lastDraw < FRAME_MS - 1) return;
      lastDraw = clock;
      if (grid && Math.min(window.devicePixelRatio || 1, 2) !== grid.dpr) {
        rebuild();
        return;
      }
      tick(clock);
      draw(clock);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const start = () => {
      if (running || !ready || disposed || reducedMQ.matches || document.hidden || !inView) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    /** Rebuilds the grid, atlas and masks for the current size, keeping the shape. */
    const rebuild = () => {
      if (disposed) return;
      const rect = section.getBoundingClientRect();
      const cssW = Math.max(1, Math.round(rect.width));
      const cssH = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const g = buildGrid(cssW, cssH, dpr, charset, textFamily, siteCh());
      grid = g;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);

      numerals = numeralsShape(g, numeralFamily);
      logo = logoImg ? logoShape(g, logoImg) : null;

      switchAt = new Float32Array(g.n);
      blockSwitchAt = new Float32Array(g.nb);
      solid = new Uint8Array(g.nb);
      blockOn = new Uint8Array(g.nb);
      hi = new Uint8Array(g.n);
      glitchUntil = new Float32Array(g.n);
      glitchGlyph = new Int16Array(g.n);
      rowShift = new Int8Array(g.rows);
      rowShiftUntil = new Float32Array(g.rows);

      const kind: Kind = reducedMQ.matches
        ? "numerals"
        : (to?.kind ?? cur?.kind ?? "empty");
      const shape = shapeFor(kind);
      cur = shape ? layoutText(g, kind, shape, stream, 0) : emptySilhouette(g);
      from = null;
      to = null;
      phase = "hold";
      phaseStart = clock;
      step(clock);

      if (reducedMQ.matches) {
        hi.fill(0);
        draw(clock);
      } else if (!running) {
        draw(clock);
      }
    };

    let resizeFrame = 0;
    const ro = new ResizeObserver(() => {
      if (!ready) return;
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(rebuild);
    });
    ro.observe(section);

    const io = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      if (inView) start();
      else stop();
    });
    io.observe(section);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onMotionChange = () => {
      stop();
      if (!ready) return;
      rebuild();
      start();
    };
    reducedMQ.addEventListener("change", onMotionChange);

    const img = new Image();
    img.decoding = "async";
    img.src = logoSrc;
    img
      .decode()
      .then(() => {
        if (disposed) return;
        logoImg = img;
        if (grid) logo = logoShape(grid, img);
      })
      .catch(() => {
        // Without the logo the numerals simply reflow into themselves.
      });

    (async () => {
      try {
        await document.fonts.load(`12px ${textFamily}`);
        await document.fonts.load(`800 100px ${numeralFamily}`);
      } catch {
        // Fall back to whatever faces are available.
      }
      await document.fonts.ready;
      if (disposed) return;
      ready = true;
      rebuild();
      start();
    })();

    return () => {
      disposed = true;
      stop();
      cancelAnimationFrame(resizeFrame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMQ.removeEventListener("change", onMotionChange);
    };
  }, [logoSrc, numeralsHoldMs, logoHoldMs, morphMs]);

  return (
    <section ref={sectionRef} className="k404">
      <style>{styles}</style>
      <h1 className="sr-only">Page not found</h1>
      <canvas ref={canvasRef} className="k404-canvas" role="img" aria-label="Page not found" />
      <Link href="/" className="k404-home">
        <span aria-hidden="true">[&nbsp;</span>
        Return home
        <span aria-hidden="true">&nbsp;]</span>
      </Link>
    </section>
  );
}

const styles = `
.k404 {
  position: relative;
  width: 100%;
  height: 100svh;
  min-height: 520px;
  overflow: hidden;
  background: #05090A;
  color: #BBC9C7;
}

.k404-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.k404-home {
  position: absolute;
  left: max(16px, 5vw);
  bottom: max(28px, calc(env(safe-area-inset-bottom) + 20px));
  z-index: 1;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 6px;
  margin-left: -6px;
  font-family: "Search System Pro Mono", ui-monospace, monospace;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #BBC9C7;
  text-decoration: none;
  white-space: nowrap;
}

.k404-home:focus-visible {
  outline: 1px solid #DFEAE8;
  outline-offset: 2px;
  background: #DFEAE8;
  color: #05090A;
}

@media (hover: hover) {
  .k404-home:hover {
    background: #DFEAE8;
    color: #05090A;
  }
}
`;
