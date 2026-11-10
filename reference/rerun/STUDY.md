# Rerun by Studio Gruhl: study

Source: https://www.studiogruhl.com/projects/rerun, pinned 2026-11-10.
Files: `source.html`, `stills/` (32), `video/` (19 mp4), `sheets/` (12-frame contact sheet per video, read left to right, top to bottom), `crops/` (colour labels).
Also read: the-brandidentity.com write-up (quotes below), rerun.io live. Brand New review is paywalled, not read.

## The one idea

"How do robots see?" Robots see the world as sensor data rendered through scientific colormaps (Jet, Turbo). The brand borrows that rendering as its colour, and borrows a workshop object (a bolt head) as its letter geometry. Everything else is noir, sandpaper and white.

Two sides, kept apart on purpose. Gruhl: "one side is very expressive, and one side is very rigid and minimal." The expressive side is only the colormap fields. The rigid side is type, grid, neutrals.

## Wordmark

- Lowercase `rerun`. Geometry from a bolt head: the `e` is an octagon, its counter a semicircle, the crossbar a slot that runs out of the letter. The `e` was designed first "because it's the odd one out"; `r`, `u`, `n` share construction.
- 45 degree chamfers on outer corners, tiny triangular nicks where strokes meet (machined, like a stamped part). Tight spacing, letters slightly fused.
- Optical sizes: `07-logo_sizes` shows five weights, heavier and simpler as it shrinks.
- Monogram `re` stamped into a hex bolt (`10-symbol`), embossed on a metal tag and a robot casing (`14-tag`, `21`, `22`). Physical, matte, black on black.
- Scale is the main move. Wordmark runs full width, edge to edge, often cropped by the frame (business card, billboard, podcast tile, poster bottoms).

## Colour

Neutrals (read from `03-colors`):
- White `#FFFFFF`
- Sandpaper `#F1EFEB`
- Noir `#171616`

Spectrum, labelled on the board as "Rerun color spectrum":
`#D72F21` red, `#F6DA75` yellow, `#86D9A6` mint, `#9BBFD3` pale blue, `#186ADD` blue.
The colour board is a looping vertical scroll through the spectrum, and the hex labels update to the colour under them.

Rules I can see in every application:
1. Colour never appears as a flat fill or a UI accent. It only appears as a field: a rendered sensor image.
2. Colour is never decoration on type. It sits inside the letterforms (thermal blob travelling inside black `rerun`, `01-Logo`), behind the white monogram, or as an image block.
3. Neutral layouts carry zero colour (design direction card, business card, typography card). The contrast between empty sandpaper and a full colour field is the brand.
4. The field always says "this is data": distance rings from the glyph outline (`05-Icon_Animation`), stepped scanline banding (`12-Digital_OOH`, `18-Website`), streamlines (`13`), thermal renders of real objects (robot arm `08`, gear `19`, `24`), thread or wave interference (`26`).

## Artwork generator

`29-Tool`: an internal "Rerun artwork visualizer 1.0". Every artwork comes out of this one tool, which is why the whole suite looks like one system and never like a stock gradient. Panel read from `crops/tool-panel.png` and `crops/tool-labels.png` (frame at 3 s):

- Media Source: preset `./robot.webm`, fit `cover`, isolatedBlurMask off, blurStrength 20, waveSpeed 0.05, waveLength 4, waveStretch 2, radialCenterX 1.5, radialCenterY -0.5.
- Media Gradient: render with video on, render gradient on. Color stops 0 to 4: `#186ADD`, `#9BBFD3`, `#F6DA75`, `#D72F21`, `#186ADD`. Displacement scale 500, noise 0.1, speed 5, amount 0.5, scale 3, octaves 2, mode 1.
- Background Gradient: render gradient on.

Mechanism: the source video is blurred and its value, plus a radial wave, is displaced by low-octave noise and mapped through a cyclic gradient. The ramp wraps from red back to blue, so red always sits against blue in thin contour bands (films 13, 19, 26). Mint `#86D9A6` is not a stop; it shows up where pale blue and yellow mix.

## Measured colour share

Nearest-palette share of every pixel, 2 frames per second (`measure/`):

| Footage | mean luminance | share |
| --- | --- | --- |
| Artwork films 08, 13, 19, 26 | 0.60 | pale blue 43%, blue 20%, mint 14%, yellow 12%, red 11% |
| Icon animation 05 | 0.60 | blue 32%, mint 23%, red 18%, white 14%, yellow 12% |
| OOH + poster 12, 16 (incl. noir surround) | 0.32 | noir 59%, then spectrum 30% |

The fields are high-key and cool. Pale blue is the resting ground and heat is the minority. My first generator pass measured 0.28 luminance and 57% red / 42% noir, the opposite.

## Type

- Basis Grotesque Regular (Colophon) for everything above caption size. Large, regular weight, tight leading, sentence case, a full stop at the end of headlines ("See what robots see.").
- Reddit Mono, uppercase, small, for metadata: dates, venues, names, versions ("RERUN 0.26", "VISUALIZE ROBOTICS DATA"). Always pinned to corners.
- "Re:" naming device: Re:Group (offsite), Re:Learn (podcast).
- Typography motion is a typing caret (`06-Typography`), typed, held, deleted, retyped.

## Layout

- Strong column grid, shown on screen in the spreads animation (`20`): pale blue columns appear first, content snaps in, images fade out.
- Headline top left, mark or wordmark bottom left, metadata in corners, a large void in between.
- Panels have small radii (posters, app icon, phone tiles); the website nav is a black pill bar.

## Motion

- Logo animation (`02`): camera starts inside the octagon `e`, pulls out to the full word, the word shrinks to `re`, to a dot, then the dot becomes the octagon. Scale through the mark.
- Fields are always moving, slowly and hypnotically ("fluid, bold, bright, almost hypnotic").
- Website (`18`): the ground flips noir to sandpaper with a hard horizontal wipe straight through the headline; the field under it keeps scrolling.
- Social (`27`): counting numbers (GitHub stargazers 9,995 to 10,310), typed headlines, the thermal blob crossing the wordmark.

## Applications seen

Logo, colours, logo animation, app icon, icon animation, typography, logo sizes, artwork film, billboard, symbol, design direction card, digital OOH (metro screens), artwork film, metal tag, business cards (sandpaper + noir), poster series, apparel (sweatshirt back print), website, artwork film, spreads, monogram on hardware, software UI, logo on hardware, podcast cover on phone, stage screen, social stories, mono UI tree, artwork tool, artwork film.

## What to take, what not to take

Take the method, not the look:
- One concept question answered with one rendering metaphor.
- Logo geometry from a real object in our own world.
- A neutral rigid side and a strictly fenced expressive side.
- One generator that makes every artwork.
- Scale and cropping of the wordmark as the main layout move.

Do not take: Turbo/Jet, the octagon `e`, Basis Grotesque + Reddit Mono, "Re:" naming, the robotics imagery. Those are Rerun's answers to Rerun's question.
