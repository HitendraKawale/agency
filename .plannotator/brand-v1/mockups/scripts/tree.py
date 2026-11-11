"""Print a PSD's layer tree: name, kind, visibility, blend mode, and fill colour where there is one.

    .venv/bin/python scripts/tree.py <psd> [<psd> ...]
"""
import sys

from psd_tools import PSDImage


def fill(layer):
    """Solid-colour fill of a fill or shape layer, as hex, or ''."""
    try:
        d = layer.tagged_blocks.get_data(b"SoCo")
        c = d[b"Clr "]
        return "#%02X%02X%02X" % (round(c[b"Rd  "]), round(c[b"Grn "]), round(c[b"Bl  "]))
    except Exception:
        return ""


def walk(group, depth=0):
    for l in group:
        bits = [repr(l.name), f"[{l.kind}]", "" if l.visible else "hidden", str(l.blend_mode).split(".")[-1]]
        if l.kind == "smartobject":
            bits.append(f"SO {l.smart_object.filename!r}")
        if f := fill(l):
            bits.append(f"fill {f}")
        if l.clipping_layer:
            bits.append("clipped")
        print("  " * depth + "- " + " ".join(b for b in bits if b))
        if l.is_group():
            walk(l, depth + 1)


for path in sys.argv[1:]:
    psd = PSDImage.open(path)
    print("==", path.split("/")[-1], psd.size)
    walk(psd)
