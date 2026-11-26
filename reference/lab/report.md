# Lab recording report

274 items from the compronents registry (234 components, 40 pages). 254 pass and show on `/lab`. 20 stay off it, listed below with the evidence. Statuses and one-line checks live in `content/lab.json`; contact sheets and clips in `.lab/clips/` (not committed).

How an item passed: a headless Chrome recorded it from a local `next start` of compronents at 1280x800, 2x, following its recipe (`scripts/lab/record.mjs`). A reviewer read the 12-frame contact sheet against the item's description and notes from `component-meta.ts`, and a sample of passes was checked again by hand. A pass means the main behaviour is visible in the clip, not that every note is.

## Broken in the component source (10)

Each was traced to a line in `~/Desktop/CREATE/compronents/src/registry`, and most were confirmed in a headless probe.

**Scroll triggers bound to the window, while the preview scrolls its own container.** `FullscreenPreview` scrolls a fixed `overflow-y-auto` div (`src/components/site/fullscreen-preview.tsx:31-32`), so `window.scrollY` stays 0.
- `moneybee-alpine-page`: all 35 `[data-reveal]`/`[data-stagger]` targets stay hidden at scrollTop 3000 (`index.tsx:637-656`).
- `moneybee-editorial-page`: every section below the hero stays at autoAlpha 0 (`motion.ts:126-176`).
- `march-2025-template`: `<ReactLenis root>` binds to the window and swallows every wheel event, so scrollTop stays 0 (`index.tsx:1301`).
- `lemon-bureau-page`: the home route is a single 100svh hero, and opening the menu calls `lenis.stop()` with `start()` only in the close callback, so wheel input dies after navigating from the menu (`index.tsx:882`, `:963`).

**Layout and positioning bugs.**
- `snap-parallax-projects`: `.psi-project-list` is absolute with no height, so all 31 panels measure 0px tall and the frame is black (`snap-parallax-projects.tsx:340-353`).
- `flip-marquee-horizontal`: the Flip clone is placed at a viewport-measured top inside the scrolling Lenis root, so it scrolls away. At scrollTop 2000 it sits at y -2000 (`flip-marquee-horizontal.tsx:145-158`, `:209-216`).
- `counter-word-preloader`: the expand step measures top/left against the root, but the containing block is `.cwp-hero-header`. With z-index -1 the frame ends behind the hero instead of filling the page (`counter-word-preloader.tsx:150-173`, `:362`).

**Input never reaches the effect.**
- `radial-name-wheel`: `.rnw-scroller`, the only element whose scrollTop turns the ring, has `pointer-events: none`, so the wheel never reaches it (`radial-name-wheel.tsx:311`).
- `type-garden`: the pointerdown handler focuses the hidden input without `preventDefault`, so the mousedown default moves focus back to `body`. After a click, typed letters never arrive (`type-garden.tsx:1467`).

**Physics.**
- `gravity-drop-landing`: bodies start `isStatic: true` and are released with `Body.setStatic(body, false)`. In matter-js 0.20 that leaves mass Infinity and position NaN (reproduced in node), so the thumbnails rotate but never fall (`gravity-drop-landing.tsx:120`, `:197`).

## Media that does not render in the recording (4)

These were not traced to a line. Each one failed the same way on two separate recordings.
- `video-card-stack`: every card shows the video host's "We couldn't verify the security of your connection" page instead of video.
- `crt-display`: the first channel's image shows, but Waypoint, Corridor and Archive leave the screen black.
- `preloader-reveal`: after the Engage wipe, the hero media is a black block with no headline.
- `image-pixelation`: every frame is black, whether recorded from load or after load.

## Recipe still misses the behaviour (6)

These render correctly, but no recipe so far shows the effect.
- `scroll-blur-footer`: the preview backdrop is an already blurred gradient that does not move, so the blur has nothing to act on. The demo needs sharp content behind it.
- `archive-commerce-page`: neither wheel nor PageDown moves the page. The next recipe should drive the routes (menu, catalogue, archive hover trail, cart) instead.
- `curtain-reveal-hero`: the scroll rushes through the cascade, then lands on the static next section.
- `cross-reveal-scroll`: the scale-up falls into one frame and the take runs on into blank white.
- `logo-mask-zoom-scroll`: the hole shrinking into the logo falls between frames. The one mid-shrink frame shows the opening anchored at the top left, which may be a transform-origin bug.
- `shuffle-grid-preloader`: the frame where the 3x3 grid should shuffle is black. The shuffle images likely aren't preloaded before the 150ms swaps fire.

## Recorder notes

- In the preview, Lenis scrollers move half the wheel delta: 6000px of wheel gives 3000px of scrollTop. The recorder doubles the wheel over `.lenis`, so a recipe's `px` is the real distance.
- Run at most two takes at once, with nothing else heavy on the machine. Takes recorded alongside tile encodes ran 1.5 to 5 times their planned length.
