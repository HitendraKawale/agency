#!/usr/bin/env python3
"""Render artwork into a PSD mockup by smart-object replacement, without Photoshop.

  render.py --list <psd>
      Print the smart-object layers as JSON: name, group path, content size,
      placement quad, linked-content id, warp, smart filters.

  render.py --psd <psd> --art <png> --out <jpg> [--layer <name>] [--fit cover|contain|stretch]
      Replace the content of the target smart object (and every layer that
      shares its embedded content, as Photoshop does) with the artwork, then
      composite the whole document through psd-tools.

  render.py --psd <psd> --selftest --out <jpg> [--layer <name>]
      Same pipeline, but with the smart object's own embedded placeholder as
      the art. The result should reproduce the PSD's saved preview; the pixel
      difference against it is printed. This checks the quad, warp, filters
      and compositor together.

How it works: psd-tools' Compositor reads each layer's pixels through
Layer.numpy(). For every target layer we swap that method for one that returns
the artwork warped into the layer's quad (and through any custom mesh warp and
Gaussian Blur smart filter), and widen the layer record's bounds to the warped
result. Everything else (masks, clipping, blend modes, opacity, layer effects,
adjustment layers, groups) stays psd-tools' own compositing, so layers above
and below the smart object are blended in their real stacking order.
"""

from __future__ import annotations

import argparse
import io
import json
import logging
import math
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image
from psd_tools import PSDImage
from psd_tools.api.layers import Layer
from psd_tools.composite import composite as psd_composite
from psd_tools.composite.adjustments import ADJUSTMENT_FUNC
from psd_tools.constants import ColorMode

Image.MAX_IMAGE_PIXELS = None
log = logging.getLogger("render")

# Smart filters we can redo on the replaced content. Anything else is reported.
SUPPORTED_FILTERS = {"Gaussian Blur", "Displace"}


# --------------------------------------------------------------------------
# Descriptor helpers
# --------------------------------------------------------------------------


def to_py(v: Any) -> Any:
    """Convert a psd-tools descriptor tree into plain Python values."""
    if hasattr(v, "items") and callable(v.items):
        return {
            (k.decode("latin-1").strip() if isinstance(k, bytes) else str(k)): to_py(x)
            for k, x in v.items()
        }
    if hasattr(v, "values") and hasattr(v, "unit") and isinstance(getattr(v, "values"), list):
        return [float(x) for x in v.values]
    if hasattr(v, "enum") and hasattr(v, "typeID"):
        e = v.enum
        return e.decode("latin-1").strip() if isinstance(e, bytes) else str(e)
    if isinstance(v, (list, tuple)) or (hasattr(v, "__iter__") and hasattr(v, "append")):
        return [to_py(x) for x in v]
    if hasattr(v, "value") and not isinstance(v, (str, bytes)):
        return to_py(v.value)
    if isinstance(v, bytes):
        return v.decode("latin-1").strip("\x00")
    if isinstance(v, str):
        return v.strip("\x00")
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return v
    return str(v)


# --------------------------------------------------------------------------
# Smart-object discovery
# --------------------------------------------------------------------------


@dataclass
class SmartLayer:
    layer: Layer
    name: str
    path: str
    uid: str
    size: tuple[int, int]
    quad: np.ndarray  # (4, 2) canvas coords: TL, TR, BR, BL of the content
    quad_source: str
    warp_style: str
    mesh: np.ndarray | None  # (4, 4, 2) content-space bezier control points, or None
    warp_bounds: tuple[float, float, float, float] | None  # left, top, right, bottom
    filters: list[dict[str, Any]] = field(default_factory=list)
    filters_enabled: bool = True
    kind: str = ""
    filetype: str | None = None

    def to_json(self) -> dict[str, Any]:
        l = self.layer
        w, h = self.size
        g = math.gcd(w, h) or 1
        return {
            "name": self.name,
            "path": self.path,
            "visible": l.is_visible(),
            "blend_mode": l.blend_mode.name,
            "opacity": round(l.opacity / 255, 3),
            "content_uid": self.uid,
            "content_kind": self.kind,
            "content_type": self.filetype,
            "size": [w, h],
            "aspect": f"{w // g}:{h // g}",
            "aspect_ratio": round(w / h, 4) if h else None,
            "quad": [[round(float(x), 2), round(float(y), 2)] for x, y in self.quad],
            "quad_source": self.quad_source,
            "bbox": list(l.bbox),
            "warp": self.warp_style,
            "smart_filters": [
                {"name": f["name"], "enabled": f["enabled"], "supported": f["name"] in SUPPORTED_FILTERS}
                for f in self.filters
            ],
        }


def layer_path(layer: Layer) -> str:
    names = []
    p = layer.parent
    while p is not None and isinstance(p, Layer):
        names.append(p.name)
        p = p.parent
    return "/".join(reversed(names))


def _quad(vals: Any) -> np.ndarray | None:
    if vals is None:
        return None
    arr = np.asarray([float(x) for x in vals], dtype=np.float64)
    if arr.size != 8 or not np.all(np.isfinite(arr)):
        return None
    q = arr.reshape(4, 2)
    if abs(cv2.contourArea(q.astype(np.float32))) < 1.0:
        return None
    return q


def read_smart_layer(layer: Layer) -> SmartLayer:
    so = layer.smart_object
    cfg = to_py(so._config.data) if so._config is not None else {}
    size = cfg.get("Sz", {})
    w, h = int(round(size.get("Wdth", 0))), int(round(size.get("Hght", 0)))
    kind, ftype = "", None
    try:
        kind, ftype = so.kind, so.filetype
    except ValueError:
        pass
    if (w <= 0 or h <= 0) and kind == "data":
        # Fall back to the embedded file's own header.
        w, h = _embedded_size(so)

    quad, source = _quad(cfg.get("nonAffineTransform")), "nonAffineTransform"
    if quad is None:
        quad, source = _quad(cfg.get("Trnf")), "Trnf"
    if quad is None:
        quad, source = _quad(so.transform_box), "PlacedLayer.transform"
    if quad is None:
        l, t, r, b = layer.bbox
        quad, source = np.array([[l, t], [r, t], [r, b], [l, b]], dtype=np.float64), "bbox"

    warp = cfg.get("warp", {}) or {}
    style = str(warp.get("warpStyle", "warpNone"))
    mesh = None
    bounds = None
    if style == "warpCustom":
        pts = warp.get("customEnvelopeWarp", {}).get("meshPoints", {})
        # meshPoints: {Hrzn: [16 x], Vrtc: [16 y]}, row-major 4x4 bezier control grid
        hs, vs = (pts.get("Hrzn"), pts.get("Vrtc")) if isinstance(pts, dict) else (None, None)
        if hs is not None and vs is not None and len(hs) == 16 and len(vs) == 16:
            mesh = np.stack([np.asarray(hs, float), np.asarray(vs, float)], axis=-1).reshape(4, 4, 2)
        b = warp.get("bounds", {})
        bounds = (b.get("Left", 0.0), b.get("Top ", b.get("Top", 0.0)), b.get("Rght", w), b.get("Btom", h))
    elif style not in ("warpNone", ""):
        log.warning("%s: warp style %s is not reproduced (treated as none)", layer.name, style)

    fx = cfg.get("filterFX") or {}
    filters = []
    for f in fx.get("filterFXList", []) or []:
        name = str(f.get("Nm", f.get("Nm  ", ""))).replace("...", "").strip()
        filters.append({"name": name, "enabled": bool(f.get("enab", True)), "params": f.get("Fltr", {}), "blend": f.get("blendOptions", {})})

    return SmartLayer(
        layer=layer,
        name=layer.name,
        path=layer_path(layer),
        uid=so.unique_id if so._config is not None else "",
        size=(w, h),
        quad=quad,
        quad_source=source,
        warp_style=style,
        mesh=mesh,
        warp_bounds=bounds,
        filters=filters,
        filters_enabled=bool(fx.get("enab", True)) if fx else True,
        kind=kind,
        filetype=ftype,
    )


def _embedded_size(so: Any) -> tuple[int, int]:
    data = so.data
    if data[:4] == b"8BPS":
        h, w = int.from_bytes(data[14:18], "big"), int.from_bytes(data[18:22], "big")
        return w, h
    with Image.open(io.BytesIO(data)) as im:
        return im.size


def smart_layers(psd: PSDImage) -> list[SmartLayer]:
    return [read_smart_layer(l) for l in psd.descendants() if l.kind == "smartobject"]


def primary(group: list[SmartLayer]) -> SmartLayer:
    """The instance a person would call "the design": visible, Normal, most opaque, largest."""
    return max(
        group,
        key=lambda s: (
            s.layer.is_visible(),
            s.layer.blend_mode.name == "NORMAL",
            s.layer.opacity,
            abs(cv2.contourArea(s.quad.astype(np.float32))),
        ),
    )


def pick_targets(layers: list[SmartLayer], name: str | None) -> list[SmartLayer]:
    """All layers sharing the chosen layer's embedded content (Photoshop instances)."""
    if not layers:
        raise SystemExit("no smart-object layers in this PSD")
    if name:
        hits = [s for s in layers if s.name == name or f"{s.path}/{s.name}".strip("/") == name]
        if not hits:
            hits = [s for s in layers if s.name.lower() == name.lower()]
        if not hits:
            raise SystemExit(f"no smart-object layer named {name!r}; try --list")
        uid = hits[0].uid
    else:
        # Default: the content whose visible instances cover the most canvas.
        area: dict[str, float] = {}
        for s in layers:
            if s.layer.is_visible():
                area[s.uid] = area.get(s.uid, 0.0) + abs(cv2.contourArea(s.quad.astype(np.float32)))
        if not area:
            raise SystemExit("no visible smart-object layer; pass --layer")
        uid = max(area, key=area.__getitem__)
    return [s for s in layers if s.uid == uid]


# --------------------------------------------------------------------------
# Art preparation and warping
# --------------------------------------------------------------------------


def load_art(path: Path) -> np.ndarray:
    """RGBA float32 in [0, 1]."""
    with Image.open(path) as im:
        im = im.convert("RGBA")
        return np.asarray(im, dtype=np.float32) / 255.0


def fit_art(art: np.ndarray, size: tuple[int, int], fit: str) -> np.ndarray:
    W, H = size
    h, w = art.shape[:2]
    if (w, h) == (W, H):
        return art
    if fit == "stretch" or abs(w / h - W / H) < 1e-3:
        return _resize(art, W, H)
    s = max(W / w, H / h) if fit == "cover" else min(W / w, H / h)
    nw, nh = max(1, round(w * s)), max(1, round(h * s))
    scaled = _resize(art, nw, nh)
    out = np.zeros((H, W, 4), np.float32)
    x0, y0 = (W - nw) // 2, (H - nh) // 2
    sx0, sy0 = max(0, -x0), max(0, -y0)
    dx0, dy0 = max(0, x0), max(0, y0)
    cw, ch = min(nw - sx0, W - dx0), min(nh - sy0, H - dy0)
    out[dy0 : dy0 + ch, dx0 : dx0 + cw] = scaled[sy0 : sy0 + ch, sx0 : sx0 + cw]
    return out


def _resize(img: np.ndarray, w: int, h: int) -> np.ndarray:
    interp = cv2.INTER_AREA if w < img.shape[1] and h < img.shape[0] else cv2.INTER_CUBIC
    return np.clip(cv2.resize(img, (w, h), interpolation=interp), 0.0, 1.0)


# Fitted parameters for warpCylinder layers (--cylinder fit.json, from scripts/cylinder.py), or None.
CYLINDER: dict[str, Any] | None = None


def _bezier_basis(t: np.ndarray) -> np.ndarray:
    mt = 1.0 - t
    return np.stack([mt**3, 3 * mt * mt * t, 3 * mt * t * t, t**3], axis=-1)


def warp_into_quad(
    art: np.ndarray,
    s: SmartLayer,
    canvas: tuple[int, int],
    margin: int,
) -> tuple[np.ndarray, tuple[int, int, int, int]]:
    """Premultiplied RGBA of the art placed on canvas, cropped to its bbox."""
    W, H = s.size
    if s.warp_style == "warpCylinder" and CYLINDER is not None:
        # Fitted cylinder (scripts/cylinder.py) over this layer's own placement box.
        from cylinder import wrap

        qx, qy = s.quad[:, 0], s.quad[:, 1]
        box = (float(qx.min()), float(qy.min()), float(qx.max()), float(qy.max()))
        x0, y0 = int(math.floor(box[0])) - margin, int(math.floor(box[1])) - margin
        x1, y1 = int(math.ceil(box[2])) + margin, int(math.ceil(box[3])) + margin
        prem = art.copy()
        prem[..., :3] *= prem[..., 3:4]
        c = CYLINDER
        out = wrap(prem, box, (x0, y0), (y1 - y0, x1 - x0), c["f"], c["bow"], c.get("du", 0.0), c.get("k", 1.0), c.get("dv", 0.0))
        return out.astype(np.float32), (x0, y0, x1, y1)
    # Without a warp the placement quad is the content rectangle's image. With
    # a custom warp it is the image of the mesh control points' bounding box,
    # which can be larger than the content.
    if s.mesh is not None:
        mx0, my0 = s.mesh[..., 0].min(), s.mesh[..., 1].min()
        mx1, my1 = s.mesh[..., 0].max(), s.mesh[..., 1].max()
        src_rect = np.float32([[mx0, my0], [mx1, my0], [mx1, my1], [mx0, my1]])
    else:
        src_rect = np.float32([[0, 0], [W, 0], [W, H], [0, H]])
    H_mat = cv2.getPerspectiveTransform(src_rect, s.quad.astype(np.float32))

    if s.mesh is not None:
        # Bezier mesh in content space, then the placement transform.
        l, t, r, b = s.warp_bounds or (0, 0, W, H)
        u = np.linspace(0, 1, 129)
        Bu = _bezier_basis(u)
        P = np.einsum("ui,vj,jik->vuk", Bu, Bu, s.mesh)  # rows v, cols u
        pts = cv2.perspectiveTransform(P.reshape(-1, 1, 2).astype(np.float64), H_mat).reshape(P.shape)
        xs, ys = pts[..., 0], pts[..., 1]
    else:
        xs, ys = s.quad[:, 0], s.quad[:, 1]

    cw, chh = canvas
    x0 = max(int(math.floor(xs.min())) - margin, -margin)
    y0 = max(int(math.floor(ys.min())) - margin, -margin)
    x1 = min(int(math.ceil(xs.max())) + margin, cw + margin)
    y1 = min(int(math.ceil(ys.max())) + margin, chh + margin)
    if x1 <= x0 or y1 <= y0:
        return np.zeros((1, 1, 4), np.float32), (0, 0, 1, 1)
    ow, oh = x1 - x0, y1 - y0

    prem = art.copy()
    prem[..., :3] *= prem[..., 3:4]

    if s.mesh is None:
        # Pre-shrink so warpPerspective does not alias when the quad is smaller
        # than the content.
        q = s.quad
        sx = max(np.linalg.norm(q[1] - q[0]), np.linalg.norm(q[2] - q[3])) / W
        sy = max(np.linalg.norm(q[3] - q[0]), np.linalg.norm(q[2] - q[1])) / H
        src = prem
        if sx < 0.9 or sy < 0.9:
            nw, nh = max(2, round(W * min(sx * 1.25, 1))), max(2, round(H * min(sy * 1.25, 1)))
            src = cv2.resize(prem, (nw, nh), interpolation=cv2.INTER_AREA)
        sw, sh = src.shape[1], src.shape[0]
        M = cv2.getPerspectiveTransform(
            np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]]),
            (s.quad - [x0, y0]).astype(np.float32),
        )
        out = cv2.warpPerspective(
            src, M, (ow, oh), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0)
        )
    else:
        # Inverse-map with a dense remap: rasterise the forward mesh into
        # (u, v) lookup tables by drawing each mesh cell as two triangles.
        n = xs.shape[0]
        mapx = np.full((oh, ow), -1.0, np.float32)
        mapy = np.full((oh, ow), -1.0, np.float32)
        l, t, r, b = s.warp_bounds or (0, 0, W, H)
        # Mesh points are in content space relative to bounds; u,v -> content px.
        cu = np.linspace(l, r, n, dtype=np.float32)
        cv = np.linspace(t, b, n, dtype=np.float32)
        X = xs - x0
        Y = ys - y0
        for j in range(n - 1):
            for i in range(n - 1):
                quad_dst = np.float32([[X[j, i], Y[j, i]], [X[j, i + 1], Y[j, i + 1]], [X[j + 1, i + 1], Y[j + 1, i + 1]], [X[j + 1, i], Y[j + 1, i]]])
                quad_src = np.float32([[cu[i], cv[j]], [cu[i + 1], cv[j]], [cu[i + 1], cv[j + 1]], [cu[i], cv[j + 1]]])
                bx0, by0 = np.floor(quad_dst.min(0)).astype(int)
                bx1, by1 = np.ceil(quad_dst.max(0)).astype(int) + 1
                bx0, by0 = max(bx0, 0), max(by0, 0)
                bx1, by1 = min(bx1, ow), min(by1, oh)
                if bx1 <= bx0 or by1 <= by0:
                    continue
                Minv = cv2.getPerspectiveTransform(quad_dst, quad_src)
                gx, gy = np.meshgrid(np.arange(bx0, bx1, dtype=np.float32) + 0.5, np.arange(by0, by1, dtype=np.float32) + 0.5)
                pts = cv2.perspectiveTransform(np.stack([gx, gy], -1).reshape(-1, 1, 2), Minv).reshape(gy.shape + (2,))
                inside = cv2.fillConvexPoly(np.zeros((by1 - by0, bx1 - bx0), np.uint8), np.round(quad_dst - [bx0, by0]).astype(np.int32), 1).astype(bool)
                sub_x = mapx[by0:by1, bx0:bx1]
                sub_y = mapy[by0:by1, bx0:bx1]
                sub_x[inside] = pts[..., 0][inside] - 0.5
                sub_y[inside] = pts[..., 1][inside] - 0.5
        out = cv2.remap(prem, mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

    return out.astype(np.float32), (x0, y0, x1, y1)


def apply_smart_filters(prem: np.ndarray, s: SmartLayer, unsupported: list[str], psd_dir: Path, origin: tuple[int, int], canvas: tuple[int, int]) -> np.ndarray:
    if not s.filters_enabled:
        return prem
    for f in s.filters:
        if not f["enabled"]:
            continue
        if f["name"] == "Displace":
            p = f["params"] or {}
            dmap = load_displacement_map(f, psd_dir)
            if dmap is None:
                unsupported.append(f"{s.name}: Displace map not found next to the PSD, filter skipped")
                continue
            if p.get("DspM", "StrF") != "StrF" or p.get("UndA", "RptE") != "RptE":
                unsupported.append(f"{s.name}: Displace mode {p.get('DspM')}/{p.get('UndA')} approximated as stretch/repeat-edge")
            prem = displace(prem, origin, canvas, dmap, float(p.get("HrzS", 0)), float(p.get("VrtS", 0)))
        elif f["name"] == "Gaussian Blur":
            p = f["params"] or {}
            radius = float(p.get("Rds", p.get("Rds ", 0.0)) or 0.0)
            if radius > 0:
                # Photoshop's Gaussian Blur "radius" behaves close to sigma.
                prem = gaussian(prem, radius)
            opct = float((f.get("blend") or {}).get("Opct", 100.0))
            if opct < 100:
                unsupported.append(f"{s.name}: Gaussian Blur at {opct}% filter opacity treated as 100%")
        else:
            unsupported.append(f"{s.name}: smart filter '{f['name']}' not reproduced")
    return prem


def gaussian(img: np.ndarray, sigma: float) -> np.ndarray:
    """Gaussian blur with zero outside the layer; large sigmas run on a downscaled copy."""
    if sigma <= 12:
        return cv2.GaussianBlur(img, (0, 0), sigmaX=sigma, sigmaY=sigma, borderType=cv2.BORDER_CONSTANT)
    f = sigma / 6.0
    h, w = img.shape[:2]
    pad = int(math.ceil(3 * sigma))
    big = cv2.copyMakeBorder(img, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=(0, 0, 0, 0))
    sw, sh = max(1, round(big.shape[1] / f)), max(1, round(big.shape[0] / f))
    small = cv2.resize(big, (sw, sh), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), sigmaX=6.0, sigmaY=6.0, borderType=cv2.BORDER_CONSTANT)
    up = cv2.resize(small, (big.shape[1], big.shape[0]), interpolation=cv2.INTER_LINEAR)
    return up[pad : pad + h, pad : pad + w]


def load_displacement_map(f: dict[str, Any], psd_dir: Path) -> np.ndarray | None:
    """The Displace filter's map, found by file name next to the PSD (never outside it)."""
    raw = str((f.get("params") or {}).get("DspF", ""))
    names = set(re.findall(r"[\w\- .]+\.(?:psd|psb|png|jpg|tiff?)", raw, flags=re.I))
    if not names:
        # Some mockups ship the filter unlinked and tell Photoshop users to pick the map by hand
        # (e.g. Mockups-Design's About_Displacement.txt); take the one disp* file beside the PSD.
        lone = [p for p in psd_dir.iterdir() if p.name.lower().startswith("disp") and p.suffix.lower() in (".psd", ".psb", ".png", ".jpg")]
        if len(lone) == 1:
            names = {lone[0].name}
    for n in sorted(names, key=len):
        cand = (psd_dir / Path(n.strip()).name).resolve()
        if cand.parent == psd_dir.resolve() and cand.is_file():
            if cand.suffix.lower() in (".psd", ".psb"):
                im = PSDImage.open(cand).composite()
            else:
                im = Image.open(cand)
            return np.asarray(im.convert("RGB"), np.float32) / 255.0
    return None


# Pixels of shift per 1% of Displace scale at full map contrast. Photoshop's
# documentation implies 1.28 (100% = 128 px); fitting the tote-bag mockup's
# stored smart-filter raster gives 1.5 (alpha L1 0.0215 vs 0.0406 at 1.28).
DISPLACE_PX_PER_PCT = 1.5


def displace(prem: np.ndarray, buf_origin: tuple[int, int], canvas: tuple[int, int], dmap: np.ndarray, hs: float, vs: float) -> np.ndarray:
    """Photoshop Distort > Displace with Stretch to Fit and Repeat Edge Pixels.

    The map is stretched over the document canvas (fits the stored raster far
    better than stretching it over the layer's bounds). Red drives horizontal,
    green vertical, mid-grey is no shift; each output pixel samples the source
    at (x + dx, y + dy).
    """
    x0, y0 = buf_origin
    cw, ch = canvas
    m = cv2.resize(dmap, (cw, ch), interpolation=cv2.INTER_LINEAR)
    bh, bw = prem.shape[:2]
    # Canvas window that overlaps the buffer.
    cx0, cy0 = max(x0, 0), max(y0, 0)
    cx1, cy1 = min(x0 + bw, cw), min(y0 + bh, ch)
    if cx1 <= cx0 or cy1 <= cy0:
        return prem
    mm = m[cy0:cy1, cx0:cx1]
    dx = ((mm[..., 0] - 0.5) * 2.0 * DISPLACE_PX_PER_PCT * hs).astype(np.float32)
    dy = ((mm[..., 1] - 0.5) * 2.0 * DISPLACE_PX_PER_PCT * vs).astype(np.float32)
    gx, gy = np.meshgrid(np.arange(cx0 - x0, cx1 - x0, dtype=np.float32), np.arange(cy0 - y0, cy1 - y0, dtype=np.float32))
    out = prem.copy()
    out[cy0 - y0 : cy1 - y0, cx0 - x0 : cx1 - x0] = cv2.remap(
        prem, gx + dx, gy + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE
    )
    return out


def filter_margin(s: SmartLayer) -> int:
    m = 2
    for f in s.filters:
        if f["enabled"] and f["name"] == "Displace":
            p = f["params"] or {}
            m = max(m, int(math.ceil(DISPLACE_PX_PER_PCT * max(float(p.get("HrzS", 0)), float(p.get("VrtS", 0))))) + 2)
        if f["enabled"] and f["name"] == "Gaussian Blur":
            p = f["params"] or {}
            m = max(m, int(math.ceil(3 * float(p.get("Rds", 0.0) or 0.0))) + 2)
    return m


# --------------------------------------------------------------------------
# Injection into psd-tools' compositor
# --------------------------------------------------------------------------


def convert_color(rgb: np.ndarray, mode: ColorMode) -> np.ndarray:
    if mode == ColorMode.RGB:
        return rgb
    if mode == ColorMode.GRAYSCALE:
        return (rgb @ np.float32([0.299, 0.587, 0.114]))[..., None]
    if mode == ColorMode.CMYK:
        k = 1.0 - rgb.max(axis=-1, keepdims=True)
        d = np.maximum(1.0 - k, 1e-6)
        cmy = (1.0 - rgb - k) / d
        # psd-tools stores CMYK inverted (0 = full ink).
        return 1.0 - np.concatenate([cmy, k], axis=-1)
    raise SystemExit(f"unsupported document colour mode {mode.name}")


def inject(s: SmartLayer, prem: np.ndarray, bbox: tuple[int, int, int, int], mode: ColorMode) -> None:
    alpha = prem[..., 3:4]
    color = np.divide(prem[..., :3], alpha, out=np.zeros_like(prem[..., :3]), where=alpha > 1e-6)
    color = np.clip(convert_color(np.clip(color, 0, 1), mode), 0, 1).astype(np.float32)
    alpha = np.clip(alpha, 0, 1).astype(np.float32)
    layer = s.layer
    original = layer.numpy

    def numpy(channel: str | None = None, real_mask: bool = True) -> np.ndarray | None:
        if channel == "color":
            return color
        if channel in ("shape", "alpha"):
            return alpha
        if channel is None:
            return np.concatenate([color, alpha], axis=-1)
        return original(channel, real_mask=real_mask)

    layer.numpy = numpy  # type: ignore[method-assign]
    rec = layer._record
    rec.left, rec.top, rec.right, rec.bottom = bbox
    layer._invalidate_bbox()


def placeholder_art(s: SmartLayer) -> np.ndarray:
    """The smart object's embedded content rendered at its native size."""
    data = s.layer.smart_object.data
    if data[:4] == b"8BPS":
        inner = PSDImage.open(io.BytesIO(data))
        im = inner.composite()
    else:
        im = Image.open(io.BytesIO(data))
    im = im.convert("RGBA")
    if im.size != s.size:
        im = im.resize(s.size, Image.LANCZOS)
    return np.asarray(im, np.float32) / 255.0


def audit(psd: PSDImage, replaced: set[int] = frozenset()) -> list[str]:
    """Layers whose look psd-tools cannot reproduce."""
    notes = []
    for l in psd.descendants():
        if not l.is_visible():
            continue
        if l.kind in ("brightnesscontrast", "levels", "curves", "exposure", "huesaturation", "invert", "posterize", "threshold"):
            if l.kind not in ADJUSTMENT_FUNC:
                notes.append(f"adjustment '{l.name}' ({l.kind}) skipped")
            continue
        if l.kind in (
            "colorbalance", "photofilter", "channelmixer", "gradientmap", "selectivecolor",
            "blackandwhite", "colorlookup", "vibrance",
        ):
            notes.append(f"adjustment '{l.name}' ({l.kind}) not supported by psd-tools, skipped")
        if l.kind == "type":
            notes.append(f"type layer '{l.name}' uses its stored raster, not re-rendered")
        if l.kind == "smartobject" and id(l) not in replaced:
            fx = (l.smart_object._config.data.get(b"filterFX") if l.smart_object._config else None)
            if fx is not None:
                names = [str(to_py(f).get("Nm", "")).replace("...", "") for f in fx.get(b"filterFXList", [])]
                notes.append(f"smart object '{l.name}' (not replaced) keeps its stored raster incl. smart filters {names}")
        for e in getattr(l, "effects", None) or []:
            if not getattr(e, "enabled", True):
                continue
            n = type(e).__name__
            if n in ("BevelEmboss", "Satin", "Bevel", "Emboss"):
                notes.append(f"layer '{l.name}' effect {n} not rendered by psd-tools")
    return notes


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------


def cmd_list(path: Path) -> None:
    psd = PSDImage.open(path)
    layers = smart_layers(psd)
    default = pick_targets(layers, None) if layers else []
    out = {
        "psd": str(path),
        "canvas": list(psd.size),
        "color_mode": psd.color_mode.name,
        "depth": psd.depth,
        "default_target": primary(default).name if default else None,
        "smart_objects": [s.to_json() for s in layers],
        "fidelity_notes": audit(psd),
    }
    print(json.dumps(out, indent=2))


def set_fill(psd: PSDImage, spec: str) -> None:
    """--fill "Layer name=#RRGGBB": recolour solid-colour fill layers (e.g. a mockup's background)."""
    from psd_tools.psd.descriptor import Double

    name, _, hexcol = spec.rpartition("=")
    if not name or len(hexcol.lstrip("#")) != 6:
        raise SystemExit(f"--fill: expected 'Layer name=#RRGGBB', got {spec!r}")
    rgb = [int(hexcol.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4)]
    hits = [l for l in psd.descendants() if l.name == name and l.kind == "solidcolorfill"]
    if not hits:
        raise SystemExit(f"--fill: no solid-colour fill layer named {name!r}")
    for l in hits:
        clr = l.tagged_blocks.get_data(b"SoCo")[b"Clr "]
        for key, v in zip((b"Rd  ", b"Grn ", b"Bl  "), rgb):
            clr[key] = Double(float(v))
        # psd-tools only draws the fill from that descriptor when the layer has no stored pixels;
        # a saved fill layer has them, so its colour channel is overridden as well.
        original = l.numpy

        def numpy(channel: str | None = None, real_mask: bool = True, _o=original, _l=l) -> np.ndarray | None:
            if channel in ("color", None):
                c = np.empty((_l.height, _l.width, 3), np.float32)
                c[...] = np.array(rgb, np.float32) / 255.0
                if channel is None:
                    a = _o("shape", real_mask=real_mask)
                    a = np.ones((_l.height, _l.width, 1), np.float32) if a is None else a
                    return np.concatenate([c, a], axis=-1)
                return c
            return _o(channel, real_mask=real_mask)

        l.numpy = numpy  # type: ignore[method-assign]


def render(psd_path: Path, art_path: Path | None, out: Path, layer: str | None, fit: str, selftest: bool, hide: list[str],
           fills: list[str] = (), blends: list[str] = (), slots: list[str] = (), ground: str = "#FFFFFF") -> None:
    psd = PSDImage.open(psd_path)
    layers = smart_layers(psd)
    unsupported: list[str] = []

    # --slot "group/path/name=art.png": that one layer gets its own art, even when it shares its
    # embedded content with others (a row of frames placed from one smart object)
    slot_art: list[tuple[SmartLayer, Path]] = []
    for spec in slots:
        name, _, art = spec.rpartition("=")
        hits = [s for s in layers if f"{s.path}/{s.name}".strip("/") == name] or [s for s in layers if s.name == name and s.layer.is_visible()]
        if len(hits) != 1:
            raise SystemExit(f"--slot: {name!r} matches {len(hits)} smart objects; use its group path from --list")
        slot_art.append((hits[0], Path(art)))

    targets = [] if slot_art and not art_path else pick_targets(layers, layer)
    base = None
    if targets and not selftest:
        assert art_path is not None
        base = load_art(art_path)

    for name in hide:
        hits = [l for l in psd.descendants() if l.name == name]
        if not hits:
            raise SystemExit(f"--hide: no layer named {name!r}")
        for l in hits:
            l.visible = False
    for spec in fills:
        set_fill(psd, spec)
    for spec in blends:
        # --blend "Layer=NORMAL": e.g. a background colour layer saved in Color mode, which only
        # tints the photo's backdrop; in Normal mode it replaces it
        from psd_tools.constants import BlendMode

        name, _, mode = spec.rpartition("=")
        hits = [l for l in psd.descendants() if l.name == name]
        if not hits or mode not in BlendMode.__members__:
            raise SystemExit(f"--blend: expected an existing 'Layer name=MODE' (e.g. NORMAL), got {spec!r}")
        for l in hits:
            l.blend_mode = BlendMode[mode]

    cache: dict[tuple[int, int], np.ndarray] = {}
    for s in targets:
        if s.size[0] <= 0 or s.size[1] <= 0:
            raise SystemExit(f"{s.name}: unknown content size")
        if s.size not in cache:
            cache[s.size] = placeholder_art(s) if selftest else fit_art(base, s.size, fit)
        art = cache[s.size]
        prem, bbox = warp_into_quad(art, s, psd.size, filter_margin(s))
        prem = apply_smart_filters(prem, s, unsupported, psd_path.parent, bbox[:2], psd.size)
        inject(s, prem, bbox, psd.color_mode)
    for s, art_file in slot_art:
        prem, bbox = warp_into_quad(fit_art(load_art(art_file), s.size, fit), s, psd.size, filter_margin(s))
        prem = apply_smart_filters(prem, s, unsupported, psd_path.parent, bbox[:2], psd.size)
        inject(s, prem, bbox, psd.color_mode)
    targets = targets + [s for s, _ in slot_art]

    color, _shape, alpha = psd_composite(psd, color=1.0, alpha=0.0)
    # Flatten onto white, as Photoshop's own preview does (or onto --ground, when the backdrop is hidden).
    rgb = color[..., :3] if color.shape[2] >= 3 else np.repeat(color, 3, axis=2)
    if psd.color_mode == ColorMode.CMYK:
        im = Image.fromarray((np.clip(color, 0, 1) * 255).round().astype(np.uint8), "CMYK").convert("RGB")
        rgb = np.asarray(im, np.float32) / 255.0
    a = alpha if alpha.ndim == 3 else alpha[..., None]
    g = np.array([int(ground.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4)], np.float32) / 255.0
    flat = rgb * a + g * (1.0 - a)
    img = Image.fromarray((np.clip(flat, 0, 1) * 255).round().astype(np.uint8), "RGB")
    out.parent.mkdir(parents=True, exist_ok=True)
    save_kw = {"quality": 92, "subsampling": 0} if out.suffix.lower() in (".jpg", ".jpeg") else {}
    img.save(out, **save_kw)

    report: dict[str, Any] = {
        "out": str(out),
        "targets": [{"name": s.name, "path": s.path, "size": list(s.size), "blend": s.layer.blend_mode.name} for s in targets],
        "hidden": hide,
        "notes": unsupported + audit(psd, {id(s.layer) for s in targets}),
    }
    if selftest:
        ref = psd.topil()
        ref_kind = "saved PSD preview (Photoshop's own composite)"
        if ref is None:
            # No merged image saved: compare with psd-tools compositing the
            # untouched layers, which checks the warp/filter path only.
            fresh = PSDImage.open(psd_path)
            for name in hide:
                for l in fresh.descendants():
                    if l.name == name:
                        l.visible = False
            c, _s, al = psd_composite(fresh, color=1.0, alpha=0.0)
            al = al if al.ndim == 3 else al[..., None]
            ref = Image.fromarray((np.clip(c[..., :3] * al + (1 - al), 0, 1) * 255).round().astype(np.uint8), "RGB")
            ref_kind = "psd-tools composite of the stored smart-object raster (no saved preview)"
        if ref is not None:
            ref_rgb = np.asarray(ref.convert("RGB"), np.float32)
            got = np.asarray(img, np.float32)
            d = np.abs(ref_rgb - got).max(axis=-1)
            # Hidden layers are in the saved preview; leave their area out.
            keep = np.ones(d.shape, bool)
            for l in psd.descendants():
                if l.name in hide:
                    x0, y0, x1, y1 = l.bbox
                    keep[max(y0, 0) : max(y1, 0), max(x0, 0) : max(x1, 0)] = False
            d = np.where(keep, d, 0.0)
            report["selftest"] = {
                "reference": ref_kind,
                "compared_pct_of_canvas": round(float(keep.mean() * 100), 1),
                "mean_abs_diff_0_255": round(float(d[keep].mean()), 3),
                "pct_pixels_diff_gt_16": round(float((d[keep] > 16).mean() * 100), 3),
                "pct_pixels_diff_gt_48": round(float((d[keep] > 48).mean() * 100), 3),
            }
            diff = Image.fromarray(np.clip(d * 4, 0, 255).astype(np.uint8), "L")
            diff.save(out.with_name(out.stem + ".diff.png"))
            ref.convert("RGB").save(out.with_name(out.stem + ".preview.jpg"), quality=90)
    print(json.dumps(report, indent=2))


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--list", type=Path, metavar="PSD", help="print smart-object layers as JSON")
    ap.add_argument("--psd", type=Path)
    ap.add_argument("--art", type=Path)
    ap.add_argument("--out", type=Path)
    ap.add_argument("--layer", help="smart-object layer name (or group/path/name); all instances of its content are replaced")
    ap.add_argument("--fit", choices=["cover", "contain", "stretch"], default="cover", help="when the art's aspect differs from the smart object (default cover)")
    ap.add_argument("--selftest", action="store_true", help="use the embedded placeholder as art and diff against the PSD preview")
    ap.add_argument("--hide", action="append", default=[], metavar="LAYER", help="hide a layer by name before compositing (repeatable), e.g. a promo layer")
    ap.add_argument("--fill", action="append", default=[], metavar="LAYER=#HEX", help="recolour a solid-colour fill layer (repeatable), e.g. 'Background color=#0E0D0D'")
    ap.add_argument("--ground", default="#FFFFFF", metavar="#HEX", help="colour under transparent areas, e.g. #0E0D0D with the backdrop layer hidden")
    ap.add_argument("--slot", action="append", default=[], metavar="LAYER=ART", help="give one smart-object layer (group/path/name) its own art (repeatable)")
    ap.add_argument("--blend", action="append", default=[], metavar="LAYER=MODE", help="set a layer's blend mode (repeatable), e.g. 'Background Color=NORMAL'")
    ap.add_argument("--cylinder", type=Path, metavar="FIT.json", help="fitted parameters for warpCylinder smart objects (scripts/cylinder.py)")
    ap.add_argument("-v", "--verbose", action="store_true")
    a = ap.parse_args()
    logging.basicConfig(level=logging.INFO if a.verbose else logging.WARNING, format="%(levelname)s %(name)s: %(message)s")
    if a.list:
        cmd_list(a.list)
        return
    if a.cylinder:
        global CYLINDER
        sys.path.insert(0, str(Path(__file__).parent))
        CYLINDER = json.loads(a.cylinder.read_text())
    if not a.psd or not a.out or not (a.art or a.selftest or a.slot):
        ap.error("--psd, --out and one of --art/--slot/--selftest are required (or use --list)")
    render(a.psd, a.art, a.out, a.layer, a.fit, a.selftest, a.hide, a.fill, a.blend, a.slot, a.ground)


if __name__ == "__main__":
    main()
