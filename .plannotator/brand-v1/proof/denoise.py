"""Prototype of the blank interfaces artwork generator.

A model's blank page is not empty: it is noise, every page it could still become.
The page resolves region by region. Rule: colour marks only what is still undecided.
Decided regions turn into plain ink on paper; a hot front runs where the page is being
decided right now. At t=1 everything is colour, at t=0 the page is plain neutrals.

    python3 denoise.py <page.png> <out.png> [--palettes a,b] [--ts 1,.8,.6,.4,.2,0]
"""

import sys
import numpy as np
from PIL import Image

INK = "#0F0E12"
PAPER = "#F7F6F2"

RAMPS = {
    # undecided field: ink -> violet -> magenta -> ember -> gold (the front)
    "pyre": ["#0F0E12", "#2E1263", "#8E2475", "#E0532F", "#F7B53C"],
    "viridis": ["#440154", "#3B528B", "#21918C", "#5EC962", "#FDE725"],
}


def hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i : i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255


def ramp(values, stops):
    cols = np.stack([hex_rgb(s) for s in stops])
    pos = np.linspace(0, 1, len(stops))
    out = np.empty(values.shape + (3,), dtype=np.float32)
    for c in range(3):
        out[..., c] = np.interp(values, pos, cols[:, c])
    return out


def smooth(h, w, rng, cell):
    lh, lw = max(2, h // cell + 2), max(2, w // cell + 2)
    z = rng.standard_normal((lh, lw)).astype(np.float32)
    zi = Image.fromarray(z, mode="F").resize((w, h), Image.BICUBIC)
    return np.asarray(zi, dtype=np.float32)


def fbm(h, w, rng, cell=160, octaves=4):
    out = np.zeros((h, w), np.float32)
    amp = 1.0
    for _ in range(octaves):
        out += amp * smooth(h, w, rng, max(4, cell))
        cell //= 2
        amp *= 0.5
    return (out - out.mean()) / out.std()


def warp(field, dx, dy, k):
    h, w = field.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    xs = np.clip(xx + dx * k, 0, w - 1).astype(int)
    ys = np.clip(yy + dy * k, 0, h - 1).astype(int)
    return field[ys, xs]


def fields(h, w, seed=7):
    rng = np.random.default_rng(seed)
    dx, dy = fbm(h, w, rng, 220, 3), fbm(h, w, rng, 220, 3)
    eps = warp(fbm(h, w, rng, 180, 4), dx, dy, 60)
    thr = warp(fbm(h, w, rng, 260, 4), dx, dy, 40)
    thr = (thr - thr.min()) / (thr.max() - thr.min())
    grain = rng.standard_normal((h, w)).astype(np.float32)
    return eps, thr, grain


def render(page, t, eps, thr, grain, stops, edge=0.035):
    p = 1 - t  # how much of the page is decided
    decided = np.clip((p - thr) / edge + 0.5, 0, 1)
    front = np.exp(-(((thr - p) / (edge * 1.6)) ** 2)) * (0 < p < 1)
    v = 1 / (1 + np.exp(-1.3 * (eps + 0.12 * grain)))
    v = np.clip(v + 0.55 * front, 0, 1)
    field = ramp(v, stops)
    ink, paper = hex_rgb(INK), hex_rgb(PAPER)
    neutral = paper * page[..., None] + ink * (1 - page[..., None])
    return field * (1 - decided[..., None]) + neutral * decided[..., None]


def load_page(src, W, H):
    im = Image.open(src).convert("L")
    im = im.resize((W, int(im.height * W / im.width)), Image.LANCZOS).crop((0, 0, W, H))
    return np.asarray(im, dtype=np.float32) / 255


def main():
    src, out = sys.argv[1], sys.argv[2]
    args = dict(zip(sys.argv[3::2], sys.argv[4::2]))
    palettes = args.get("--palettes", "pyre,viridis").split(",")
    ts = [float(x) for x in args.get("--ts", "1,.85,.7,.55,.4,.2,0").split(",")]
    W, H = int(args.get("--w", 640)), int(args.get("--h", 360))
    page = load_page(src, W, H)
    eps, thr, grain = fields(H, W)
    rows = [np.concatenate([render(page, t, eps, thr, grain, RAMPS[p]) for t in ts], axis=1) for p in palettes]
    grid = np.concatenate(rows, axis=0)
    Image.fromarray((grid.clip(0, 1) * 255).astype(np.uint8)).save(out)


if __name__ == "__main__":
    main()
