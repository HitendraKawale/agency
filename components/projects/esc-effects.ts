/**
 * "Press ESC for effects", ported from reference/lebedev/js/esc-effects.js.
 *
 * Same state machine: Esc #1 turns effect[i] on, Esc #2 turns it off and
 * i = (i + 1) % 6; 260 ms key debounce; saved in sessionStorage as
 * { on, index } (key renamed blank-esc-fx); desktop-only and reduced-motion
 * gates unchanged. The six effect bodies, their constants and colours are
 * copied; only the shape changed (start() returns its stop function instead of
 * assigning this.stop). The editorial grid measures `.pj-menu` where theirs
 * measures `.fixed_menu`; the other page-specific branches of
 * measureEditorialLines (.wrapper_work, .news_grid, .grid_specific) match
 * nothing on this page and were dropped.
 */

const DESKTOP_MQ = "(min-width: 768px) and (hover: hover) and (pointer: fine)";
const STORAGE_KEY = "blank-esc-fx";

type Effect = {
  id: string;
  /** Builds the effect inside `host` and returns its stop function. */
  start: (host: HTMLElement, raf: (id: number) => number) => () => void;
};

type SavedState = { on?: boolean; index?: number };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeCanvas(host: HTMLElement, className?: string) {
  const c = document.createElement("canvas");
  c.className = "fx-canvas" + (className ? " " + className : "");
  host.appendChild(c);
  return c;
}

function setupCanvas(c: HTMLCanvasElement, scale = 1) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  c.width = Math.max(1, (w * scale) | 0);
  c.height = Math.max(1, (h * scale) | 0);
  c.style.width = "100%";
  c.style.height = "100%";
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d canvas unavailable");
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return { ctx, w: c.width, h: c.height, scale };
}

/* 1. Film grain, low-res loop noise */
const loopNoiseFx: Effect = {
  id: "loop-noise",
  start(host, raf) {
    const c = makeCanvas(host, "fx-canvas--noise");
    let running = true;
    let ctx: CanvasRenderingContext2D;
    let img: ImageData;
    let buf: Uint8ClampedArray;

    function resize() {
      const setup = setupCanvas(c, 0.28);
      ctx = setup.ctx;
      img = ctx.createImageData(setup.w, setup.h);
      buf = img.data;
    }

    function draw() {
      if (!running || document.hidden) {
        raf(requestAnimationFrame(draw));
        return;
      }
      const len = buf.length;
      for (let i = 0; i < len; i += 4) {
        const v = (Math.random() * 255) | 0;
        buf[i] = buf[i + 1] = buf[i + 2] = v;
        buf[i + 3] = 32 + ((Math.random() * 48) | 0);
      }
      ctx.putImageData(img, 0, 0);
      raf(requestAnimationFrame(draw));
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      running = false;
      window.removeEventListener("resize", resize);
    };
  },
};

/* 2. Rust pixel grid */
const pixelGridFx: Effect = {
  id: "pixel-grid",
  start(host, raf) {
    const c = makeCanvas(host, "fx-canvas--pixel-grid");
    let running = true;
    let ctx: CanvasRenderingContext2D;
    let cell = window.innerWidth > 767 ? 7 : 5;
    let cw = 0;
    let ch = 0;

    function resize() {
      const setup = setupCanvas(c, 0.5);
      ctx = setup.ctx;
      cw = setup.w;
      ch = setup.h;
      cell = window.innerWidth > 767 ? 7 : 5;
    }

    function draw(now: number) {
      if (!running || document.hidden) {
        raf(requestAnimationFrame(draw));
        return;
      }
      const t = now * 0.001;
      const cols = Math.ceil(cw / cell) + 1;
      const rows = Math.ceil(ch / cell) + 1;

      ctx.clearRect(0, 0, cw, ch);

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const pulse = 0.5 + Math.sin(t * 2.4 + gx * 0.35 + gy * 0.28) * 0.5;
          const hot = (gx + gy + Math.floor(t * 1.8)) % 7 === 0;
          const alpha = hot ? 0.14 + pulse * 0.12 : 0.04 + pulse * 0.05;
          ctx.fillStyle = hot ? "rgba(255, 140, 48, " + alpha + ")" : "rgba(198, 88, 28, " + alpha + ")";
          ctx.fillRect(gx * cell, gy * cell, cell - 1, cell - 1);
        }
      }

      ctx.strokeStyle = "rgba(255, 168, 72, 0.22)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= cw; x += cell) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, ch);
        ctx.stroke();
      }
      for (let y = 0; y <= ch; y += cell) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(cw, y + 0.5);
        ctx.stroke();
      }

      raf(requestAnimationFrame(draw));
    }

    resize();
    draw(performance.now());
    window.addEventListener("resize", resize);
    return () => {
      running = false;
      window.removeEventListener("resize", resize);
    };
  },
};

type EditorialLine = { x: number; strong: boolean };

function measureEditorialLines() {
  const lines: EditorialLine[] = [];
  const minGap = 8;

  function add(value: number | null, strong: boolean) {
    if (value == null || !isFinite(value)) return;
    const x = Math.round(value) + 0.5;
    if (x < 1 || x > window.innerWidth - 2) return;
    for (const line of lines) {
      if (Math.abs(line.x - x) < minGap) {
        if (strong) line.strong = true;
        return;
      }
    }
    lines.push({ x, strong });
  }

  function box(el: Element | null) {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 && r.height <= 0) return null;
    return r;
  }

  const menuBox = box(document.querySelector(".pj-menu"));
  if (menuBox) {
    add(menuBox.left, true);
    add(menuBox.right, true);
  }

  if (lines.length < 2) {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const vw = window.innerWidth;
    const gutter = rem * 0.75;
    add(gutter, true);
    add(gutter + vw * 0.35, true);
    add(gutter + vw * 0.355, true);
    add(gutter + vw * 0.68, true);
  }

  lines.sort((a, b) => a.x - b.x);
  return lines;
}

/* 3. Editorial grid, aligned to live layout columns */
const editorialGridFx: Effect = {
  id: "editorial-grid",
  start(host, raf) {
    const c = makeCanvas(host, "fx-canvas--editorial");
    let running = true;
    let ctx: CanvasRenderingContext2D;
    let w = 0;
    let h = 0;
    let baseline = 48;
    let vertLines: EditorialLine[] = [];
    let lastMeasure = 0;

    function layout() {
      w = window.innerWidth;
      h = window.innerHeight;
      baseline = w > 767 ? 48 : 32;
      vertLines = measureEditorialLines();
      lastMeasure = performance.now();
    }

    function resize() {
      ctx = setupCanvas(c, 1).ctx;
      layout();
    }

    function draw(now: number) {
      if (!running || document.hidden) {
        raf(requestAnimationFrame(draw));
        return;
      }

      if (now - lastMeasure > 900) layout();

      const t = now * 0.001;
      const pulse = 0.88 + Math.sin(t * 0.55) * 0.12;

      ctx.clearRect(0, 0, w, h);

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255, 255, 255, " + 0.16 * pulse + ")";
      ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

      for (const line of vertLines) {
        ctx.strokeStyle = line.strong
          ? "rgba(255, 255, 255, " + 0.14 * pulse + ")"
          : "rgba(255, 255, 255, " + 0.06 * pulse + ")";
        ctx.beginPath();
        ctx.moveTo(line.x, 0);
        ctx.lineTo(line.x, h);
        ctx.stroke();
      }

      let row = 0;
      for (let y = 0; y <= h; y += baseline, row++) {
        const hy = y + 0.5;
        const rowStrong = row % 4 === 0;
        ctx.strokeStyle = rowStrong
          ? "rgba(255, 255, 255, " + 0.075 * pulse + ")"
          : "rgba(255, 255, 255, " + 0.035 * pulse + ")";
        ctx.beginPath();
        ctx.moveTo(0, hy);
        ctx.lineTo(w, hy);
        ctx.stroke();
      }

      const tick = 6;
      ctx.strokeStyle = "rgba(255, 255, 255, " + 0.28 * pulse + ")";
      const corners: ReadonlyArray<readonly [number, number]> = [
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
      ];
      for (const [px, py] of corners) {
        ctx.beginPath();
        ctx.moveTo(px - tick, py + 0.5);
        ctx.lineTo(px + tick, py + 0.5);
        ctx.moveTo(px + 0.5, py - tick);
        ctx.lineTo(px + 0.5, py + tick);
        ctx.stroke();
      }

      raf(requestAnimationFrame(draw));
    }

    resize();
    draw(performance.now());
    window.addEventListener("resize", resize);
    window.addEventListener("load", layout);
    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      window.removeEventListener("load", layout);
    };
  },
};

/* 4. Cursor-reactive gradient */
const cursorGradientFx: Effect = {
  id: "cursor-gradient",
  start(host, raf) {
    const layer = document.createElement("div");
    layer.className = "fx-layer fx-cursor-gradient";
    host.appendChild(layer);

    let mx = window.innerWidth * 0.5;
    let my = window.innerHeight * 0.5;
    let tx = mx;
    let ty = my;
    let running = true;

    function onMove(e: MouseEvent) {
      tx = e.clientX;
      ty = e.clientY;
    }

    function tick() {
      if (!running) return;
      mx += (tx - mx) * 0.12;
      my += (ty - my) * 0.12;
      layer.style.setProperty("--fx-x", mx + "px");
      layer.style.setProperty("--fx-y", my + "px");
      raf(requestAnimationFrame(tick));
    }

    document.addEventListener("mousemove", onMove, { passive: true });
    tick();

    return () => {
      running = false;
      document.removeEventListener("mousemove", onMove);
    };
  },
};

/* 5. Infrared / thermal vision */
const infraredFx: Effect = {
  id: "infrared",
  start(host, raf) {
    const grade = document.createElement("div");
    grade.className = "fx-layer fx-ir-grade";
    host.appendChild(grade);

    const scan = document.createElement("div");
    scan.className = "fx-layer fx-ir-scan";
    host.appendChild(scan);

    const vig = document.createElement("div");
    vig.className = "fx-layer fx-ir-vignette";
    host.appendChild(vig);

    const c = makeCanvas(host);
    let running = true;
    let ctx: CanvasRenderingContext2D;
    let cw = 0;
    let ch = 0;

    function resize() {
      const setup = setupCanvas(c, 1);
      ctx = setup.ctx;
      cw = setup.w;
      ch = setup.h;
    }

    function draw(now: number) {
      if (!running || document.hidden) {
        raf(requestAnimationFrame(draw));
        return;
      }
      const t = now * 0.001;

      ctx.clearRect(0, 0, cw, ch);

      const scanY = ((t * 36) % (ch + 30)) - 15;
      ctx.fillStyle = "rgba(255, 80, 40, 0.05)";
      ctx.fillRect(0, scanY, cw, 3);

      if (Math.random() < 0.015) {
        ctx.fillStyle = "rgba(255, 200, 120, 0.07)";
        ctx.fillRect(0, rand(0, ch), cw, rand(1, 3));
      }

      raf(requestAnimationFrame(draw));
    }

    resize();
    draw(performance.now());
    window.addEventListener("resize", resize);
    return () => {
      running = false;
      window.removeEventListener("resize", resize);
    };
  },
};

/* 6. Bug lenses, wandering magnifiers + agency memes */
type Lens = { el: HTMLDivElement; x: number; y: number; vx: number; vy: number; r: number };
type Bubble = { text: string; x: number; y: number; vy: number; life: number; decay: number };

const bugLensesFx: Effect = {
  id: "bug-lenses",
  start(host, raf) {
    const lensCount = window.innerWidth > 767 ? 5 : 3;
    const lenses: Lens[] = [];
    const phrases = [
      "ship it 🚀",
      "needs more padding",
      "have you tried ESC?",
      "this is fine 🔥",
      "make logo bigger",
      "as per my last email",
      "quick tweak™",
      "approved ✅ (maybe)",
      "can we explore options?",
      "final_final_v2.psd",
    ];
    const bubbles: Bubble[] = [];
    const bubbleCap = window.innerWidth > 767 ? 4 : 2;

    for (let i = 0; i < lensCount; i++) {
      const el = document.createElement("div");
      el.className = "fx-lens fx-lens--" + (i % 3);
      host.appendChild(el);
      lenses.push({
        el,
        x: rand(0.1, 0.9) * window.innerWidth,
        y: rand(0.1, 0.9) * window.innerHeight,
        vx: rand(-0.45, 0.45),
        vy: rand(-0.4, 0.4),
        r: rand(52, 88),
      });
    }

    const c = makeCanvas(host, "fx-canvas--bubbles");
    let running = true;
    let ctx: CanvasRenderingContext2D;
    let cw = 0;
    let ch = 0;
    let nextBubble = 0;

    function spawnBubble(w: number, h: number): Bubble {
      return {
        text: phrases[(Math.random() * phrases.length) | 0] ?? "",
        x: rand(w * 0.08, w * 0.72),
        y: rand(h * 0.55, h * 0.92),
        vy: rand(-0.35, -0.18),
        life: 1,
        decay: rand(0.003, 0.006),
      };
    }

    function resize() {
      const setup = setupCanvas(c, 1);
      ctx = setup.ctx;
      cw = setup.w;
      ch = setup.h;
      for (const l of lenses) {
        l.el.style.width = l.r * 2 + "px";
        l.el.style.height = l.r * 2 + "px";
      }
    }

    function roundRect(ctx2: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      ctx2.beginPath();
      ctx2.moveTo(x + r, y);
      ctx2.arcTo(x + w, y, x + w, y + h, r);
      ctx2.arcTo(x + w, y + h, x, y + h, r);
      ctx2.arcTo(x, y + h, x, y, r);
      ctx2.arcTo(x, y, x + w, y, r);
      ctx2.closePath();
    }

    function drawBubble(b: Bubble) {
      ctx.font = '600 13px "Comic Sans MS", "Comic Sans", cursive';
      const tw = ctx.measureText(b.text).width;
      const padX = 12;
      const bw = tw + padX * 2;
      const bh = 28;
      const bx = b.x;
      const by = b.y;

      ctx.fillStyle = "rgba(255, 255, 255, " + 0.88 * b.life + ")";
      ctx.strokeStyle = "rgba(0, 0, 0, " + 0.55 * b.life + ")";
      ctx.lineWidth = 1.5;
      roundRect(ctx, bx, by, bw, bh, 10);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bx + 16, by + bh);
      ctx.lineTo(bx + 8, by + bh + 10);
      ctx.lineTo(bx + 28, by + bh);
      ctx.fillStyle = "rgba(255, 255, 255, " + 0.88 * b.life + ")";
      ctx.fill();

      ctx.fillStyle = "rgba(20, 20, 20, " + b.life + ")";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(b.text, bx + padX, by + bh * 0.5);
    }

    function tick(now: number) {
      if (!running) return;
      if (document.hidden) {
        raf(requestAnimationFrame(tick));
        return;
      }

      for (const l of lenses) {
        l.x += l.vx;
        l.y += l.vy;
        if (l.x < l.r || l.x > cw - l.r) l.vx *= -1;
        if (l.y < l.r || l.y > ch - l.r) l.vy *= -1;
        l.el.style.transform = "translate(" + (l.x - l.r) + "px," + (l.y - l.r) + "px)";
      }

      if (now >= nextBubble && bubbles.length < bubbleCap) {
        bubbles.push(spawnBubble(cw, ch));
        nextBubble = now + rand(1800, 4200);
      }

      ctx.clearRect(0, 0, cw, ch);
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (!b) continue;
        b.y += b.vy;
        b.life -= b.decay;
        if (b.life <= 0) {
          bubbles.splice(i, 1);
          continue;
        }
        drawBubble(b);
      }

      raf(requestAnimationFrame(tick));
    }

    resize();
    tick(performance.now());
    window.addEventListener("resize", resize);
    return () => {
      running = false;
      window.removeEventListener("resize", resize);
    };
  },
};

const EFFECTS: readonly Effect[] = [
  loopNoiseFx,
  pixelGridFx,
  editorialGridFx,
  cursorGradientFx,
  infraredFx,
  bugLensesFx,
];

/**
 * Mounts the overlay and key handler. Returns `toggle` (for the hint click)
 * and `destroy`.
 */
export function createEscFx() {
  const desktopMq = window.matchMedia(DESKTOP_MQ);
  const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");

  const root = document.createElement("div");
  root.id = "blank-esc-fx";
  root.setAttribute("aria-hidden", "true");

  let isOn = false;
  let effectIndex = 0;
  let lastKey = 0;
  let stopActive: (() => void) | null = null;
  let rafIds: number[] = [];

  const isEnabled = () => desktopMq.matches && !reduceMq.matches;

  const trackRaf = (id: number) => {
    rafIds.push(id);
    return id;
  };

  function cancelRafs() {
    for (const id of rafIds) cancelAnimationFrame(id);
    rafIds = [];
  }

  function saveState() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ on: isOn, index: effectIndex }));
    } catch {}
  }

  function loadState(): SavedState {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as SavedState;
    } catch {}
    return { on: false, index: 0 };
  }

  function stopRuntime() {
    cancelRafs();
    stopActive?.();
    stopActive = null;
    isOn = false;
    root.classList.remove("is-active");
    root.innerHTML = "";
    document.documentElement.classList.remove("is-esc-fx-on");
  }

  function clear() {
    stopRuntime();
    saveState();
  }

  function enable(effect: Effect) {
    if (!isEnabled()) return;
    clear();
    isOn = true;
    root.classList.add("is-active");
    document.documentElement.classList.add("is-esc-fx-on");
    stopActive = effect.start(root, trackRaf);
    saveState();
  }

  function toggle() {
    if (!isEnabled()) return;
    if (isOn) {
      clear();
      effectIndex = (effectIndex + 1) % EFFECTS.length;
      saveState();
    } else {
      const effect = EFFECTS[effectIndex];
      if (effect) enable(effect);
    }
  }

  function onKey(e: KeyboardEvent) {
    if (!isEnabled()) return;
    if (e.key !== "Escape") return;
    const now = Date.now();
    if (now - lastKey < 260) return;
    lastKey = now;
    toggle();
  }

  function boot() {
    if (!isEnabled()) {
      stopRuntime();
      root.remove();
      return;
    }
    if (!root.parentNode) document.body.appendChild(root);
    const saved = loadState();
    effectIndex =
      typeof saved.index === "number" ? ((saved.index % EFFECTS.length) + EFFECTS.length) % EFFECTS.length : 0;
    const effect = EFFECTS[effectIndex];
    if (saved.on && effect) enable(effect);
  }

  document.addEventListener("keydown", onKey);
  desktopMq.addEventListener("change", boot);
  reduceMq.addEventListener("change", boot);
  boot();

  return {
    toggle,
    destroy() {
      document.removeEventListener("keydown", onKey);
      desktopMq.removeEventListener("change", boot);
      reduceMq.removeEventListener("change", boot);
      stopRuntime();
      root.remove();
    },
  };
}
