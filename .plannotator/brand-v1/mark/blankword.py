"""BLANK wordmark, built the way Rerun's `rerun` is built (reference/rerun/mark/wordmark-trim.png).

    /tmp/blankword/.venv/bin/python blankword.py > blank-word.js

Rules read off Rerun's wordmark:
- The letters touch. The word is one slab. Where two strokes meet, the join is marked by a
  "tick": a hairline cut with a round end, plus a 45 degree chamfer rising to the edge.
- A chamfered corner that runs into a neighbour's square stem leaves a V notch, and the hairline
  continues a little past the end of the chamfer.
- Stems are square at the top and bottom. Round letters get chamfers on both sides, counters are
  round, and the middle of `un` (two stems side by side) fuses into one wide bar.

The units match bi.js: cap height 240, stem 62, bar 40, mid bar 30, chamfer 40. y points down.
"""

import json
import math

from shapely import affinity
from shapely.geometry import LineString, Point, Polygon, box
from shapely.ops import unary_union

H, S, T, MID, C = 240, 62, 40, 30, 40
WY = H / 2
HW = 6.5  # hairline width (Rerun: 14 px at 515 cap height)
D = 19  # tick depth and tick chamfer (Rerun: ~40 px at 515)
EXTRA = 9  # how far a junction hairline runs past the end of a chamfer
CH = (H - 2 * T - MID) / 2  # counter height shared by B and A


def arc(cx, cy, r, a0, a1, n=48):
    return [(cx + r * math.cos(a0 + (a1 - a0) * i / n), cy + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]


def hairline(x, y0, y1):
    """Vertical hairline from y0 (an edge) to y1, round at the y1 end, square at the edge."""
    ext = -HW if y1 > y0 else HW  # run past the edge so the cut is clean
    return LineString([(x, y1), (x, y0 + ext)]).buffer(HW / 2, cap_style="round").union(
        box(x - HW / 2, min(y0 + ext, y0), x + HW / 2, max(y0 + ext, y0))
    )


def tick(x, edge, side=1):
    """Rerun's tick: hairline of depth D plus a 45 degree chamfer of size D on one side."""
    y0, y1 = (0, D) if edge == "top" else (H, H - D)
    tri = Polygon([(x, y0), (x + side * D, y0), (x, y1)])
    return hairline(x, y0, y1).union(tri)


def junction(x, edge, depth):
    """Hairline at a junction where a neighbour's chamfer meets a square stem."""
    y0 = 0 if edge == "top" else H
    return hairline(x, y0, depth if edge == "top" else H - depth)


solids, cuts = [], []
x = 0.0

# B: the BI B. Square stem, chamfered bowls on the right, waist notch, half-disc counters.
BW = 218
xr = BW - S + 10
solids.append(Polygon([(0, 0), (BW - C, 0), (BW, C), (BW, WY - C * 0.6), (BW - C * 0.9, WY), (BW, WY + C * 0.6),
                       (BW, H - C), (BW - C, H), (0, H)]))
for y0 in (T, T + CH + MID):
    r = CH / 2
    cuts.append(Polygon([(S, y0), *arc(xr - r, y0 + r, r, -math.pi / 2, math.pi / 2), (S, y0 + CH)]))
cuts.append(tick(S, "top"))  # stem meets the bowls; one tick, where BI has its slit
x = BW

# L: stem, foot, round inner corner. Its stem fuses with the B's right side; the B's chamfers
# leave V notches finished with a hairline.
LW, F, R = 170, 52, 26
xL = x
solids.append(box(xL, 0, xL + S, H))
solids.append(box(xL, H - F, xL + LW, H))
solids.append(box(xL + S, H - F - R, xL + S + R, H - F).difference(Point(xL + S + R, H - F - R).buffer(R, 128)))  # fillet
cuts += [junction(xL, "top", C + EXTRA), junction(xL, "bottom", C + EXTRA)]
x = xL + LW

# A: symmetric arch. Both top corners chamfered, round-topped counter on the B's mid bar, open legs.
AW = 218
xA = x
ya, yb = T + CH, T + CH + MID
solids.append(Polygon([(xA, C), (xA + C, 0), (xA + AW - C, 0), (xA + AW, C), (xA + AW, H), (xA + AW - S, H),
                       (xA + AW - S, yb), (xA + S, yb), (xA + S, H), (xA, H)]))
r = (AW - 2 * S) / 2
cuts.append(Polygon([(xA + S, ya), *arc(xA + AW / 2, T + r, r, math.pi, 2 * math.pi), (xA + AW - S, ya)]))
cuts.append(box(xA + S, yb, xA + AW - S, H + 1))
x = xA + AW

# N: point-symmetric. Chamfers on the free stem ends; the bottom-left one runs into the A's leg.
NW, DW, YR = 234, 42, 176
xN = x
solids.append(Polygon([(xN, 0), (xN + NW - C, 0), (xN + NW, C), (xN + NW, H), (xN + C, H), (xN, H - C)]))
k = (NW - 2 * S - DW) / YR
sw = 20
yt = (NW - 2 * S - DW - sw) / k
xt = xN + S + DW + k * yt
up = Polygon([(xN + S + DW, -1), (xN + NW - S, -1), (xN + NW - S, yt), (xt, yt)]).union(Point(xt + sw / 2, yt).buffer(sw / 2, 64))
cuts.append(up)
cuts.append(affinity.rotate(up, 180, origin=(xN + NW / 2, H / 2)))
cuts += [junction(xA + AW, "top", C + EXTRA), junction(xN, "bottom", C + EXTRA)]
x = xN + NW

# K: stem and two 45 degree arms meeting it at the waist. Its stem fuses with the N's right stem
# into one wide bar, like the middle of Rerun's `un`.
KW = 206
xK = x
v = KW - S - WY
u = 84 - v
solids.append(Polygon([(xK, 0), (xK + S, 0), (xK + S, WY - u), (xK + S + WY - u, 0), (xK + KW, 0), (xK + S + v, WY),
                       (xK + KW, H), (xK + S + WY - u, H), (xK + S, H - WY + u), (xK + S, H), (xK, H)]))
cuts += [junction(xK, "top", C + EXTRA), tick(xK, "bottom")]
W = xK + KW

word = unary_union(solids).difference(unary_union(cuts)).intersection(box(0, 0, W, H))


def ring(c):
    pts = list(c.coords)[:-1]
    return "M" + "L".join(f"{px:.2f} {py:.2f}" for px, py in pts) + "Z"


polys = list(word.geoms) if word.geom_type == "MultiPolygon" else [word]
d = " ".join(ring(p.exterior) + " ".join(ring(i) for i in p.interiors) for p in polys)
print("// generated by blankword.py, do not edit")
print(f"const BLANK = {json.dumps({'width': round(W, 2), 'height': H, 'path': d})};")
