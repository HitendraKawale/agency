"""Blank as one band, connected the way Rerun's `rerun` is (reference/rerun/mark/wordmark-trim.png).

    /tmp/blankword/.venv/bin/python band.py > blank-band.js

What Rerun does: every letter is full height, so the word is one band with a flat top and bottom
edge. Letters touch and fuse; the only marks of a join are V notches in the top or bottom edge,
where a chamfered corner meets the neighbour's square stem, finished with a short round-ended
hairline. So here all five letters are full height (240):
  B  BI's B, unchanged            l  BI's I, unchanged
  a  B with its upper counter opened to the left: octagon, top bar 40, slot 65 (B's counter
     height) running out of the left side, lower counter = B's lower counter mirrored
  n  stem + top bar 40 + arch of B's counter width (65), chamfer top-right, BI slit
  k  stem + 45 degree arms meeting at the waist (120), round inside corners, blunt tips
"""

import json

from shapely import affinity
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import unary_union
from svgelements import Close, Line, Move, Path

H, S, T, MID, C, IC = 240, 62, 40, 30, 40, 22
CH, R0 = 65, 32.5
HW, D = 6.5, 19  # join hairline width and depth past the notch


def chamfered(x0, y0, x1, y1, tl=0, tr=0, br=0, bl=0):
    return Polygon([(x0, y0 + tl), (x0 + tl, y0), (x1 - tr, y0), (x1, y0 + tr), (x1, y1 - br), (x1 - br, y1),
                    (x0 + bl, y1), (x0, y1 - bl)])


def slit(cx, y0=0, w=20, depth=19):
    return box(cx - w / 2, y0 - 1, cx + w / 2, y0 + depth - w / 2).union(Point(cx, y0 + depth - w / 2).buffer(w / 2, 32))


def from_svg(d):
    g = Polygon()
    for sub in Path(d).as_subpaths():
        pts = []
        for seg in Path(sub):
            if isinstance(seg, (Line, Close, Move)):
                if seg.end is not None:
                    pts.append((seg.end.x, seg.end.y))
            else:
                pts += [(q.x, q.y) for q in (seg.point(i / 32) for i in range(1, 33))]
        g = g.symmetric_difference(Polygon(pts).buffer(0))
    return g


def letter_a(aw=189, wall=52):
    xs = aw - S
    # top-left square: the top bar meets the l flat, and the l's own corner makes the notch
    g = chamfered(0, 0, aw, H, tl=0, tr=C, br=C, bl=C)
    top, yb = T, T + CH  # slot from B's top bar to B's mid bar
    gap = yb - top
    g = g.difference(box(-1, top, xs - gap / 2, yb).union(Point(xs - gap / 2, top + gap / 2).buffer(gap / 2, 48)))
    # the bowl keeps its own top-left chamfer under the slot, like B's lower bowl
    g = g.difference(Polygon([(-1, yb - 1), (C, yb - 1), (0, yb + C), (-1, yb + C)]))
    y0, cx = yb + MID, wall + R0
    return g.difference(box(cx, y0, xs, y0 + CH).union(Point(cx, y0 + R0).buffer(R0, 48))), aw


def letter_n(cw=65):
    nw = 2 * S + cw
    r = cw / 2
    g = chamfered(0, 0, nw, H, tr=C, br=IC)
    g = g.difference(box(S, T + r, nw - S, H + 1).union(Point(S + r, T + r).buffer(r, 48)))
    return g.difference(slit(S + 12)), nw


def letter_k(aw=80, v=40, kw=205, rv=16):
    u, ym, h2 = aw - v, H / 2, H / 2
    stem = Polygon([(0, 0), (S, 0), (S, H), (0, H)])
    up = Polygon([(S - 1, ym - u), (S + h2 - u, 0), (S + h2 + v, 0), (S + v, ym), (S - 1, ym)])
    lo = Polygon([(S - 1, ym + u), (S + h2 - u, H), (S + h2 + v, H), (S + v, ym), (S - 1, ym)])
    g = stem.union(up).union(lo).buffer(0)
    g = g.buffer(rv, join_style="round", quad_segs=32).buffer(-rv, join_style="round", quad_segs=32)
    g = g.intersection(box(0, 0, 10_000, H)).union(stem)
    return g.intersection(box(0, 0, kw, H)), kw


def tick(x, y_from, y_to):
    back = -HW if y_to > y_from else HW
    return LineString([(x, y_from + back), (x, y_to)]).buffer(HW / 2, cap_style="round", quad_segs=24)


def contacts(left, right, x, step=0.25):
    out, start, y = [], None, 0.0
    while y <= H:
        both = left.contains(Point(x - 0.6, y)) and right.contains(Point(x + 0.6, y))
        if both and start is None:
            start = y
        if not both and start is not None:
            out.append((start, y - step))
            start = None
        y += step
    if start is not None:
        out.append((start, H))
    return out


def build(gap=0.0, ticks=True):
    bi = json.load(open("letters.json"))
    parts = [(from_svg(bi[0]["d"]), bi[0]["w"]), (from_svg(bi[1]["d"]), bi[1]["w"]), letter_a(), letter_n(), letter_k()]
    shapes, xs, x = [], [], 0.0
    for g, w in parts:
        shapes.append(affinity.translate(g, x, 0))
        x += w
        xs.append(x)
        x += gap
    width = x - gap
    word, cuts, joins = unary_union(shapes), [], []
    if gap == 0 and ticks:
        # Rerun only marks a join where it reaches the outer edge: a V notch open to the top or the
        # bottom of the band gets a hairline continuing from its tip. Joins next to counters,
        # slots or the B's waist stay fused, with no seam in the middle of the band.
        for i in range(len(parts) - 1):
            x0 = xs[i]
            cs = contacts(shapes[i], shapes[i + 1], x0)
            joins.append((round(x0, 1), cs))
            if not cs:
                continue
            y0, y1 = cs[0][0], cs[-1][1]
            # which side the V opens on; the hairline runs flush with the neighbour's square edge
            for yt, ye, sign in ((y0, 0, 1), (y1, H, -1)):
                if abs(yt - ye) < 0.5:
                    continue
                ym = (yt + ye) / 2
                for side in (-1, 1):
                    if not word.contains(Point(x0 + side * 1.0, ym)):
                        cuts.append(tick(x0 + side * HW / 2, yt, yt + sign * D))
                        break
    if cuts:
        word = word.difference(unary_union(cuts))
    word = word.intersection(box(0, 0, width, H))
    return word, width, joins


def path(g):
    polys = list(g.geoms) if g.geom_type == "MultiPolygon" else [g]
    ring = lambda c: "M" + "L".join(f"{px:.2f} {py:.2f}" for px, py in list(c.coords)[:-1]) + "Z"
    return " ".join(ring(p.exterior) + "".join(ring(h) for h in p.interiors) for p in polys)


out = {}
for name, kw in {"band": dict(gap=0), "spaced": dict(gap=24)}.items():
    g, w, joins = build(**kw)
    out[name] = {"width": round(w, 2), "height": H, "path": path(g)}
    if joins:
        print(f"// joins (x, y0, y1): {joins}")
print("// generated by band.py, do not edit")
print(f"const BAND = {json.dumps(out)};")
