"""Set a word from a variable font instance as one SVG path, for wordmark sketching.

    python3 glyphs.py <font.ttf> "<word>" wght=900,wdth=125 <tracking_em> > out.json

Prints {"d": path, "width": advance, "ascender", "xheight", "upm", "letters": [{ch, x, adv, d}]}.
y is flipped so the path draws top-down in SVG, baseline at y=0.
"""

import json
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


def main():
    path, word, axes, tracking = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
    loc = {k: float(v) for k, v in (kv.split("=") for kv in axes.split(","))}
    font = instantiateVariableFont(TTFont(path), loc)
    upm = font["head"].unitsPerEm
    cmap, gs, hmtx = font.getBestCmap(), font.getGlyphSet(), font["hmtx"]
    x, letters = 0.0, []
    for ch in word:
        name = cmap[ord(ch)]
        pen = SVGPathPen(gs)
        gs[name].draw(TransformPen(pen, (1, 0, 0, -1, 0, 0)))
        adv = hmtx[name][0]
        letters.append({"ch": ch, "x": round(x, 1), "adv": adv, "d": pen.getCommands()})
        x += adv + tracking * upm
    os2 = font["OS/2"]
    print(json.dumps({"upm": upm, "width": round(x - tracking * upm, 1), "ascender": os2.sTypoAscender,
                      "xheight": getattr(os2, "sxHeight", 0), "letters": letters}))


if __name__ == "__main__":
    main()
