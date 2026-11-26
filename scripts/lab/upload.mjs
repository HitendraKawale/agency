// Uploads reviewed Lab clips to Vercel Blob and writes their URLs into content/lab.json:
//   node --env-file=.env.lab scripts/lab/upload.mjs [--force] [name ...]
// Only entries marked "pass" go up. Each gets two encodes: the full 1600px clip for its own page,
// and a 960px tile (about a seventh of the bytes) with a WebP poster for the grid. An entry already
// uploaded is skipped unless --force or named; one missing only its tile gets just the tile.
// .env.lab holds BLOB_READ_WRITE_TOKEN (`vercel env pull .env.lab --environment=development`).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { put } from "@vercel/blob";

const root = resolve(import.meta.dirname, "../..");
const file = join(root, "content/lab.json");
const clips = join(root, ".lab/clips");
const args = process.argv.slice(2);
const named = args.filter((a) => !a.startsWith("--"));
const data = JSON.parse(readFileSync(file, "utf8"));

const todo = data.entries.filter(
  (e) => e.status === "pass" && (named.length ? named.includes(e.name) : args.includes("--force") || !e.clip?.tile),
);
const opts = (contentType) => ({ access: "public", addRandomSuffix: false, allowOverwrite: true, contentType, cacheControlMaxAge: 31536000 });
const ff = (...a) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...a]);

/** the grid's encode, and its poster from the same midpoint as the full clip's */
function tile(name, duration) {
  const mp4 = join(clips, `${name}.tile.mp4`), webp = join(clips, `${name}.tile.webp`), png = join(clips, `.${name}.tile.png`);
  ff("-i", join(clips, `${name}.mp4`), "-vf", "scale=960:-2:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "26",
    "-maxrate", "1.5M", "-bufsize", "3M", "-movflags", "+faststart", "-an", mp4);
  ff("-ss", String(duration / 2), "-i", mp4, "-frames:v", "1", png);
  execFileSync("cwebp", ["-quiet", "-q", "72", png, "-o", webp]);
  rmSync(png);
  return { mp4, webp };
}

let n = 0;
for (const e of todo) {
  const mp4 = join(clips, `${e.name}.mp4`), jpg = join(clips, `${e.name}.jpg`);
  if (!existsSync(mp4) || !existsSync(jpg)) {
    console.log(`skip ${e.name}: no recording in .lab/clips`);
    continue;
  }
  const full = !e.clip || named.includes(e.name) || args.includes("--force");
  if (full) {
    const [width, height, duration] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height:format=duration", "-of", "csv=p=0:s=,", mp4])
      .toString().trim().split(/[\n,]/).filter(Boolean).map(Number);
    const video = await put(`lab/${e.name}.mp4`, readFileSync(mp4), opts("video/mp4"));
    const poster = await put(`lab/${e.name}.jpg`, readFileSync(jpg), opts("image/jpeg"));
    e.clip = { src: video.url, poster: poster.url, width, height, duration: Number(duration.toFixed(2)) };
  }
  const t = tile(e.name, e.clip.duration);
  e.clip.tile = (await put(`lab/${e.name}.tile.mp4`, readFileSync(t.mp4), opts("video/mp4"))).url;
  e.clip.tilePoster = (await put(`lab/${e.name}.tile.webp`, readFileSync(t.webp), opts("image/webp"))).url;
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n"); // after each, so an interrupted run keeps its progress
  console.log(`${++n}/${todo.length} ${e.name}${full ? "" : " (tile)"}`);
}
