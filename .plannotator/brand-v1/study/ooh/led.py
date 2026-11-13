"""Animate the screen inside Mockups-Design's LED billboard PSD (MD1116, mockup 2) without a full
psd-tools composite per frame (about 33 s each).

    ../../mockups/.venv/bin/python led.py calib              # 9 flat-grey renders through render.py
    ../../mockups/.venv/bin/python led.py frame <png> <out>  # one frame through the fitted model
    ../../mockups/.venv/bin/python led.py video <dir> <mp4>  # every f_*.png in dir
    ../../mockups/.venv/bin/python led.py chunk <dir> <out> <k> <n>  # every n-th frame from k (parallel)
    ../../mockups/.venv/bin/python led.py check <png>        # model vs a real render.py composite

Why this works: every layer above and below the smart object (Multiply screen, Overlay
reflections, the Screen highlights, the Curves, the Multiply noise) acts on each pixel and channel
on its own. So an output pixel is a fixed function g_p of one number: the smart object's colour
that reaches that pixel (the screen content, or the blurred content in a reflection). Rendering the
PSD with flat grey content at 9 levels samples g_p for every pixel; a frame is then the warped
content (render.py's own warp and smart filters) looked up through those curves, piecewise
linear. `check` measures the error against a real composite.
"""
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
MOCK = HERE.parent.parent / "mockups"
sys.path.insert(0, str(MOCK / "scripts"))
import render as R  # noqa: E402
from psd_tools import PSDImage  # noqa: E402

PSD = MOCK / "psd/led-billboard/MD1116_Led_Billboard_Mockup/LED_Billboard_Mockup_2.psd"
CAL = MOCK / "out/study-ooh/calib"
LEVELS = [0, 32, 64, 96, 128, 160, 192, 224, 255]
OUT_W, OUT_H = 2000, 1500  # half the PSD's 4000 x 3000; the model itself runs at full size
PY = str(MOCK / ".venv/bin/python")


def render_psd(art: Path, out: Path) -> None:
    subprocess.run([PY, str(MOCK / "scripts/render.py"), "--psd", str(PSD), "--art", str(art), "--out", str(out),
                    "--layer", "Design", "--hide", "Delete this layer"], check=True, capture_output=True)


def calib() -> None:
    CAL.mkdir(parents=True, exist_ok=True)

    def one(v: int) -> None:
        out = CAL / f"L{v:03d}.png"
        if out.exists():
            return
        art = CAL / f"flat{v:03d}.png"
        Image.new("RGB", (2640, 1308), (v, v, v)).save(art)
        render_psd(art, out)
        print("calib", v, flush=True)

    with ThreadPoolExecutor(3) as ex:
        list(ex.map(one, LEVELS))


class Model:
    def __init__(self) -> None:
        # full size: the curves are nonlinear, so they must apply before any downscale (text edges)
        self.G = np.stack([np.asarray(Image.open(CAL / f"L{v:03d}.png").convert("RGB"), np.float16) / 255 for v in LEVELS])
        self.psd = PSDImage.open(PSD)
        layers = R.smart_layers(self.psd)
        self.targets = [s for s in R.pick_targets(layers, "Design") if s.layer.is_visible()]
        # the screen itself (inside the "Design" group) wins over the reflections where they overlap
        self.targets.sort(key=lambda s: s.path.endswith("Design"))
        # the "Design" group's mask cuts the man out of the screen: there his sweater picks up the
        # floor reflection's blurred content instead, so the screen value only counts inside it
        g = next(l for l in self.psd.descendants() if l.kind == "group" and l.name == "Design")
        cw, ch = self.psd.size
        self.dmask = np.full((ch, cw), g.mask.background_color / 255, np.float32)
        x0, y0, x1, y1 = g.mask.bbox
        self.dmask[y0:y1, x0:x1] = np.asarray(g.mask.topil().convert("L"), np.float32) / 255

    def values(self, art: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        """Smart-object colour reaching each output pixel, and whether any instance covers it."""
        cw, ch = self.psd.size
        V = np.zeros((ch, cw, 3), np.float32)
        A = np.zeros((ch, cw), np.float32)
        for s in self.targets:  # reflections first, the screen last (overwrites)
            prem, (x0, y0, x1, y1) = R.warp_into_quad(R.fit_art(art, s.size, "cover"), s, (cw, ch), R.filter_margin(s))
            prem = R.apply_smart_filters(prem, s, [], PSD.parent, (x0, y0), (cw, ch))
            cx0, cy0, cx1, cy1 = max(x0, 0), max(y0, 0), min(x1, cw), min(y1, ch)
            sub = prem[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0]
            a = sub[..., 3]
            col = np.divide(sub[..., :3], a[..., None], out=np.zeros_like(sub[..., :3]), where=a[..., None] > 1e-4)
            take = a > 0.02
            if s.path.endswith("Design"):
                take &= self.dmask[cy0:cy1, cx0:cx1] > 0.5
            V[cy0:cy1, cx0:cx1][take] = np.clip(col[take], 0, 1)
            A[cy0:cy1, cx0:cx1] = np.maximum(A[cy0:cy1, cx0:cx1], a)
        return V, A

    def frame(self, art_png: Path) -> np.ndarray:
        art = R.load_art(art_png)
        V, _ = self.values(art)
        lv = np.asarray(LEVELS, np.float32) / 255
        i = np.clip(np.searchsorted(lv, V, side="right") - 1, 0, len(LEVELS) - 2)
        f = (V - lv[i]) / (lv[i + 1] - lv[i])
        hh, ww = np.indices(V.shape[:2])
        out = np.empty_like(V)
        for c in range(3):
            ic = i[..., c]
            g0 = self.G[ic, hh, ww, c].astype(np.float32)
            g1 = self.G[ic + 1, hh, ww, c].astype(np.float32)
            out[..., c] = g0 + (g1 - g0) * f[..., c]
        out = cv2.resize(out, (OUT_W, OUT_H), interpolation=cv2.INTER_AREA)
        return (np.clip(out, 0, 1) * 255).round().astype(np.uint8)


def main() -> None:
    cmd = sys.argv[1]
    if cmd == "calib":
        calib()
    elif cmd == "frame":
        Image.fromarray(Model().frame(Path(sys.argv[2]))).save(sys.argv[3], quality=93)
    elif cmd == "chunk":
        # led.py chunk <frames_dir> <out_dir> <k> <n>: every n-th frame from k, as PNGs (run n in parallel)
        src, dst, k, n = Path(sys.argv[2]), Path(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
        dst.mkdir(parents=True, exist_ok=True)
        m = Model()
        for p in sorted(src.glob("f_*.png"))[k::n]:
            Image.fromarray(m.frame(p)).save(dst / p.name)
        print("chunk", k, "done", flush=True)
    elif cmd == "video":
        src, out = Path(sys.argv[2]), sys.argv[3]
        m = Model()
        paths = sorted(src.glob("f_*.png"))
        ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OUT_W}x{OUT_H}",
                               "-r", "30", "-i", "-", "-vf", "scale=1920:1440:flags=lanczos", "-c:v", "libx264", "-crf", "16",
                               "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
        for k, p in enumerate(paths):
            ff.stdin.write(m.frame(p).tobytes())
            if k % 20 == 0:
                print(k, len(paths), flush=True)
        ff.stdin.close(); ff.wait()
        print(out)
    elif cmd == "check":
        art = Path(sys.argv[2])
        real = MOCK / "out/study-ooh/check-real.png"
        render_psd(art, real)
        a = cv2.resize(np.asarray(Image.open(real).convert("RGB"), np.float32), (OUT_W, OUT_H), interpolation=cv2.INTER_AREA)
        b = Model().frame(art).astype(np.float32)
        Image.fromarray(b.astype(np.uint8)).save(MOCK / "out/study-ooh/check-model.png")
        d = np.abs(a - b).max(-1)
        print(f"mean abs diff {d.mean():.3f} /255, p99 {np.percentile(d, 99):.1f}, max {d.max():.0f}, >8: {(d > 8).mean() * 100:.3f}%")
        Image.fromarray(np.clip(d * 8, 0, 255).astype(np.uint8)).save(MOCK / "out/study-ooh/check-diff.png")


if __name__ == "__main__":
    main()
