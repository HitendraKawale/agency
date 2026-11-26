// Records Lab clips from a local compronents build, smoothly, at 2x:
//   node scripts/lab/record.mjs [--jobs 2] [--all | --redo | name ...]
// --redo takes what has no clip yet, errored, or ran over 20s (a take stretched by a starved machine).
// Reads content/lab.json; an entry's `recipe` wins, else its group's default below. Writes
// .lab/clips/<name>.mp4 (1600 wide, 30 fps), <name>.jpg (poster) and <name>.sheet.png (contact
// sheet), and .lab/metrics.json with how much each clip moves, so still clips stand out.
// Serve compronents first: `portless compronents next start` in that repo (BASE overrides).
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import puppeteer from "puppeteer-core";

const root = resolve(import.meta.dirname, "../..");
const BASE = process.env.BASE ?? "https://compronents.localhost:1355";
const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = join(root, ".lab/clips");
const W = 1280, H = 800, FRAME = 1000 / 60;

/** What a group's items usually respond to. `from: "load"` starts the take before navigation. */
const defaults = {
  Pages: { from: "load", steps: [{ do: "wait", ms: 4000 }, { do: "scroll", px: 3000, ms: 7000 }, { do: "wait", ms: 800 }] },
  "Preloaders and loaders": { from: "load", steps: [{ do: "wait", ms: 7000 }] },
  "Hero sections": { steps: [{ do: "loop", ms: 3500 }, { do: "scroll", px: 2000, ms: 4500 }, { do: "wait", ms: 800 }] },
  "Scroll sequences": { steps: [{ do: "wait", ms: 500 }, { do: "scroll", px: 3600, ms: 7500 }, { do: "wait", ms: 1000 }] },
  "Galleries and grids": { steps: [{ do: "loop", ms: 3500 }, { do: "scroll", px: 2400, ms: 5000 }, { do: "wait", ms: 600 }] },
  "Sliders and carousels": { steps: [{ do: "loop", ms: 2500, shape: "ellipse" }, { do: "drag", from: [0.75, 0.5], to: [0.25, 0.5], ms: 1400 }, { do: "wait", ms: 900 }, { do: "scroll", px: 1600, ms: 3000 }, { do: "wait", ms: 800 }] },
  "Cards and stacks": { steps: [{ do: "wait", ms: 500 }, { do: "scroll", px: 2800, ms: 6000 }, { do: "loop", ms: 2500 }] },
  "Text effects": { steps: [{ do: "wait", ms: 1500 }, { do: "loop", ms: 3500 }, { do: "scroll", px: 1800, ms: 4000 }, { do: "wait", ms: 800 }] },
  "Cursor and hover effects": { steps: [{ do: "loop", ms: 7000 }, { do: "wait", ms: 800 }] },
  "Menus and navigation": { steps: [{ do: "wait", ms: 800 }, { do: "click", selector: "button, [role=button]", ms: 700 }, { do: "wait", ms: 1600 }, { do: "loop", ms: 2500, rx: 0.2, ry: 0.3 }, { do: "wait", ms: 800 }] },
  "3D and WebGL scenes": { steps: [{ do: "wait", ms: 2500 }, { do: "loop", ms: 6000, shape: "ellipse", rx: 0.25, ry: 0.18 }] },
  "Layout, lists and widgets": { steps: [{ do: "loop", ms: 3500 }, { do: "scroll", px: 2000, ms: 4500 }, { do: "wait", ms: 800 }] },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
/** ffmpeg filters that report on stderr (blackdetect, signalstats) */
const probe = (...args) => spawnSync("ffmpeg", ["-hide_banner", ...args, "-an", "-f", "null", "-"], { maxBuffer: 64 << 20 }).stderr.toString();
const ff = (...args) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...args], { maxBuffer: 64 << 20 });

async function take(browser, entry) {
  const recipe = entry.recipe ?? defaults[entry.group] ?? defaults["Layout, lists and widgets"];
  const url = `${BASE}/${entry.section}/${entry.name}/preview`;
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
  // the preview's close button is ui.aryank.space chrome, never part of the clip
  await page.evaluateOnNewDocument(() =>
    addEventListener("DOMContentLoaded", () =>
      document.head.insertAdjacentHTML("beforeend", '<style>[aria-label="Close fullscreen"]{display:none!important}</style>'),
    ),
  );
  // warm pass: fill the cache so the take shows the component, not its assets arriving
  await page.goto(url, { waitUntil: "networkidle2", timeout: 90_000 }).catch(() => {});
  await sleep(1000);

  const frames = [];
  const cdp = await page.createCDPSession();
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    if (data.length > 1000) frames.push({ data, t: metadata.timestamp }); // under load Chrome sends empty frames
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  const start = () => cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, everyNthFrame: 1, maxWidth: W * 2, maxHeight: H * 2 });

  let mouse = { x: W / 2, y: H / 2 };
  // every motion runs on wall-clock progress, so a slow input round trip never stretches it
  const over = async (ms, fn) => {
    const t0 = performance.now();
    for (;;) {
      const k = Math.min(1, (performance.now() - t0) / ms);
      await fn(k);
      if (k === 1) return;
      await sleep(FRAME);
    }
  };
  const moveTo = async (x, y, ms) => {
    const from = { ...mouse };
    await over(ms, async (k) => {
      const e = ease(k);
      mouse = { x: from.x + (x - from.x) * e, y: from.y + (y - from.y) * e };
      await page.mouse.move(mouse.x, mouse.y);
    });
  };
  const steps = {
    wait: ({ ms }) => sleep(ms),
    // px is the distance the page should travel; a Lenis scroller moves half the wheel delta here
    // (measured: 6000px of wheel, 3000px of scrollTop), so it gets twice the wheel
    scroll: async ({ px: dist, ms }) => {
      const lenis = await page.evaluate((x, y) => !!document.elementFromPoint(x, y)?.closest(".lenis"), mouse.x, mouse.y);
      const px = lenis ? dist * 2 : dist;
      let done = 0;
      await over(ms, async (k) => {
        const d = px * ease(k) - done;
        done += d;
        if (d) await page.mouse.wheel({ deltaY: d });
      });
    },
    move: ({ x, y, ms }) => moveTo(x * W, y * H, ms),
    // a figure eight or an ellipse through the frame, in fractions of the viewport
    loop: async ({ shape = "eight", ms, rx = 0.32, ry = 0.26 }) => {
      const at = (a) => [W / 2 + W * rx * Math.sin(a), shape === "eight" ? H / 2 + H * ry * Math.sin(2 * a) : H / 2 + H * ry * Math.cos(a)];
      await moveTo(...at(0), 400);
      await over(ms, async (k) => {
        const [x, y] = at(k * Math.PI * 2);
        mouse = { x, y };
        await page.mouse.move(x, y);
      });
    },
    drag: async ({ from, to, ms }) => {
      await moveTo(from[0] * W, from[1] * H, 400);
      await page.mouse.down();
      await moveTo(to[0] * W, to[1] * H, ms);
      await page.mouse.up();
    },
    // press an element (by selector, the index-th visible match) or a point (x, y in fractions)
    click: async ({ selector, index = 0, x, y, hold = 0, ms = 600 }) => {
      const box = selector
        ? await page.evaluate((s, i) => {
            const el = [...document.querySelectorAll(s)].filter((e) => e.getBoundingClientRect().width > 0)[i];
            const r = el?.getBoundingClientRect();
            return r && { x: r.x + r.width / 2, y: r.y + r.height / 2 };
          }, selector, index)
        : { x: x * W, y: y * H };
      if (!box) return; // nothing to press: the clip shows the rest of the recipe
      await moveTo(box.x, box.y, ms);
      await page.mouse.down();
      await sleep(hold); // hold > 0 for press-and-hold components
      await page.mouse.up();
    },
    type: ({ text, delay = 90 }) => page.keyboard.type(text, { delay }),
    key: async ({ key, times = 1, gap = 500 }) => {
      for (let i = 0; i < times; i++) {
        await page.keyboard.press(key);
        await sleep(gap);
      }
    },
  };

  if (recipe.from === "load") {
    await page.goto("about:blank");
    await page.evaluate(() => (document.documentElement.style.background = "#0e0e0e"));
    await start();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 }).catch(() => {});
  } else {
    await page.reload({ waitUntil: "networkidle2", timeout: 90_000 }).catch(() => {});
    // a lazy image below the fold never decodes, so the wait is capped
    await page.evaluate(() =>
      Promise.race([Promise.all([...document.images].map((i) => i.decode().catch(() => {}))), new Promise((r) => setTimeout(r, 5000))]),
    );
    await sleep(600);
    await start();
  }
  await page.mouse.move(mouse.x, mouse.y);
  for (const step of recipe.steps) await steps[step.do](step);
  // the screencast only sends a frame when the picture changes, so a still ending would vanish:
  // a closing marker holds the last frame until the recipe finished
  frames.push({ t: Date.now() / 1000, end: true });
  await cdp.send("Page.stopScreencast");
  await page.close();
  return frames;
}

function encode(entry, frames) {
  const { name } = entry;
  const cold = (entry.recipe ?? defaults[entry.group] ?? {}).from === "load" || entry.group === "3D and WebGL scenes";
  const tmp = join(OUT, `.${name}`);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  // constant 30 fps: every tick from the first frame to the end marker shows the latest frame
  // received by then (concat's own per-entry durations drop the last one)
  const shots = frames.filter((f) => !f.end);
  shots.forEach((f, i) => writeFileSync(join(tmp, `${String(i).padStart(5, "0")}.jpg`), Buffer.from(f.data, "base64")));
  let list = "";
  for (let t = shots[0].t, i = 0; t <= frames.at(-1).t; t += 1 / 30) {
    while (shots[i + 1] && shots[i + 1].t <= t) i++;
    list += `file '${String(i).padStart(5, "0")}.jpg'\nduration 0.0333333\n`;
  }
  writeFileSync(join(tmp, "list.txt"), list);
  const mp4 = join(OUT, `${name}.mp4`);
  // trim the near-pure black lead-in of a cold load or a WebGL scene still compiling; a dark
  // component that is simply dark keeps every frame
  const black = cold ? probe("-f", "concat", "-safe", "0", "-i", join(tmp, "list.txt"), "-vf", "blackdetect=d=0.3:pix_th=0.02") : "";
  // capped: a load is black for a second or two, while a dark scene can read as black throughout
  const lead = String(Math.min(3, Number(/black_start:0 black_end:([\d.]+)/.exec(black)?.[1] ?? 0)));
  ff("-ss", lead, "-f", "concat", "-safe", "0", "-i", join(tmp, "list.txt"),
    "-vf", "fps=30,scale=1600:-2:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "medium", "-crf", "22",
    "-maxrate", "3M", "-bufsize", "6M", "-movflags", "+faststart", "-an", mp4);
  rmSync(tmp, { recursive: true, force: true });
  const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]));
  ff("-ss", String(dur / 2), "-i", mp4, "-frames:v", "1", "-vf", "scale=1200:-2", "-q:v", "3", join(OUT, `${name}.jpg`));
  ff("-i", mp4, "-vf", `fps=${(12 / dur).toFixed(3)},scale=400:-2,tile=6x2:padding=4:color=0x0e0e0e`, "-frames:v", "1", join(OUT, `${name}.sheet.png`));
  // how much the picture changes, frame to frame: a still clip means the recipe missed
  const stats = probe("-i", mp4, "-vf", "scale=320:-2,signalstats,metadata=print:key=lavfi.signalstats.YDIF");
  const ydif = [...stats.matchAll(/YDIF=([\d.]+)/g)].map((m) => Number(m[1]));
  // share of frames that change at all; low threshold, so a few thin strokes still count
  const moving = ydif.filter((d) => d > 0.05).length / Math.max(1, ydif.length);
  return { dur: Number(dur.toFixed(2)), lead: Number(lead), moving: Number(moving.toFixed(2)), mb: Number((readFileSync(mp4).length / 2 ** 20).toFixed(2)) };
}

const args = process.argv.slice(2);
const jobs = Number(args[args.indexOf("--jobs") + 1]) || 2;
const names = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--jobs");
const { entries } = JSON.parse(readFileSync(join(root, "content/lab.json"), "utf8"));
mkdirSync(OUT, { recursive: true });
const metricsPath = join(root, ".lab/metrics.json");
const metrics = existsSync(metricsPath) ? JSON.parse(readFileSync(metricsPath, "utf8")) : {};
const redo = (e) => !metrics[e.name] || metrics[e.name].error || metrics[e.name].dur > 20;
const queue = entries.filter((e) => (args.includes("--all") ? true : args.includes("--redo") ? redo(e) : names.includes(e.name)));

// one browser per worker: tabs sharing a browser are background tabs, and Chrome throttles their
// animation frames, which left clips frozen or stretched to a minute
const launch = () =>
  puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--ignore-certificate-errors", "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });
let done = 0;
await Promise.all(
  Array.from({ length: Math.min(jobs, queue.length) }, async () => {
    let browser = await launch();
    // a crashed Chrome would otherwise fail every take left in this worker's queue
    const live = async () => {
      if (!browser.connected) {
        browser.process()?.kill("SIGKILL");
        browser = await launch();
      }
      return browser;
    };
    for (let e = queue.shift(); e; e = queue.shift()) {
      try {
        // one retry: a take under load now and then ships a truncated JPEG frame
        const once = async () => encode(e, await take(await live(), e));
        const clip = await once().catch(once);
        metrics[e.name] = { ...clip, at: new Date().toISOString() };
        const m = metrics[e.name];
        console.log(`${++done} ${e.name}  ${m.dur}s  moving ${m.moving}  ${m.mb}MB${m.moving < 0.15 ? "  STILL?" : ""}`);
      } catch (err) {
        metrics[e.name] = { error: String(err).slice(0, 300), at: new Date().toISOString() };
        console.log(`${++done} ${e.name}  ERROR ${String(err).slice(0, 120)}`);
      }
      writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
    }
    // headless Chrome sometimes never answers close; give it 5s, then end the process
    await Promise.race([browser.close(), sleep(5000)]);
    browser.process()?.kill("SIGKILL");
  }),
);
process.exit(0);
