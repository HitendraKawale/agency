"""Cylinder warp for smart objects that Photoshop wraps around a cup (warpStyle "warpCylinder").

Photoshop's parametric cylinder values are not documented, so the mapping is fitted: the layer's
stored raster is Photoshop's own warp of the embedded placeholder, and we search for the mapping
that reproduces it (compared on alpha), then apply the same mapping to new art.

Model, in canvas pixels, over the placement box (x0..x1, y0..y1) from nonAffineTransform:
  t = (x - mid) / half in [-1, 1]            column across the visible face
  u = 0.5 + du + asin(t) / pi * f            f = share of the content width that is visible
  y = y0 + v * (y1 - y0) + bow * sqrt(1 - t^2)   rows bow into an arc (the near side sags)
so for an output pixel: v = (y - y0 - bow * sqrt(1 - t^2)) / (y1 - y0).
"""
from __future__ import annotations

import cv2
import numpy as np


def maps(box: tuple[float, float, float, float], out_origin: tuple[int, int], out_shape: tuple[int, int],
         cw: int, ch: int, f: float, bow: float, du: float = 0.0, k: float = 1.0, dv: float = 0.0):
    """cv2.remap tables: output pixels (out_origin + index) -> content pixels."""
    x0, y0, x1, y1 = box
    oh, ow = out_shape
    ys, xs = np.mgrid[0:oh, 0:ow].astype(np.float32)
    xs += out_origin[0] + 0.5
    ys += out_origin[1] + 0.5
    mid, half = (x0 + x1) / 2, (x1 - x0) / 2
    t = (xs - mid) / half
    inside = np.abs(t) <= 1
    tc = np.clip(t, -1, 1)
    u = 0.5 + du + np.arcsin(tc) / np.pi * f
    v = (ys - y0 - dv - bow * np.sqrt(1 - tc * tc)) / ((y1 - y0) * k)
    ok = inside & (v >= 0) & (v <= 1) & (u >= 0) & (u <= 1)
    mx = np.where(ok, u * cw - 0.5, -1).astype(np.float32)
    my = np.where(ok, v * ch - 0.5, -1).astype(np.float32)
    return mx, my


def wrap(art: np.ndarray, box, out_origin, out_shape, f, bow, du=0.0, k=1.0, dv=0.0) -> np.ndarray:
    ch, cw = art.shape[:2]
    mx, my = maps(box, out_origin, out_shape, cw, ch, f, bow, du, k, dv)
    return cv2.remap(art, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def fit(placeholder_alpha: np.ndarray, stored_alpha: np.ndarray, box, stored_origin) -> dict[str, float]:
    """Search f, bow, du so the wrapped placeholder alpha matches the stored alpha."""
    s = 0.25
    sh = (int(stored_alpha.shape[0] * s), int(stored_alpha.shape[1] * s))
    target = cv2.resize(stored_alpha, sh[::-1], interpolation=cv2.INTER_AREA)
    ph = cv2.resize(placeholder_alpha, (placeholder_alpha.shape[1] // 4, placeholder_alpha.shape[0] // 4), interpolation=cv2.INTER_AREA)
    bx = tuple(c * s for c in box)
    org = (stored_origin[0] * s, stored_origin[1] * s)
    best = (1e9, None)
    for f in np.linspace(0.8, 1.0, 9):
        for bow in np.linspace(0, 40, 17):
            for k in np.linspace(0.9, 1.02, 13):
                for dv in np.linspace(-15, 15, 7):
                    w = wrap(ph, bx, org, sh, f, bow, 0.0, k, dv)
                    e = float(np.abs(w - target).mean())
                    if e < best[0]:
                        best = (e, dict(f=float(f), bow=float(bow / s), du=0.0, k=float(k), dv=float(dv / s)))
    p = best[1]
    p["err"] = best[0]
    p["err_blank"] = float(target.mean())  # error of predicting nothing, for scale
    return p
