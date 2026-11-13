"""Depth scan: colour each pixel by its depth through a band that moves through the scene.

    .venv/bin/python scan.py <frames_dir> <out.mp4> [--fps 30] [--period 3.6] [--k 0.55] [--still N]

Mechanism, measured on reference/depth-scan/Dfm6VuQIAn5-b.mp4 (30 fps): every pixel follows
the same raised cosine, period 3.6 s, clipped to black for part of the cycle; depth
shifts its phase across the scene, so the frame pulses as one with
a band drifting from near to far. Colour runs from noir to one red, nothing else.
"""
import argparse
import glob
import subprocess

import cv2
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("frames"); ap.add_argument("out")
ap.add_argument("--fps", type=float, default=30)
ap.add_argument("--period", type=float, default=3.6)
ap.add_argument("--k", type=float, default=0.55)     # cycles of phase across the full depth range
ap.add_argument("--floor", type=float, default=0.08)  # fraction of the cosine clipped to black
ap.add_argument("--still", type=int, default=-1)
ap.add_argument("--soft", type=float, default=0.03)  # blur of the far field, fraction of width (0 = off)
ap.add_argument("--cut", type=float, default=0.45)   # equalised depth below which the field counts as far
ap.add_argument("--cutw", type=float, default=0.3)   # width of the blend from far to near
ap.add_argument("--peak", type=int, default=0)       # 1: the crest rises to a brighter red (tried, read as less crisp)
ap.add_argument("--guide", type=float, default=0)    # >0: snap depth edges to the photo's edges (guided-filter eps)
ap.add_argument("--rgb", default="215,47,33")        # band colour; Rerun spectrum red (heat ramp c4), sand is 246,218,117
a = ap.parse_args()

NOIR = np.array([14, 13, 13], np.float32) / 255
RED = np.array([int(c) for c in a.rgb.split(",")], np.float32) / 255
PEAK = np.array([246, 40, 24], np.float32) / 255    # the crest of the band: brighter, same hue, as bright as the reference's

paths = sorted(glob.glob(f"{a.frames}/d_*.png"))
h, w = cv2.imread(f"{a.frames}/f_00000.jpg").shape[:2]


def load(i):
    """Depth for frame i at the photo's size (depth.py may store it at the model's resolution)."""
    d = cv2.imread(paths[i], cv2.IMREAD_UNCHANGED).astype(np.float32) / 65535
    return d if d.shape == (h, w) else np.clip(cv2.resize(d, (w, h), interpolation=cv2.INTER_CUBIC), 0, 1)


# equalise over the clip so the band spends equal time on every depth layer
samp = np.concatenate([load(i).ravel()[::97] for i in range(0, len(paths), 5)])
qs = np.quantile(samp, np.linspace(0, 1, 257))


def eq(d):
    return np.interp(d, qs, np.linspace(0, 1, 257)).astype(np.float32)


def guided(I, p, r=8, e=1e-3):
    """He et al. guided filter: p smoothed but following the edges of grey image I."""
    box = lambda x: cv2.boxFilter(x, -1, (2 * r + 1, 2 * r + 1))
    mI, mp = box(I), box(p)
    a_ = (box(I * p) - mI * mp) / (box(I * I) - mI * mI + e)
    b_ = mp - a_ * mI
    return box(a_) * I + box(b_)


def blur(x, s):
    """Gaussian blur at quarter size. The far-field sigma is ~58 px at 1080p, so the result matches
    a full-size blur closely at about a sixteenth of the cost."""
    h_, w_ = x.shape
    q = cv2.resize(x, (w_ // 4, h_ // 4), interpolation=cv2.INTER_AREA)
    return cv2.resize(cv2.GaussianBlur(q, (0, 0), s / 4), (w_, h_), interpolation=cv2.INTER_LINEAR)


def frame(i):
    d = eq(load(i))
    if a.guide:
        g = cv2.cvtColor(cv2.imread(f"{a.frames}/f_{i:05d}.jpg"), cv2.COLOR_BGR2GRAY).astype(np.float32) / 255
        d = np.clip(guided(g, d, 4, a.guide), 0, 1)
    if a.soft:
        # far surfaces (walls, facades) become smooth gradients, as in the reference; near figures keep their edges
        # masked (normalised) blur: the far field is averaged from far pixels only, so near
        # figures do not bleed a halo into it
        w = np.clip((d - a.cut) / a.cutw, 0, 1); w = w * w * (3 - 2 * w)
        m = 1 - w
        sg = a.soft * d.shape[1]
        far = blur(d * m, sg) / np.maximum(blur(m, sg), 1e-3)
        d = far + (d - far) * w
    t = i / a.fps
    v = 0.5 + 0.5 * np.cos(2 * np.pi * (t / a.period - a.k * d))
    v = np.clip((v - a.floor) / (1 - a.floor), 0, 1)
    v = v * v * (3 - 2 * v)
    v3 = v[..., None]
    if a.peak:
        col = NOIR + (RED - NOIR) * np.clip(v3 / 0.8, 0, 1) + (PEAK - RED) * np.clip((v3 - 0.8) / 0.2, 0, 1)
    else:
        col = NOIR + (RED - NOIR) * v3
    rng = np.random.default_rng(i)
    col += (rng.random(d.shape, np.float32)[..., None] - 0.5) * 0.02
    return (np.clip(col, 0, 1) * 255).astype(np.uint8)


if a.still >= 0:
    cv2.imwrite(a.out, cv2.cvtColor(frame(a.still), cv2.COLOR_RGB2BGR))
else:
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}",
                           "-r", str(a.fps), "-i", "-", "-c:v", "libx264", "-crf", "16", "-pix_fmt", "yuv420p", a.out],
                          stdin=subprocess.PIPE)
    for i in range(len(paths)):
        ff.stdin.write(frame(i).tobytes())
    ff.stdin.close(); ff.wait()
print(a.out)
