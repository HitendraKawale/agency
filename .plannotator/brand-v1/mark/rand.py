"""Blank, redrawn a/n/k in the rules of BI's B and l (letters.json), after Paul Rand's ABC: few parts,
one geometry, the letters explain each other.

    /tmp/blankword/.venv/bin/python rand.py   -> rand-sheet.svg (candidates), rand.js (chosen)

Rules read from B and l:
  stem 62, square corners on the stem side; bowl corners chamfered 40, a lone stem 22
  walls 52, bars 40, counters with semicircle ends
  tick: 20 wide, 19 deep, round end, cut from the top edge where stem meets bowl
"""

import json

from shapely import affinity
from shapely.geometry import Point, Polygon, box
from shapely.ops import unary_union
from svgelements import Close, Line, Move, Path

H, S, T, C, IC, W = 240, 62, 40, 40, 22, 52


def chamfered(x0, y0, x1, y1, tl=0, tr=0, br=0, bl=0):
    return Polygon([(x0, y0 + tl), (x0 + tl, y0), (x1 - tr, y0), (x1, y0 + tr), (x1, y1 - br), (x1 - br, y1),
                    (x0 + bl, y1), (x0, y1 - bl)])


def tick(cx, top=True, w=20, depth=19):
    """BI's tick: a slot from the top (or bottom) edge with a round end."""
    g = box(cx - w / 2, -1, cx + w / 2, depth - w / 2).union(Point(cx, depth - w / 2).buffer(w / 2, 32))
    return g if top else affinity.scale(g, 1, -1, origin=(cx, H / 2))


def stadium(x0, y0, x1, y1, left=True, right=True, r=None):
    """Counter with semicircle ends (or corner radius r) on the chosen sides."""
    h = y1 - y0
    r = h / 2 if r is None else r
    g = box(x0 + (r if left else 0), y0, x1 - (r if right else 0), y1)
    if left:
        g = g.union(box(x0, y0 + r, x0 + r, y1 - r)).union(Point(x0 + r, y0 + r).buffer(r, 48)).union(
            Point(x0 + r, y1 - r).buffer(r, 48))
    if right:
        g = g.union(box(x1 - r, y0 + r, x1, y1 - r)).union(Point(x1 - r, y0 + r).buffer(r, 48)).union(
            Point(x1 - r, y1 - r).buffer(r, 48))
    return g.buffer(0).intersection(box(x0, y0, x1, y1))


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


# ---- a -----------------------------------------------------------------------------------------
def a_bowl(cw=100, r=None, ticks=("top",), open_top=False, chamfer=C):
    """B's logic mirrored: bowl on the left (chamfered corners), stem on the right (square).
    One big counter with a round left end where B has two small ones with round right ends."""
    aw = W + cw + S
    g = chamfered(0, 0, aw, H, tl=chamfer, bl=chamfer)
    g = g.difference(stadium(W, T, W + cw, H - T, left=True, right=False, r=r))
    xs = aw - S  # stem's inner edge
    for t in ticks:
        g = g.difference(tick(xs - 10, top=(t == "top")))
    if open_top:  # stencil: the bowl lets go of the stem at the top
        g = g.difference(box(xs - 20, -1, xs, T + 1))
    return g, aw


def a_low(cw=100, top=70):
    """Bowl sits low, heavier shoulder on top (the two-storey a's weight without the aperture)."""
    aw = W + cw + S
    g = chamfered(0, 0, aw, H, tl=C, bl=C)
    g = g.difference(stadium(W, top, W + cw, H - T, left=True, right=False))
    return g.difference(tick(aw - S - 10)), aw


# ---- n -----------------------------------------------------------------------------------------
def n_arch(cw=100, br=IC, r=None):
    """Stem left (square), arch on the right: chamfer 40 at the shoulder, 22 at the lone leg's foot,
    counter with a round top, open at the bottom, tick where stem meets arch (as in B)."""
    nw = S + cw + S
    r = cw / 2 if r is None else r
    g = chamfered(0, 0, nw, H, tr=C, br=br)
    cnt = box(S, T + r, S + cw, H + 1).union(stadium(S, T, S + cw, T + 2 * r + 1, r=r))
    return g.difference(cnt).difference(tick(S + 10)), nw


# ---- k -----------------------------------------------------------------------------------------
def k_arms(kw=200, arm=78, vx=None, slot=20, ticks=True):
    """Stem + two arms at 45 degrees. The arms leave the stem through a slot the width of BI's tick,
    round-ended, so the k's joins are the same mark as B's tick."""
    ym = H / 2
    stem = box(0, 0, S, H)
    # arm = parallelogram between two 45 degree lines, flat where it meets the top and bottom edges
    up = Polygon([(kw - arm, 0), (kw, 0), (kw - ym, ym), (kw - ym - arm, ym)])
    lo = affinity.scale(up, 1, -1, origin=(0, ym))
    g = unary_union([stem, up, lo, box(S - 1, ym - arm / 2 * 1.0, kw - ym, ym + arm / 2 * 1.0)])
    g = g.intersection(box(0, 0, kw, H))
    if ticks:
        # slot between stem and each arm, running down the stem's edge with a round end
        for top in (True, False):
            y_end = ym - arm * 0.62
            sl = box(S, -1, S + slot, y_end).union(Point(S + slot / 2, y_end).buffer(slot / 2, 32))
            if not top:
                sl = affinity.scale(sl, 1, -1, origin=(0, ym))
            g = g.difference(sl)
    return g, kw


def k_futura(kw=196, arm=74):
    """Upper arm meets the stem, the leg springs from the arm (Futura's k), slot only at the top."""
    ym = H / 2
    stem = box(0, 0, S, H)
    up = Polygon([(kw - arm, 0), (kw, 0), (S + 0, kw - S), (S, kw - S - arm)])
    leg_top = kw - S - arm / 2 - 30
    lo = Polygon([(S + 40, leg_top + 40), (S + 40 + arm, leg_top + 40 - 0), (kw, H - 0), (kw - arm, H)])
    g = unary_union([stem, up, lo]).intersection(box(0, 0, kw, H))
    return g, kw


# ---- set ---------------------------------------------------------------------------------------
def word(parts, gap=22):
    shapes, x = [], 0.0
    for g, w in parts:
        shapes.append(affinity.translate(g, x, 0))
        x += w + gap
    return unary_union(shapes), x - gap


def path(g):
    polys = list(g.geoms) if g.geom_type == "MultiPolygon" else [g]
    ring = lambda c: "M" + "L".join(f"{px:.2f} {py:.2f}" for px, py in list(c.coords)[:-1]) + "Z"
    return " ".join(ring(p.exterior) + "".join(ring(h) for h in p.interiors) for p in polys)


BI = json.load(open("letters.json"))
B, L = (from_svg(BI[0]["d"]), BI[0]["w"]), (from_svg(BI[1]["d"]), BI[1]["w"])

if __name__ == "__main__":
    import sys

    cands = {
        "A": [a_bowl(cw=100, r=80), n_arch(), k_arms()],
        "B": [a_bowl(cw=110, r=80), n_arch(cw=110), k_arms(kw=204)],
        "C": [a_bowl(cw=120, r=80), n_arch(cw=110), k_arms(kw=206)],
    }
    pick = sys.argv[1:] or list(cands)
    rows, y, wmax = [], 0, 0
    for name in pick:
        g, w = word([B, L] + cands[name])
        rows.append((name, g, w, y))
        y += H + 120
        wmax = max(wmax, w)
    pad = 80
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{-pad - 400} {-pad} {wmax + 2 * pad + 400} {y - 120 + 2 * pad}">',
           f'<rect x="{-pad - 400}" y="{-pad}" width="{wmax + 2 * pad + 400}" height="{y - 120 + 2 * pad}" fill="#F1EFEB"/>']
    for name, g, w, yy in rows:
        pass
        out.append(f'<path transform="translate(0 {yy})" fill="#0E0D0D" fill-rule="evenodd" d="{path(g)}"/>')
    out.append("</svg>")
    open("rand-sheet.svg", "w").write("\n".join(out))
    js = {n: {"width": round(w, 2), "height": H, "path": path(g)} for n, g, w, _ in rows}
    open("rand.js", "w").write("// generated by rand.py, do not edit\nconst RAND = " + json.dumps(js) + ";\n")
    print("ok", [(n, round(w)) for n, _, w, _ in rows])
