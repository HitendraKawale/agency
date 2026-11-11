"""Build self-contained Doop frames whose artwork is the live heat shader, not a screenshot.

    python3 build.py   -> heat-live.js, stage.html, site.html, poster-noir.html, poster-sand.html

heat-live.js is ../heat.html's module script wrapped as mountHeat(canvas, cfg): same shaders,
ramp and timing, sized to its canvas instead of the window. Every <canvas data-heat='{...}'>
in a page is mounted. Models load from public URLs because a Doop frame cannot reach this
machine: the car from jsDelivr (the same file as ../../f1/model/car-hi.glb, checksum checked),
the hands from Doop as a PNG-packed GLB (pack.py), which heat-live.js unpacks.

Car framing ("car") is the original heatcar camera, kept exact; other subjects use "orbit".
"""

import json
import re

HERE = "/Users/blank/Desktop/CREATE/blank-agency/.plannotator/brand-v1"
CAR = "https://cdn.jsdelivr.net/gh/Ron2509/Ron2509.github.io@2f444d30fe0ad2fd3ea1fa46c1e8a52346ad7198/public/models/car-hi.glb"
ADAM = "https://doop.design/a/sbd_9eVThb.png"
STAGE_PHOTO = "https://doop.design/a/p7vgce-wDK.jpg"
CREDITS = """<!-- Heat artwork: live WebGL, after Studio Gruhl's Rerun gear film.
  Car: "Aston Martin F1 AMR23 2023" by Redgrund, CC BY 4.0, sketchfab.com/3d-models/f6ba825a43b146a9b669934a4e1fd529
  Hands: "The Creation of Adam" by Loic Norgeot, CC BY 4.0, sketchfab.com/3d-models/4d1727c7b83e4e6284bbadb63dbb537e -->"""


def rep(s, a, b):
    assert a in s, a[:70]
    return s.replace(a, b)


# ---- heat-live.js from ../heat.html ------------------------------------------------------------
src = open(f"{HERE}/posters/heat.html").read()
body = src[src.index('<script type="module">') + len('<script type="module">'):src.rindex("</script>")]
imports = "\n".join(l for l in body.splitlines() if l.startswith("import "))
body = "\n".join(l for l in body.splitlines() if not l.startswith("import "))
body = body[body.index("// Every tuned number lives here."):]  # drop the URL and SUBJECTS block
body = rep(body, 'const canvas = document.getElementById("c");\n', "")
body = rep(body, "renderer.setPixelRatio(Math.min(devicePixelRatio, 2));",
           "renderer.setPixelRatio(S.dpr ?? Math.min(devicePixelRatio, 2));")
body = rep(body, """  const w = innerWidth, h = innerHeight;""", """  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;""")
body = rep(body, 'addEventListener("resize", resize);', "new ResizeObserver(resize).observe(canvas);")
body = rep(body, "loader.load(MODEL, (gltf) => {", "const onModel = (gltf) => {")
body = rep(body, """  // centre on the origin, longest side 5 units
  const box = new THREE.Box3().setFromObject(car);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  car.position.sub(c);
  const wrap = new THREE.Group(); wrap.add(car);
  wrap.scale.setScalar(5 / Math.max(size.x, size.y, size.z));
  pivot.add(wrap);""", """  const box = new THREE.Box3().setFromObject(car);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  car.position.sub(c);
  const wrap = new THREE.Group(); wrap.add(car);
  if (S.framing === "car") {
    // the original heatcar: 5 units long, nose along +x, wheels on the ground
    if (size.z > size.x) wrap.rotation.y = Math.PI / 2;
    const s = 5 / Math.max(size.x, size.z);
    wrap.scale.setScalar(s);
    wrap.position.y = (size.y * s) / 2;
  } else {
    // centre on the origin, longest side 5 units
    wrap.scale.setScalar(5 / Math.max(size.x, size.y, size.z));
  }
  pivot.add(wrap);""")
body = rep(body, """  window.__ready = true;
}, undefined, (e) => { console.error(e); document.title = "model failed"; });""", """  window.__heatReady = (window.__heatReady || 0) + 1;
};
const fail = (e) => { console.error(e); document.title = "model failed"; };
if (S.packed) unpackPng(S.model).then((buf) => loader.parse(buf, "", onModel, fail), fail);
else loader.load(S.model, onModel, undefined, fail);""")
body = rep(body, "  const t = FIXED_T ?? (performance.now() - start) / 1000;", "  const t = S.t ?? (performance.now() - start) / 1000;")
body = rep(body, """  const yaw = S.yaw + S.sway * sway;
  const dist = S.dist - 0.15 * Math.cos((2 * Math.PI * t) / P.orbit);
  camera.position.set(Math.sin(yaw) * Math.cos(S.pitch) * dist, Math.sin(S.pitch) * dist + S.lookY, Math.cos(yaw) * Math.cos(S.pitch) * dist);
  camera.lookAt(S.lookX, S.lookY, 0);""", """  if (S.framing === "car") {
    const yaw = 0.74 + 0.1 * sway;
    const dist = 4.5 - 0.15 * Math.cos((2 * Math.PI * t) / P.orbit);
    camera.position.set(Math.sin(yaw) * dist, 0.62, Math.cos(yaw) * dist);
    camera.lookAt(-0.3, 0.48, 0);
  } else {
    const yaw = S.yaw + S.sway * sway;
    const dist = S.dist - 0.15 * Math.cos((2 * Math.PI * t) / P.orbit);
    camera.position.set(Math.sin(yaw) * Math.cos(S.pitch) * dist, Math.sin(S.pitch) * dist + S.lookY, Math.cos(yaw) * Math.cos(S.pitch) * dist);
    camera.lookAt(S.lookX, S.lookY, 0);
  }""")
body = rep(body, """  if (qs.has("clay")) { renderer.setRenderTarget(null); renderer.setClearColor(0x222222, 1); renderer.clear(); renderer.render(scene, camera); return; }
""", "")
body = rep(body, "  requestAnimationFrame(frame);\n", "  requestAnimationFrame(frame);\n  if (!W || !H) return;\n")
assert "qs." not in body and "FIXED_T" not in body and "innerWidth" not in body, "leftover page globals"

live = f"""// generated by build.py from ../heat.html, do not edit
{imports}

// A GLB packed into an 8-bit grayscale PNG by pack.py: inflate the IDAT stream, drop each row's
// filter byte, trim to the length stored in the tEXt chunk.
async function unpackPng(url) {{
  const buf = new Uint8Array(await (await fetch(url)).arrayBuffer()), dv = new DataView(buf.buffer);
  let o = 8, W = 0, len = 0; const idat = [];
  while (o < buf.length) {{
    const n = dv.getUint32(o), type = String.fromCharCode(...buf.subarray(o + 4, o + 8)), d = buf.subarray(o + 8, o + 8 + n);
    if (type === "IHDR") W = dv.getUint32(o + 8);
    if (type === "tEXt") {{ const s = new TextDecoder().decode(d); if (s.startsWith("length\\0")) len = +s.slice(7); }}
    if (type === "IDAT") idat.push(d);
    o += 12 + n;
  }}
  const raw = new Uint8Array(await new Response(new Blob(idat).stream().pipeThrough(new DecompressionStream("deflate"))).arrayBuffer());
  const out = new Uint8Array(len);
  for (let y = 0, p = 0; p < len; y++, p += W) out.set(raw.subarray(y * (W + 1) + 1, y * (W + 1) + 1 + Math.min(W, len - p)), p);
  return out.buffer;
}}

// cfg: {{ model, packed?, framing: "car" | "orbit", yaw, pitch, dist, lookX, lookY, sway, fov, dpr?, t? }}
function mountHeat(canvas, S) {{
  S = {{ fov: 26, yaw: 0, pitch: 0, dist: 5, lookX: 0, lookY: 0, sway: 0.08, ...S }};
{body}
}}

for (const c of document.querySelectorAll("canvas[data-heat]")) mountHeat(c, JSON.parse(c.dataset.heat));
"""
open("heat-live.js", "w").write(live)

IMPORTMAP = """<script type="importmap">
{ "imports": {
  "three": "https://unpkg.com/three@0.170.0/build/three.module.js",
  "three/addons/": "https://unpkg.com/three@0.170.0/examples/jsm/"
} }
</script>"""
FONTS = """<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500&display=swap" rel="stylesheet">"""

# hosted copies of ../../mark/blank-rand.svg (noir) and blank-rand-white.svg, so frames stay small
MARK_W = '<img src="https://doop.design/a/NpaceZjAmY.svg" alt="Blank">'
MARK_N = '<img src="https://doop.design/a/ULr4Svh-v4.svg" alt="Blank">'


def heat(cfg, style=""):
    return f"<canvas data-heat='{json.dumps(cfg)}' style=\"{style}\"></canvas>"


def page(title, w, h, css, html):
    return f"""<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>
{FONTS}
{IMPORTMAP}
<style>
*{{margin:0;box-sizing:border-box}}
html,body{{width:{w}px;height:{h}px;overflow:hidden}}
canvas{{display:block}}
{css}
</style></head><body>
{CREDITS}
{html}
<script type="module">
{live}
</script></body></html>
"""


CARCFG = {"model": CAR, "framing": "car"}
ADAMCFG = {"model": ADAM, "packed": True, "framing": "orbit", "yaw": -1.57, "pitch": 0.05, "dist": 4.6}

# ---- stage: the PSD composite photo with the live screen laid over its screen ------------------
# screen measured in the 4500x3000 composite: x 1194..3306, y 656..1843 (flat, 16:9); frame is 0.32x
k = 1440 / 4500
sx, sy, sw, sh = 1194 * k, 656 * k, (3306 - 1194 + 1) * k, (1843 - 656 + 1) * k
stage_css = f"""body{{background:#000;font-family:"Inter Tight",sans-serif}}
.photo{{position:absolute;inset:0;width:1440px;height:960px;object-fit:cover}}
.screen{{position:absolute;left:{sx:.2f}px;top:{sy:.2f}px;width:{sw:.2f}px;height:{sh:.2f}px;overflow:hidden}}
.art{{position:absolute;left:0;top:0;width:1600px;height:900px;transform:scale({sw / 1600:.5f});transform-origin:0 0;background:#8caed2}}
.art canvas{{position:absolute;inset:0;width:100%;height:100%}}
.mark{{position:absolute;left:44px;top:40px;width:560px;fill:#fff}}
.mark img{{display:block;width:100%;height:auto}}
.meta{{position:absolute;bottom:40px;color:#fff;font:400 34px/1.08 "Inter Tight",sans-serif;letter-spacing:-.02em}}
.meta.l{{left:44px}}.meta.r{{right:44px}}"""
stage_html = f"""<img class="photo" src="{STAGE_PHOTO}" alt="Theatre stage with a large screen">
<div class="screen"><div class="art">
  {heat({**CARCFG, "dpr": 1})}
  <div class="mark">{MARK_W}</div>
  <div class="meta l">Aryan Kathawale<br>Design and engineering</div>
  <div class="meta r">21.11 18:00<br>Mumbai</div>
</div></div>"""
open("stage.html", "w").write(page("Stage screen", 1440, 960, stage_css, stage_html))

# ---- site: ../../mockups/art/site.html with the live car in the panel --------------------------
site = open(f"{HERE}/mockups/art/site.html").read()
site_css = site[site.index("<style>") + 7:site.index("</style>")]
site_css = re.sub(r"/\*.*?\*/", "", site_css, flags=re.S).strip()
site_css = rep(site_css, ".panel iframe{position:absolute;inset:-4% 0 0 0;width:100%;height:108%;border:0}",
               ".panel canvas{position:absolute;inset:-4% 0 0 0;width:100%;height:108%}")
site_html = site[site.index('<body><div class="page">') + 6:site.index("<script")]
site_html = rep(site_html, '<svg id="mark" fill-rule="evenodd"></svg>', MARK_W)
site_css = rep(site_css, "nav .mark svg{display:block;height:32px;width:auto;fill:var(--white)}", "nav .mark img{display:block;height:32px;width:auto}")
site_html = rep(site_html, '<iframe id="car" scrolling="no" title="Heat render of a Formula 1 car"></iframe>', heat(CARCFG))
open("site.html", "w").write(page("Website hero", 1600, 1427, "html,body{height:auto}\n" + site_css, site_html))

# ---- posters: ../poster.html with the live hands --------------------------------------------------
poster = open(f"{HERE}/posters/poster.html").read()
pcss = poster[poster.index("<style>") + 7:poster.index("</style>")]
pcss = re.sub(r"/\*.*?\*/", "", pcss, flags=re.S).strip()
pcss = rep(pcss, ".mark svg{display:block;width:100%;height:auto}", ".mark img{display:block;width:100%;height:auto}")
pcss = rep(pcss, ".panel iframe{position:absolute;inset:0;width:100%;height:100%;border:0}",
           ".panel canvas{position:absolute;inset:0;width:100%;height:100%}")
LINE = "Software made in God’s image."
for v in ("noir", "sand"):
    h1 = f"<h1>{LINE}</h1>"
    panel = f'<div class="panel">{heat(ADAMCFG)}</div>'
    mark = f'<div class="mark">{MARK_W if v == "noir" else MARK_N}</div>'
    inner = h1 + panel + mark if v == "noir" else panel + h1 + mark
    open(f"poster-{v}.html", "w").write(page(f"Poster, {v}", 1131, 1600, pcss, f'<div class="poster {v}">{inner}</div>'))

print("ok", {f: len(open(f).read()) for f in ("heat-live.js", "stage.html", "site.html", "poster-noir.html", "poster-sand.html")})
