"""Wrap an unrolled (flat) cup print round a cup whose mockup only has a flat smart object.

    .venv/bin/python scripts/wrap_cup.py <unrolled.png RGBA> <rows.json> <out.png> <content_w> <content_h> [bow] [aspect]

rows.json: per content row, the left/right of the cup's printable surface in content pixels (measured
by rendering a solid fill through the PSD). For each output pixel, t = (x - centre) / half-width of
that row; the angle round the cup is asin(t), and the unrolled image is read at arc length
angle * R (R = the widest half-width, so letters keep their size). Columns past the edge are empty,
so anything wider than the visible half of the cup runs off round the sides. bow drops the middle of
each row slightly, for a camera a little above the cup. aspect = the content pixel's width / height on
the photo (smart objects are often placed squashed); the unrolled image is authored in square pixels
of the content's vertical scale, so arc lengths are multiplied by it.
"""
import json
import sys

import cv2
import numpy as np
from PIL import Image

src = np.asarray(Image.open(sys.argv[1]).convert("RGBA"), np.float32) / 255.0
rows = {int(k): v for k, v in json.load(open(sys.argv[2])).items()}
W, H = int(sys.argv[4]), int(sys.argv[5])
bow = float(sys.argv[6]) if len(sys.argv) > 6 else 0.0
aspect = float(sys.argv[7]) if len(sys.argv) > 7 else 1.0

ys = np.array(sorted(rows), np.float32)
L = np.interp(np.arange(H), ys, [rows[int(y)][0] for y in ys]).astype(np.float32)
Rr = np.interp(np.arange(H), ys, [rows[int(y)][1] for y in ys]).astype(np.float32)
cx, half = (L + Rr) / 2, (Rr - L) / 2
R = float(half.max())

gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
t = (gx + 0.5 - cx[:, None]) / half[:, None]
ok = np.abs(t) < 1
theta = np.arcsin(np.clip(t, -1, 1))
mx = src.shape[1] / 2 + theta * R * aspect - 0.5
my = gy + 0.5 - bow * np.sqrt(1 - np.clip(t, -1, 1) ** 2) - 0.5
mx = np.where(ok, mx, -1).astype(np.float32)
my = np.where(ok, my, -1).astype(np.float32)

prem = src.copy()
prem[..., :3] *= prem[..., 3:4]
out = cv2.remap(prem, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
a = out[..., 3:4]
out[..., :3] = np.divide(out[..., :3], a, out=np.zeros_like(out[..., :3]), where=a > 1e-4)
Image.fromarray((np.clip(out, 0, 1) * 255).round().astype(np.uint8), "RGBA").save(sys.argv[3])
print(sys.argv[3], W, "x", H, "R", round(R))
