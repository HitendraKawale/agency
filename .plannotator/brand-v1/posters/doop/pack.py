"""Pack a binary file (a GLB) into a lossless 8-bit grayscale PNG so it can live on an image host.

    python3 pack.py ../model/adam.glb adam.glb.png

Layout: rows of 1024 bytes, filter 0 on every row, zero padding at the end; the true byte length
is in a tEXt chunk keyed "length". heat-live.js reverses it: IDAT -> inflate -> drop filter bytes.
"""
import struct, sys, zlib

src, dst = sys.argv[1], sys.argv[2]
data = open(src, "rb").read()
W = 1024
H = -(-len(data) // W)
raw = b"".join(b"\0" + data[y * W:(y + 1) * W].ljust(W, b"\0") for y in range(H))
chunk = lambda t, d: struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
png = (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 0, 0, 0, 0))
       + chunk(b"tEXt", b"length\0" + str(len(data)).encode()) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))
open(dst, "wb").write(png)
print(len(data), "bytes ->", len(png), "png bytes,", W, "x", H)
