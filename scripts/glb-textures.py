#!/usr/bin/env python3
"""Shrink the WebP textures inside a GLB: each image is resized to at most MAX px and re-encoded at
QUALITY with ImageMagick; mesh data (meshopt-compressed or not) is copied byte for byte.

    python3 scripts/glb-textures.py in.glb out.glb [MAX=512] [QUALITY=80]

Used for public/services/room/{boy,mac}.glb: the boy is ~150px tall on screen, in the dark, so
1024px textures were 1 MB of detail nobody sees. (gltfpack's npm build can't encode WebP.)
"""
import json, struct, subprocess, sys, tempfile, os

src, dst = sys.argv[1], sys.argv[2]
MAX = int(sys.argv[3]) if len(sys.argv) > 3 else 512
QUALITY = int(sys.argv[4]) if len(sys.argv) > 4 else 80

b = open(src, "rb").read()
jlen = struct.unpack("<I", b[12:16])[0]
gltf = json.loads(b[20:20 + jlen])
blen = struct.unpack("<I", b[20 + jlen:24 + jlen])[0]
bin0 = b[28 + jlen:28 + jlen + blen]

def shrink(data):
    with tempfile.TemporaryDirectory() as d:
        i, o = os.path.join(d, "i.webp"), os.path.join(d, "o.webp")
        open(i, "wb").write(data)
        subprocess.run(["magick", i, "-resize", f"{MAX}x{MAX}>", "-quality", str(QUALITY), "-define", "webp:method=6", o], check=True)
        return open(o, "rb").read()

# every region of buffer 0: plain buffer views, and the compressed data meshopt views point at
regions = []
for bv in gltf["bufferViews"]:
    if bv.get("buffer") == 0:
        regions.append(bv)
    ext = bv.get("extensions", {}).get("EXT_meshopt_compression")
    if ext and ext.get("buffer") == 0:
        regions.append(ext)
images = {img["bufferView"] for img in gltf.get("images", []) if "bufferView" in img}
image_views = {id(gltf["bufferViews"][i]) for i in images}

out = bytearray()
for r in sorted(regions, key=lambda r: r.get("byteOffset", 0)):
    data = bin0[r.get("byteOffset", 0):r.get("byteOffset", 0) + r["byteLength"]]
    if id(r) in image_views:
        data = shrink(data)
    while len(out) % 16:
        out.append(0)
    r["byteOffset"], r["byteLength"] = len(out), len(data)
    out += data
while len(out) % 4:
    out.append(0)
gltf["buffers"][0]["byteLength"] = len(out)

j = json.dumps(gltf, separators=(",", ":")).encode()
j += b" " * (-len(j) % 4)
glb = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(j) + 8 + len(out))
glb += struct.pack("<II", len(j), 0x4E4F534A) + j + struct.pack("<II", len(out), 0x004E4942) + out
open(dst, "wb").write(glb)
print(f"{src}: {len(b) // 1024}KB -> {len(glb) // 1024}KB")
