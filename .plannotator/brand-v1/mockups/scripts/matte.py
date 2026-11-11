"""Recover a transparent PNG from two renders of the same art, one on black and one on white.

    .venv/bin/python scripts/matte.py <on-black.png> <on-white.png> <out.png>

Difference matting: where the art is opaque both renders agree; where it is clear they differ by the
full black-to-white step. alpha = 1 - (white - black), colour = black / alpha. Used because the
headless browser cannot capture a transparent background.
"""
import sys

import numpy as np
from PIL import Image

black = np.asarray(Image.open(sys.argv[1]).convert("RGB"), np.float32) / 255.0
white = np.asarray(Image.open(sys.argv[2]).convert("RGB"), np.float32) / 255.0
if black.shape != white.shape:
    raise SystemExit(f"size mismatch {black.shape} vs {white.shape}")
alpha = np.clip(1.0 - (white - black).mean(axis=-1, keepdims=True), 0.0, 1.0)
color = np.divide(black, alpha, out=np.zeros_like(black), where=alpha > 1e-3)
rgba = np.concatenate([np.clip(color, 0, 1), alpha], axis=-1)
Image.fromarray((rgba * 255).round().astype(np.uint8), "RGBA").save(sys.argv[3])
print(sys.argv[3], rgba.shape[1], "x", rgba.shape[0], "opaque %.1f%%" % (float((alpha > 0.99).mean()) * 100))
