"""Per-frame depth for a clip, with Depth Anything V2 Small (Apache-2.0) on the Mac GPU.

    .venv/bin/python depth.py <clip.mp4> <out_dir> [--seconds N] [--start S] [--width W]

Writes <out_dir>/d_00000.png ... as 16-bit relative inverse depth (bigger = nearer), normalised
over the whole clip (1st and 99th percentile of all frames), so a pixel's value only changes
when the scene does.

Footage (src/, not committed): Mixkit free stock video, free for commercial use.
    4519  students walking away   https://assets.mixkit.co/videos/4519/4519-1080.mp4  (--start 2 --seconds 12 --width 1920)
    17630 man before a crowd      https://assets.mixkit.co/videos/17630/17630-720.mp4 (--start 1 --seconds 10 --width 1920) A short temporal blend (ema) removes frame-to-frame flicker.
"""
import argparse
import os

import cv2
import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

ap = argparse.ArgumentParser()
ap.add_argument("clip"); ap.add_argument("out")
ap.add_argument("--seconds", type=float, default=6); ap.add_argument("--start", type=float, default=0)
ap.add_argument("--width", type=int, default=1280)
ap.add_argument("--model", default="depth-anything/Depth-Anything-V2-Small-hf")
ap.add_argument("--ema", type=float, default=0.5)   # blend with the previous frame
ap.add_argument("--lowonly", type=int, default=0)   # 1: blend only the low band (no ghosting; tried, read as less crisp)
ap.add_argument("--size", type=int, default=518)    # model input height (multiple of 14); 1036 tried, read as less crisp
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)

dev = "mps" if torch.backends.mps.is_available() else "cpu"
proc = AutoImageProcessor.from_pretrained(a.model)
model = AutoModelForDepthEstimation.from_pretrained(a.model).to(dev).eval()

cap = cv2.VideoCapture(a.clip)
fps = cap.get(cv2.CAP_PROP_FPS)
cap.set(cv2.CAP_PROP_POS_MSEC, a.start * 1000)
n = int(a.seconds * fps)
raw, prev = [], None
for i in range(n):
    ok, bgr = cap.read()
    if not ok: break
    h, w = bgr.shape[:2]
    H = round(h * a.width / w / 2) * 2
    rgb = cv2.cvtColor(cv2.resize(bgr, (a.width, H), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
    cv2.imwrite(f"{a.out}/f_{i:05d}.jpg", cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 92])
    inp = proc(images=Image.fromarray(rgb), size={"height": a.size, "width": a.size}, return_tensors="pt").to(dev)
    with torch.no_grad():
        d = model(**inp).predicted_depth
    d = torch.nn.functional.interpolate(d[None], size=(H, a.width), mode="bicubic", align_corners=False)[0, 0].cpu().numpy()
    # flicker is slow and large-scale; edges move. Blend only the low band with the last frame,
    # so moving silhouettes stay where they are now instead of leaving a ghost behind.
    if a.lowonly:
        low = cv2.GaussianBlur(d, (0, 0), a.width / 60)
        prev = low if prev is None else a.ema * prev + (1 - a.ema) * low
        raw.append((prev + d - low).astype(np.float32))
    else:
        prev = d if prev is None else a.ema * prev + (1 - a.ema) * d
        raw.append(prev.astype(np.float32))
    print(f"\r{i + 1}/{n}", end="", flush=True)
print()
lo, hi = np.percentile(np.stack(raw[:: max(1, len(raw) // 20)]), [1, 99])
for i, d in enumerate(raw):
    v = np.clip((d - lo) / (hi - lo), 0, 1)
    cv2.imwrite(f"{a.out}/d_{i:05d}.png", (v * 65535).astype(np.uint16))
print(a.out, len(raw), "frames at", fps, "fps")
