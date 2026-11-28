// Heat on the Blank wordmark, after Rerun's logo film (reference/rerun/video/STUDIOGRUHL_RERUN_01-Logo.mp4).
// Ported from .plannotator/brand-v1/mark/heat-logo.js; shader and timing unchanged.
//
// The heat does not paint over the letters, it distorts them: where a blob passes, the wordmark is
// blurred (more heat, wider blur, up to 30 units of its 240 height) and dragged along the blob's path
// and out from its centre. The blurred coverage is read through the Rerun spectrum, and the stroke core
// keeps the logo's own colour. One pass is 3.67 s, as in the film.
//
// Hovering the host for `delay` ms starts a pass; it loops while the pointer stays, and on leave it
// finishes the pass and hands back to the crisp SVG. With prefers-reduced-motion nothing is attached.
//
// `reveal` writes the mark in, after Rerun's wordmark film (.plannotator/rerun-wordmark): the first
// time the mark scrolls into view, the same pass plays over an empty mark, and each part of it only
// stays once the main blob or the baseline blob has swept over it. The heat runs ahead in colour,
// the ink settles behind it, left to right. The sweep is read through the same noise as the blobs,
// so its edge wobbles. Hovering works as usual afterwards. At the end a cloud swells on the k's
// arm, pops off its top-right corner and drifts away, as the film's does off the last n: a blob
// that carries the corner's coverage with it, so it reads as a piece of the letter, blurred.
import { wordmark } from "./wordmark";

type RGB = readonly [number, number, number];
type Point = readonly [number, number];

export type HeatLogoOptions = {
  /** logo colour, 0-1 RGB */
  ink?: RGB;
  /** page colour behind it, 0-1 RGB */
  bg?: RGB;
  /** loop forever without hovering (preview pages) */
  autoplay?: boolean;
  /** ms of hovering before the pass starts */
  delay?: number;
  /** write the mark in the first time it scrolls into view; it is hidden until then */
  reveal?: boolean;
};

export type HeatLogo = {
  /** freeze the pass at `t` seconds, or `null` to let it run (frame-by-frame checks) */
  setT(t: number | null): void;
  destroy(): void;
};

const LOOP = 3.667;
const RADII = [0, 4, 8, 14, 22, 30]; // blur of each precomputed level, word units; 0 is the crisp mark
const MARGIN = 80; // room around the mark for heat that spills past it, word units
const SWEEP = 64; // swept points the reveal remembers
const WRITERS = [0, 2]; // the blobs that leave ink behind: the main one and the baseline one
const WRITE_R = 2.1; // a writer leaves ink this many of its radii around its path
const SETTLE = [3.1, 3.3] as const; // by then everything is written, so no gap survives the pass

// Blob paths in word units (y down). Letters: B 0-218, l 240-302, a 324-548, n 570-804, k 826-1030.
// `carry` drags the wordmark from that point into the blob; `reveal` blobs only play in the reveal.
type Blob = { t0: number; t1: number; r: number; a: number; path: Point[]; carry?: Point; reveal?: boolean };
const BLOBS: Blob[] = [
  // the main blob enters off the B's top-left corner and leaves off the k's top-right corner
  { t0: 0.36, t1: 3.3, r: 74, a: 0.82, path: [[-40, -26], [28, 40], [42, 140], [120, 214], [228, 150], [292, 62], [372, 44],
      [372, 176], [470, 226], [590, 176], [648, 46], [756, 30], [792, 150], [858, 206], [930, 110], [1000, 30],
      [1040, -14], [1072, -44], [1096, -64]] },
  // a second one drops in from the top over the a/n, sinks and merges into the first
  { t0: 0.38, t1: 1.8, r: 54, a: 0.72, path: [[560, -40], [598, 50], [640, 172], [566, 236], [470, 210]] },
  // a low one runs along the baseline and bulges out under the letters
  { t0: 1.0, t1: 2.4, r: 52, a: 0.7, path: [[140, 228], [300, 214], [496, 230], [690, 216], [822, 190]] },
  // the cloud: swells on the k's arm, then leaves off its top-right corner (the film, 2.5-3.3 s)
  { t0: 2.45, t1: 3.5, r: 62, a: 1.1, reveal: true, carry: [995, 22],
    path: [[968, 46], [990, 26], [1022, -4], [1062, -40], [1092, -64]] },
];

const VS = `#version 300 es
in vec2 p; void main() { gl_Position = vec4(p, 0., 1.); }`;
const FS = `#version 300 es
precision highp float;
uniform sampler2D uL0, uL1, uL2, uL3, uL4, uL5;   // wordmark coverage, crisp then blurred wider
uniform vec2 uRes, uOrigin; uniform float uScale, uT; uniform int uSS;
uniform vec4 uB[4]; uniform vec2 uV[4], uC[4];
uniform vec3 uBg, uInk;
uniform vec3 uP[${SWEEP}]; uniform int uPN; uniform float uAll;   // reveal: swept points (x, y, r)
uniform bool uRevealing;
out vec4 o;

float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { return .6 * vn(p) + .3 * vn(p * 2.1 + 3.7) + .1 * vn(p * 4.3 + 9.1); }

// Rerun spectrum: red D72F21, yellow F6DA75, mint 86D9A6, blue 186ADD.
// The heated stroke keeps the logo's own colour at its core, with the same bands outside it. A dark
// logo darkens into it through dark red; a light logo meets red with a short, crisp edge, because a
// long blend from white into dark red reads pink, like a photo negative.
const vec3 DRED = vec3(.36, .05, .04), RED = vec3(.843, .184, .129), ORANGE = vec3(.93, .45, .22),
           YELLOW = vec3(.965, .855, .459), MINT = vec3(.525, .851, .651), BLUE = vec3(.094, .416, .867);

// coverage of the blurred wordmark -> colour; 1 is inside a stroke, 0 is open ground
vec3 ramp(float v) {
  bool light = dot(uInk, vec3(.299, .587, .114)) > .5;
  if (light && v > .74) return mix(RED, uInk, smoothstep(.80, .86, v));
  if (v > .88) return mix(DRED, uInk, smoothstep(.88, 1., v));
  if (v > .74) return mix(RED, DRED, smoothstep(.74, .88, v));
  if (v > .60) return mix(ORANGE, RED, smoothstep(.60, .74, v));
  if (v > .50) return mix(YELLOW, ORANGE, smoothstep(.50, .60, v));
  if (v > .40) return mix(BLUE, YELLOW, smoothstep(.40, .50, v));
  if (v > .25) return mix(MINT, BLUE, smoothstep(.25, .40, v));
  if (v > .08) return mix(uBg, MINT, smoothstep(.08, .25, v));
  return uBg;
}

float level(float s, vec2 uv) {
  float a = texture(uL0, uv).r, b = texture(uL1, uv).r, c = texture(uL2, uv).r,
        d = texture(uL3, uv).r, e = texture(uL4, uv).r, f = texture(uL5, uv).r;
  if (s < 1.) return mix(a, b, s);
  if (s < 2.) return mix(b, c, s - 1.);
  if (s < 3.) return mix(c, d, s - 2.);
  if (s < 4.) return mix(d, e, s - 3.);
  return mix(e, f, min(s - 4., 1.));
}

// one sample at canvas pixel position px; main() averages uSS x uSS of these per pixel
vec4 shade(vec2 px) {
  vec2 w = (px - uOrigin) / uScale;             // word units, y down

  // blobs wobble and tear: their field is read through slow noise
  vec2 q = w + 44. * (vec2(fbm(w * .009 + vec2(uT * .9, 0.)), fbm(w * .009 + vec2(5.2, 1.3) - uT * .8)) - .5);

  float h = 0.; vec2 D = vec2(0.);
  for (int i = 0; i < 4; i++) {
    vec4 b = uB[i]; if (b.w <= 0.) continue;
    vec2 d = q - b.xy, v = uV[i];
    float sp = length(v); vec2 n = sp > 1e-3 ? v / sp : vec2(1, 0);
    float along = dot(d, n), perp = dot(d, vec2(-n.y, n.x));
    float st = 1. + min(sp * .004, .8);         // longer along the direction of travel
    float k = b.w * exp(-((along * along) / (b.z * b.z * st * st) + (perp * perp) / (b.z * b.z)));
    h += k;
    // drag the letters along with the blob, and push them out from its centre so edges bulge
    D += k * (n * 28. + d / b.z * 24.);         // outward push grows from zero at the centre, no pinch point
    D += min(k, 1.) * uC[i];                     // a carrying blob reads the wordmark back where it set off
  }
  h *= mix(.7, 1.1, fbm(w * .018 + vec2(-uT * .7, uT * .4)));
  h = 1. - exp(-1.15 * h);
  D += h * 6. * (vec2(fbm(w * .012 + uT), fbm(w * .012 - uT + 3.3)) - .5);

  vec2 uv = ((w - D) * uScale + uOrigin) / uRes;  // where this pixel reads the wordmark from
  float v = level(h * 5., uv);

  // a short hand-off from the crisp logo to the heat: a long one fades a white logo through grey
  // the unheated logo is the sharp letter (only dragged), so a white logo never shows a blurred haze
  float crisp = texture(uL0, uv).r, hot = smoothstep(.05, .1, h);
  vec3 heated = ramp(v);
  // writing in, a hot stroke glows red through its middle (the hover's red, never the dark one) and
  // cools to the logo's colour; on hover the middle keeps the logo's colour
  if (uRevealing && v > .74) heated = mix(heated, RED, smoothstep(.12, .4, h));
  vec3 col = mix(mix(uBg, uInk, crisp), heated, hot);
  // the reveal: cool ink shows only where a writer has been; heat shows wherever it is
  float md = 1e9;
  for (int i = 0; i < ${SWEEP}; i++) { if (i >= uPN) break; md = min(md, length(q - uP[i].xy) - uP[i].z); }
  float written = max(uAll, smoothstep(2., -2., md)); // a sharp edge; the noise in q makes it liquid
  return vec4(col, smoothstep(0., .1, v) * mix(written, 1., hot));  // open ground stays transparent
}

// supersampled: thin colour bands and dragged edges stay clean even on a 32 px logo
void main() {
  vec2 corner = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) - .5;
  vec3 rgb = vec3(0.); float a = 0.;
  for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
    if (i >= uSS || j >= uSS) continue;
    vec4 c = shade(corner + (vec2(i, j) + .5) / float(uSS));
    rgb += c.rgb * c.a; a += c.a;
  }
  o = vec4(a > 0. ? rgb / a : uBg, a / float(uSS * uSS));
}`;

// Catmull-Rom along a blob's path
function along(path: Point[], s: number): Point {
  const n = path.length - 1, x = Math.min(Math.max(s, 0), 1) * n, i = Math.min(Math.floor(x), n - 1), f = x - i;
  const p0 = path[Math.max(i - 1, 0)], p1 = path[i], p2 = path[i + 1], p3 = path[Math.min(i + 2, n)];
  const c = (a: number, b: number, c2: number, d: number) =>
    0.5 * (2 * b + (c2 - a) * f + (2 * a - 5 * b + 4 * c2 - d) * f * f + (3 * b - a - 3 * c2 + d) * f * f * f);
  return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
}
// eased so a blob starts and ends slower
const ease = (s: number) => s * s * (3 - 2 * s) * 0.35 + s * 0.65;

const envelope = (s: number) => Math.min(1, s / 0.06) * Math.min(1, (1 - s) / 0.12); // grow in, shrink to a dot

/** Where the writers have been by `t`: points along their paths so far, each with the reach of its ink. */
function swept(t: number): [Float32Array, number] {
  const P = new Float32Array(SWEEP * 3);
  let n = 0;
  WRITERS.forEach((w, i) => {
    const b = BLOBS[w], share = i === 0 ? 40 : SWEEP - 40; // the main blob travels furthest
    if (t <= b.t0) return;
    const now = Math.min(1, (t - b.t0) / (b.t1 - b.t0));
    for (let k = 0; k < share; k++) {
      const s = (now * k) / (share - 1), p = along(b.path, ease(s));
      P.set([p[0], p[1], b.r * WRITE_R * (0.25 + 0.75 * envelope(s))], n++ * 3);
    }
  });
  return [P, n];
}

// the cloud swells slowly, holds, then thins away while it drifts, rather than shrinking to a dot
const cloudEnvelope = (s: number) => Math.min(1, s / 0.3) * Math.min(1, (1 - s) / 0.45);

function blobs(t: number, revealing: boolean): [Float32Array, Float32Array, Float32Array] {
  const B = new Float32Array(16), V = new Float32Array(8), C = new Float32Array(8);
  BLOBS.forEach((b, i) => {
    if (t < b.t0 || t > b.t1 || (b.reveal && !revealing)) return;
    const s = (t - b.t0) / (b.t1 - b.t0), e = ease(s);
    const p = along(b.path, e), p2 = along(b.path, ease(Math.min(s + 0.01, 1)));
    const env = b.carry ? cloudEnvelope(s) : envelope(s);
    B.set([p[0], p[1], b.r * (0.25 + 0.75 * env), b.a * env], i * 4);
    const dt = 0.01 * (b.t1 - b.t0);
    V.set([(p2[0] - p[0]) / dt, (p2[1] - p[1]) / dt], i * 2);
    if (b.carry) C.set([p[0] - b.carry[0], p[1] - b.carry[1]], i * 2);
  });
  return [B, V, C];
}

// The blurred levels, as one-channel bytes, by mask size and scale. The blur is the slow part of a
// mark (about 400 ms for the footer's), so it runs in a worker (heat-blur.worker.ts), and its result
// is kept: every page renders its own nav and footer, so each client navigation attaches both marks
// again at the same sizes. The last few sizes are kept (nav and footer, at a resize or two).
const levelCache = new Map<string, Promise<Uint8Array[]>>();
const CACHED = 4;

let worker: Worker | null | undefined;
let jobs = 0;
const waiting = new Map<number, (levels: Uint8Array[]) => void>();
function blurred(rgba: Uint8ClampedArray, w: number, h: number, sigmas: number[]): Promise<Uint8Array[]> {
  if (worker === undefined) {
    try {
      worker = new Worker(new URL("./heat-blur.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = ({ data }: MessageEvent<{ id: number; levels: Uint8Array[] }>) => {
        waiting.get(data.id)?.(data.levels);
        waiting.delete(data.id);
      };
    } catch {
      worker = null;
    }
  }
  // no worker: the same blur, here
  if (!worker) return import("./heat-blur").then((m) => m.blurLevels(rgba, w, h, sigmas));
  const id = ++jobs, live = worker;
  return new Promise((done) => {
    waiting.set(id, done);
    live.postMessage({ id, rgba, w, h, sigmas }, [rgba.buffer]);
  });
}

/** Attach the heat effect to `el`, which holds the inline wordmark <svg>. Returns null when skipped. */
export function attachHeatLogo(
  el: HTMLElement,
  { ink = [0.055, 0.055, 0.055], bg = [1, 1, 1], autoplay = false, delay = 7000, reveal = false }: HeatLogoOptions = {},
): HeatLogo | null {
  if (!autoplay && matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const svg = el.querySelector("svg");
  const cs = getComputedStyle(el);
  if (cs.position === "static") el.style.position = "relative";
  if (cs.display === "inline") el.style.display = "inline-block"; // so it can hold the canvas
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;pointer-events:none;visibility:hidden";
  el.appendChild(canvas);
  const gl = canvas.getContext("webgl2", { premultipliedAlpha: false, preserveDrawingBuffer: true });
  if (!gl) { canvas.remove(); return null; }

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  gl.uniform3f(U("uInk"), ...ink); gl.uniform3f(U("uBg"), ...bg);

  const setTex = (unit: number) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  };
  const tex = (cv: HTMLCanvasElement, unit: number) => {
    setTex(unit); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  };
  const texR8 =(b: Uint8Array, w: number, h: number, unit: number) => {
    setTex(unit); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, w, h, 0, gl.RED, gl.UNSIGNED_BYTE, b);
  };
  const glyph = new Path2D(wordmark.path);

  // The canvas covers the logo plus MARGIN on every side at the screen's pixel density. The masks are
  // drawn sharper than that (at least 2 px per wordmark unit, up to 4x the canvas), and each pixel
  // averages several samples, so a small nav logo stays sharp.
  let laid = "";
  function layout() {
    const box = (svg ?? el).getBoundingClientRect(), host = el.getBoundingClientRect();
    if (!box.width) return;
    const k = box.width / wordmark.width, m = MARGIN * k, dpr = Math.min(devicePixelRatio || 1, 3);
    // the ResizeObserver reports the size it was attached at, right after the first layout
    const at = `${box.left - host.left},${box.top - host.top},${box.width},${box.height},${dpr}`;
    if (at === laid) return;
    laid = at;
    // svg elements have no offsetLeft/Top, so place the canvas from the two rects
    Object.assign(canvas.style, {
      left: `${box.left - host.left - el.clientLeft - m}px`, top: `${box.top - host.top - el.clientTop - m}px`,
      width: `${box.width + 2 * m}px`, height: `${box.height + 2 * m}px`,
    });
    canvas.width = Math.round((box.width + 2 * m) * dpr); canvas.height = Math.round((box.height + 2 * m) * dpr);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    const scale = k * dpr, origin = m * dpr;
    const ms = Math.min(4, Math.max(1, Math.ceil(2 / scale))); // mask px per canvas px
    gl!.uniform1i(U("uSS"), box.height * dpr < 240 ? 4 : 2);
    const mask = document.createElement("canvas"); mask.width = canvas.width * ms; mask.height = canvas.height * ms;
    const c = mask.getContext("2d", { willReadFrequently: true })!;
    c.fillStyle = "#000"; c.fillRect(0, 0, mask.width, mask.height);
    c.setTransform(scale * ms, 0, 0, scale * ms, origin * ms, origin * ms); c.fillStyle = "#fff"; c.fill(glyph, "evenodd");
    tex(mask, 0); gl!.uniform1i(U("uL0"), 0);
    // The blurred levels never change, so they are made once, here rather than with the canvas
    // `filter`, which some browsers ignore (the bands then never appear).
    const W = mask.width, H = mask.height, key = `${W}x${H}@${scale * ms}`;
    let levels = levelCache.get(key);
    if (!levels) {
      levels = blurred(c.getImageData(0, 0, W, H).data, W, H, RADII.slice(1).map((r) => r * scale * ms));
      levelCache.set(key, levels);
      if (levelCache.size > CACHED) levelCache.delete(levelCache.keys().next().value!);
    }
    gl!.uniform2f(U("uRes"), canvas.width, canvas.height);
    gl!.uniform2f(U("uOrigin"), origin, origin); gl!.uniform1f(U("uScale"), scale);
    // a pass waits for the levels; a newer layout or a destroy drops these
    ready = false;
    levels.then((ls) => {
      if (!alive || laid !== at) return;
      ls.forEach((b, i) => { texR8(b, W, H, i + 1); gl!.uniform1i(U(`uL${i + 1}`), i + 1); });
      ready = true;
      if (pending) { pending = false; play(); }
      else if (!running) draw(0);
    });
  }

  function draw(t: number) {
    const [B, V, C] = blobs(t, revealing);
    gl!.uniform4fv(U("uB"), B); gl!.uniform2fv(U("uV"), V); gl!.uniform2fv(U("uC"), C); gl!.uniform1f(U("uT"), t);
    // outside the reveal everything counts as written
    const [P, n] = revealing ? swept(t) : [new Float32Array(SWEEP * 3), 0];
    gl!.uniform3fv(U("uP"), P); gl!.uniform1i(U("uPN"), n);
    gl!.uniform1f(U("uAll"), revealing ? Math.min(1, Math.max(0, (t - SETTLE[0]) / (SETTLE[1] - SETTLE[0]))) : 1);
    gl!.uniform1i(U("uRevealing"), revealing ? 1 : 0);
    gl!.clearColor(0, 0, 0, 0); gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
  }

  let running = false, hovering = false, start = 0, fixed: number | null = null, raf = 0, wait = 0, alive = true;
  // the blurred levels are in their textures; a pass asked for before then starts when they are
  let ready = false, pending = false;
  // until the reveal has played, the mark is hidden (globals.css hides it before this runs)
  let revealing = reveal;
  const show = (on: boolean) => {
    canvas.style.visibility = on ? "visible" : "hidden";
    if (svg) svg.style.visibility = on || revealing ? "hidden" : "visible";
  };
  show(false);
  function frame() {
    if (!running || !alive) return;
    let t = fixed ?? (performance.now() - start) / 1000;
    if (fixed == null && t >= LOOP) {
      if (revealing) { revealing = false; running = false; show(false); return; } // written in; crisp from here
      if (hovering || autoplay) { start += LOOP * 1000; t -= LOOP; }
      else { running = false; show(false); return; } // finished the pass after the pointer left
    }
    draw(t);
    raf = requestAnimationFrame(frame);
  }
  function play() {
    if (running) return;
    if (!ready) { pending = true; return; }
    running = true; start = performance.now(); show(true); raf = requestAnimationFrame(frame);
  }

  const ro = new ResizeObserver(layout);
  ro.observe(svg ?? el);
  layout();
  const enter = () => { hovering = true; wait = window.setTimeout(play, delay); };
  const leave = () => { hovering = false; clearTimeout(wait); };
  if (autoplay) play();
  else { el.addEventListener("pointerenter", enter); el.addEventListener("pointerleave", leave); }
  // the reveal plays once, when most of the mark is on screen
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    play();
  }, { threshold: 0.5 });
  if (reveal) io.observe(svg ?? el);

  return {
    setT(v) {
      fixed = v;
      if (v == null) return;
      if (!running) { running = true; show(true); raf = requestAnimationFrame(frame); }
      draw(v);
    },
    destroy() {
      alive = false; running = false;
      cancelAnimationFrame(raf); clearTimeout(wait); ro.disconnect(); io.disconnect();
      el.removeEventListener("pointerenter", enter); el.removeEventListener("pointerleave", leave);
      revealing = false; show(false); canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
