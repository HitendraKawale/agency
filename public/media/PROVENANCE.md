# Media provenance

Produced 2026-10-03. Scratch files and logs referenced below live in `/tmp/rv/media/` and are not kept in the repo.

## parflow-walkthrough.mp4

| | |
| --- | --- |
| Source | https://parflowengineering.com (live, HTTP 200 on 2026-10-03) |
| Dimensions | 1920x1080, 30 fps CFR, 789 frames |
| Duration | 26.300 s (ffprobe `format=duration`) |
| Codec | H.264 High@4.1, yuv420p, tv range, bt709, `+faststart` (atoms: ftyp, moov, free, mdat), no audio |
| Bytes | 6125317 |
| SHA-256 | `70314fb63da7f32a6cd02a89bacb211f8883fdb8d4b852a8016c1d5383083a61` |

Timeline:

| Time | Segment |
| --- | --- |
| 0.0 to 12.0 s | Home `/`. Hero holds 2.4 s, scroll 0 to 4900 px over 9.0 s, hold 0.6 s |
| 11.6 to 12.0 s | 0.4 s crossfade |
| 11.6 to 19.3 s | Catalogue `/products`. Hold 1.2 s, scroll 0 to 2900 px over 6.0 s, hold 0.5 s |
| 18.9 to 19.3 s | 0.4 s crossfade |
| 18.9 to 26.3 s | Product page `/products/valves/manifold-valves/5-valve-manifold-coplanar-type`. Hold 1.2 s, scroll 0 to 1900 px over 5.0 s, hold 1.2 s |

How it was made:

1. webreel 0.1.4 was tried first (`/tmp/rv/media/webreel.config.json`, video `scroll-probe`). `npx webreel validate` and `--dry-run` passed. `npx webreel record` produced a 0.13 s file with 4 frames from a 9 s script, because its recorder loops `Page.captureScreenshot` (JPEG q60) and only got 2 captures on this page. Its scroll step is a native `window.scrollBy({behavior: "smooth"})` followed by a fixed 500 ms pause, and it has no step that runs page JavaScript, so a slow eased scroll is not expressible. webreel was dropped.
2. Capture: Google Chrome 154 headless (`--headless=new --remote-debugging-port=9333 --window-size=1920,1080 --hide-scrollbars`, WebGL on ANGLE Metal, Apple M2), driven over CDP by `/tmp/rv/media/step-capture.mjs` with `Emulation.setDeviceMetricsOverride` 1920x1080 at DPR 1. Per page: navigate, wait for the preloader to drop `lenis-stopped`, force lazy images eager, wait for `document.fonts.ready` and every `<img>` complete, step through the page once so observer-driven media loads, wait until the resource count is unchanged for 1.5 s, scroll to 0, wait 1.5 to 2 s. Holds are captured in real time. The scroll is stepped one output frame at a time: `window.scrollTo(0, y)` on a sine-in, constant-cruise, sine-out curve (24 percent ramps), wait three `requestAnimationFrame`s so Lenis and ScrollTrigger settle, then `Page.captureScreenshot` JPEG q95. Every stepped frame landed on its target `scrollY` (0 mismatches). No cursor is drawn.
3. Assembly and encode:

```bash
CV="fps=30,scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709:flags=accurate_rnd+full_chroma_int,format=yuv420p"
ffmpeg -f concat -safe 0 -i home/list.txt -f concat -safe 0 -i products/list.txt -f concat -safe 0 -i pdp/list.txt \
 -filter_complex "[0:v]${CV},trim=end_frame=360,setpts=PTS-STARTPTS[a];[1:v]${CV},trim=end_frame=231,setpts=PTS-STARTPTS[b];[2:v]${CV},trim=end_frame=222,setpts=PTS-STARTPTS[c];[a][b]xfade=transition=fade:duration=0.4:offset=11.6[ab];[ab][c]xfade=transition=fade:duration=0.4:offset=18.9,format=yuv420p[v]" \
 -map "[v]" -an -c:v libx264 -preset veryslow -crf 20 -profile:v high -level:v 4.1 -pix_fmt yuv420p \
 -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -g 60 -movflags +faststart -r 30 parflow-walkthrough.mp4
```

## parflow-walkthrough.jpg

Poster, frame 0 of the mp4 (hero, settled).

```bash
ffmpeg -i parflow-walkthrough.mp4 -vf "select='eq(n\,0)'" -frames:v 1 -fps_mode passthrough poster-full.png
magick poster-full.png -filter Lanczos -resize 1600x -strip -sampling-factor 4:2:0 -interlace JPEG -quality 82 parflow-walkthrough.jpg
```

1600x900, 116135 bytes, SHA-256 `19e3d63209fef040cfd40e99bce1b022e8d44a1af083ba9f5acee9d38d509b8d`.

## parflow-walkthrough/1.jpg to 9.jpg

Nine frames from the mp4, evenly spaced at duration / 9 = 2.922 s starting at 0.8 s. The offset keeps every still out of the two crossfades. Same commands as the poster with `select='eq(n\,N)'` and `-resize 480x -quality 80`.

| File | Frame | Time | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| 1.jpg | 24 | 0.800 s | 480x270 | 17804 | `62f723003f029c7116983a76e77ce1f1cbfbc367c4cd56d99227b4dfb93452d8` |
| 2.jpg | 112 | 3.733 s | 480x270 | 17319 | `9ede0e7de076128b3cced4a4ab8d68a0dfad493be1726b481e4ec32cfe04814e` |
| 3.jpg | 199 | 6.633 s | 480x270 | 15185 | `733b6d6e21a99da24eb6663e93354d8c795fc9c6a6d2b89af9e7d761a2d70f96` |
| 4.jpg | 287 | 9.567 s | 480x270 | 14042 | `4d5edbf913ce346ad9ef801f4e91ac3b09f47879a9d0d78adcfdfe3166b716ad` |
| 5.jpg | 375 | 12.500 s | 480x270 | 11545 | `635f14afd095f6bdc66be730aa212b5cd96966c5b01547c7ff5a35394c3712a1` |
| 6.jpg | 462 | 15.400 s | 480x270 | 11618 | `838f378ff5d236fbfcfdbbe06ba3eb7b30e93cb915eb311ee77bb438a6ea810e` |
| 7.jpg | 550 | 18.333 s | 480x270 | 10818 | `4e8191602c14874cdd7351d6f0d2d0ce7e6fd67e884420d375bcdbd81aa27c58` |
| 8.jpg | 638 | 21.267 s | 480x270 | 17556 | `a2d33b1aaeed1ad49788c30361d5fe6367985c60bdc271030729b4a05530e6c3` |
| 9.jpg | 725 | 24.167 s | 480x270 | 16334 | `f9ce59797ca4daeeb496e71e349463cad804fba49ecf6cb9c9af52c0c5efe220` |

## gateway.jpg

Source: `blank-agency/.plannotator/site-revamp/artwork/gateway-og-background.png` (1536x1024, 3149354 bytes, SHA-256 `7079fb659a6282ff393d5292f7d968dc7d16852dd14879c6cc987cc00c409898`).

```bash
magick gateway-og-background.png -strip -sampling-factor 4:2:0 -interlace JPEG -quality 84 gateway.jpg
```

1536x1024, 297928 bytes, SHA-256 `90bf7d6aa94a7e9135024be4aebdbc615d2cd0461a963d7e35a5d4a5d187a27e`. No EXIF, ICC or XMP left in the file.

## aryan-smear.png and aryan-smear.jpg

`aryan-smear.png` was already in this folder and is unchanged: 1536x1024, 3317840 bytes, SHA-256 `c6988f0780c33d9459bc3c8c77d6e1ac887b8dfe97f54f622b351fe01722daef`.

```bash
magick aryan-smear.png -strip -sampling-factor 4:2:0 -interlace JPEG -quality 84 aryan-smear.jpg
```

`aryan-smear.jpg`: 1536x1024, 329042 bytes, SHA-256 `9a398e1f2d3ec83e20b8dcd597288ae313f912f9dcbea090b690d76d7ad309fe`.

## hitendra-smear.png and hitendra-smear.jpg

Generator: the built-in `image_gen` tool in Codex CLI 0.159.2, run non-interactively. The image model is not exposed by the tool. The Codex session ran on profile `direct` (provider `openai`, agent model `gpt-5.6-sol`), session `01a100c6-8661-7aa2-ac0f-e14d737661b3`. The default profile (`cpa`, CLIProxyAPI) does not expose `image_gen`. The session log shows `view_image` on both references and one `image_gen` call with `referenced_image_paths` set to them.

References:

- Image 1, the person: `public/team/hitendra.png`, SHA-256 `b0ba57c9310265245f43d074006f56ca88758a84843fe1a3f84cb400ed423b62`
- Image 2, the style example: `public/media/aryan-smear.png`, SHA-256 `c6988f0780c33d9459bc3c8c77d6e1ac887b8dfe97f54f622b351fe01722daef`

Command:

```bash
codex exec -p direct --skip-git-repo-check -C /tmp/rv/media -s workspace-write \
  -o /tmp/rv/media/codex-hitendra-v3.last.txt - < /tmp/rv/media/prompts/run-hitendra-smear-v3.txt
```

The wrapper told Codex to inspect both files with `view_image`, call `image_gen` with `referenced_image_paths` in that order, then copy the PNG byte for byte without editing it. Exact image prompt:

> Edit of a real photograph. Image 1 (the person reference) shows a real man: young South Asian man, dark hair styled up into a short quiff with short sides, rectangular dark-framed glasses, short trimmed beard and moustache, slim face, warm closed-mouth smile, wearing a dark kurta. Image 2 is the finished style example made for his co-founder; match its look closely. Create a new photograph of the SAME man from Image 1, preserving his identity exactly: same face shape, same glasses, same hair, same beard, same expression. Composition matching Image 2: landscape 3:2 (1536x1024), head-and-shoulders portrait, the man placed right of centre and looking slightly toward camera-left, his shoulders and the top of his dark kurta filling the lower right, lots of dark empty space on the left. Remove the colourful waterfall mural and the room entirely; replace it with a plain dark studio background, near-black with a faint soft grey glow behind the head. True black and white, neutral monochrome, no colour at all. A horizontal motion smear (like a slow-shutter head movement or a scanner drag) streaks sideways across the right part of his face and his right shoulder, dragging into soft horizontal streaks toward the right edge of the frame, while his eyes, glasses and the left half of his face stay sharp and recognisable. Heavy, coarse film grain and a slightly gritty print texture over the whole image, deep blacks, soft highlights. No text, no letters, no logo, no watermark, no border.

Generated file: `~/.codex/generated_images/01a100c6-8661-7aa2-ac0f-e14d737661b3/exec-913c56dc-62dd-4846-82b1-4d1853c5adc6.png`, kept as `/tmp/rv/media/originals/hitendra-smear-v3.png`. `hitendra-smear.png` is a byte copy: 1536x1024, 3250810 bytes, SHA-256 `7891946f99d64585fa4893edfaf9aff849f7393bba20c6a3fa36ca5defc759a8`.

Checks: no text, watermark or extra limbs; glasses, quiff, beard and kurta match the reference. Mean Lab a/b is 50.09/50.30 (50 is neutral), against 50.04/50.22 for `aryan-smear.png`, so the faint tone matches the Aryan image.

```bash
magick hitendra-smear.png -strip -sampling-factor 4:2:0 -interlace JPEG -quality 84 hitendra-smear.jpg
```

`hitendra-smear.jpg`: 1536x1024, 338207 bytes, SHA-256 `c5a4e38e15fadcbe4d04cece52fd5cf9802f8c549dbafa121b7dd65868e8d300`.

Earlier attempts made no image: v1 (proxy) `ERROR: exceeded retry limit, last status: 429 Too Many Requests`; v2 (proxy, 07:44Z) "The built-in `image_gen` tool is unavailable in this session."
