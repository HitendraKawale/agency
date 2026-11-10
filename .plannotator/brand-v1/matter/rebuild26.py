"""Rebuild Rerun's 26-artwork frame (threaded rod) from a procedural surface, to prove the
mechanism of their spectrum-on-matter effect before applying it to our own matter.

Mechanism (recovered by inverting their colormap, see ref26-v.png):
  1. a surface gives an unwrapped value u(x, y): background ~1.1, silhouette rim dip ~0.85,
     body ~0.95 modulated by threads, falling to ~0.45 toward the bottom
  2. colour = cyclic ramp(fract(u)) with stops blue, pale blue, mint, yellow, red, blue
  3. blur AFTER colour mapping, in RGB, stronger vertically (red->blue goes through purple)
  4. fine grain

    python3 rebuild26.py <out.png> [ref.jpg]
"""

import sys
import numpy as np
from PIL import Image, ImageFilter

STOPS = np.array([[24, 106, 221], [155, 191, 211], [134, 217, 166], [246, 218, 117], [215, 47, 33], [24, 106, 221]], float)


def ramp(u):
    f = (u % 1.0) * 5
    k = np.clip(np.floor(f).astype(int), 0, 4)
    t = (f - k)[..., None]
    return STOPS[k] * (1 - t) + STOPS[k + 1] * t


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def surface(W, H):
    y, x = np.mgrid[0:H, 0:W].astype(float)
    x /= W
    y /= H
    # thread phase: period tightens strongly to the right (rod receding in perspective)
    phase = 2 * np.pi * (3.0 * x + 6.2 * x * x)
    crest = 0.5 + 0.5 * np.cos(phase)
    amp_x = 0.25 + 0.75 * x
    sil = 0.10 - 0.07 * amp_x * crest ** 3  # silhouette: sharp crests point up, flatter on the left
    inside = smooth(sil - 0.004, sil + 0.004, y)
    depth = y - sil
    base = 0.955 - 0.17 * smooth(0.25, 0.92, y) - 0.33 * smooth(0.86, 1.06, y)
    env = smooth(0.0, 0.07, depth)
    thread = (0.03 + 0.11 * x) * np.cos(phase + 0.6 * depth) * env * (1 + 0.6 * y)
    rim = -0.12 * np.exp(-((depth - 0.012) / 0.017) ** 2)
    body = base + thread + rim
    # above the silhouette: pale blue sky with a smeared red-orange band on the left
    band = 0.27 * np.exp(-((y - 0.075) / 0.045) ** 2) * (1 - smooth(0.0, 0.75, x))
    bg = 1.12 - band
    return bg * (1 - inside) + body * inside


def render(W=1000, H=562):
    u = surface(W, H)
    rgb = Image.fromarray(np.clip(ramp(u), 0, 255).astype(np.uint8))
    # anisotropic blur: vertical smear then a soft overall blur
    small = rgb.resize((W, H // 6), Image.BILINEAR).resize((W, H), Image.BICUBIC)
    rgb = Image.blend(rgb, small, 0.55).filter(ImageFilter.GaussianBlur(W * 0.006))
    a = np.asarray(rgb, float)
    a += np.random.default_rng(3).normal(0, 4, a.shape)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def main():
    out = sys.argv[1]
    im = render()
    im.save(out)
    if len(sys.argv) > 2:
        ref = Image.open(sys.argv[2]).convert("RGB").resize(im.size)
        diff = np.abs(np.asarray(ref, float) - np.asarray(im, float)).mean()
        side = Image.new("RGB", (im.width * 2 + 10, im.height), "white")
        side.paste(ref, (0, 0))
        side.paste(im, (im.width + 10, 0))
        side.save(out.replace(".png", "-side.png"))
        print("mean abs diff vs ref", round(float(diff), 1))


if __name__ == "__main__":
    main()
