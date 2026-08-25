# blank interfaces

The studio site. One long scrolling homepage, a projects index, the Parflow
case study, and a privacy notice. It's a marketing site — no database, no API
routes, no CMS. Every word on it lives in a `const` at the top of the page that
renders it.

## Running it

```bash
pnpm install
pnpm dev
```

Then http://localhost:3000.

```bash
pnpm build          # production build
pnpm lint           # eslint
pnpm exec tsc --noEmit   # typecheck
```

Use `pnpm exec tsc`, not `npx tsc` — npx will happily download an unrelated
20-year-old package called `tsc` and confuse you for ten minutes.

There are no tests. Nothing here has the kind of logic that would benefit much
from them, with the arguable exception of the path parser (see below).

## The pages

| Route | What it is |
| --- | --- |
| `/` | The homepage. Hero, practice list, ASCII TV interlude, philosophy, team, contact. |
| `/projects` | Index of work. |
| `/projects/parflow-engineering` | The one full case study. |
| `/privacy` | UK GDPR notice covering outreach. |
| `/heatmap` | Not a real page — a scratch pad for tuning the favicon shader. |

## How the styling works

This is the part that surprises people, so read it before you touch a section.

There are two systems and they don't overlap much:

- **`app/globals.css`** holds the design tokens. Tailwind v4, configured in CSS
  — there is no `tailwind.config.js` and you shouldn't add one. The palette is
  dark-only: `<html>` hard-codes `class="dark"` and `:root` holds the dark
  values directly. There is no light theme, and adding one means changing both.
- **`app/agency.css`** is about 1,300 lines of hand-written, semantically named
  CSS (`.library-row`, `.case-hero`, `.stack-chip`) and it does all the real
  work. Every editorial section, its responsive behaviour, and its
  reduced-motion fallbacks live here.

Tailwind utilities in the JSX are only for structural shells — `min-h-full
bg-black`, flex wrappers, that sort of thing. When you add a section, write a
named block in `agency.css` next to the related ones. Don't build it out of
forty utility classes inline; the rest of the file will hate you for it.

Accents are `#ff266c`, `#1cffaf`, `#5848ff`. The mint one is ours, and in the
case study it specifically marks "our tool holding their asset" — client
colours stay client colours.

Type is Rethink Sans, loaded from `app/fonts/` through `next/font/local`.
(There's an identical copy at the repo root. It's unused. Delete it at some
point.)

## The heavy components

`components/ui/` has a handful of large canvas and WebGL pieces — the halftone
hero, the ASCII TV, the ASCII image reveal. They're ported from the
`ui.aryank.space` registry and they follow the same shape: `"use client"`,
everything prop-driven with a `DEFAULT_*` const beside it, and they generate
their own textures and glyph atlases at runtime rather than shipping images.

Two conventions worth knowing:

- The `embedded` prop decides whether a component owns its own scroll container
  or rides the window scroll. `.tv-break` in `agency.css` deliberately has no
  overflow clipping because the TV is used with `embedded={false}`. If you clip
  it, the effect breaks and it isn't obvious why.
- Expensive components mount lazily behind an `IntersectionObserver` —
  `TeamReveal` wraps `AsciiImageReveal` that way so the decode animation plays
  when someone is actually looking at it.

Text reveals all go through one component, `components/ui/line-rise.tsx`
(GSAP `SplitText` + `ScrollTrigger`). It refreshes ScrollTrigger after
`document.fonts.ready`, because line breaks get measured before the webfont
lands and everything ends up in the wrong place otherwise. It also releases the
line masks once the animation finishes, or descenders stay clipped forever.

The pattern for motion generally: bail out in JS on `prefers-reduced-motion`,
*and* neutralise it in a `@media (prefers-reduced-motion: reduce)` block. Both,
not either.

## Two odd bits

**The favicon is alive.** `components/favicon-heatmap.tsx` runs a Paper shader
into a hidden canvas, downsamples it to 32×32 ten times a second, and swaps the
`<link rel="icon">`. It has to replace the whole element each frame — Chrome
won't repaint the tab if you just mutate `href`. The canvas sits in the
viewport at zero opacity rather than off-screen, because the shader pauses
itself via IntersectionObserver when it isn't visible.

**There's a bezier editor in here.** `components/svg-editor/` is a small
standalone library: parse an SVG path into anchors and handles, drag them
around, serialise back out. It handles the `M/L/H/V/C/S/Q/T/Z` subset and
throws on arcs. Its only consumer is the Parflow case study, which loads the
client's actual logo path so the page shows the real artefact instead of a
screenshot of Figma.

## Deploying

Vercel, on merge to `main`. Nothing to configure.

## Rough edges

Things that are known, so you don't go hunting:

- `pnpm lint` fails on `halftone-interface-hero.tsx:665`
  (`react-hooks/set-state-in-effect`, the clock). Pre-existing.
- `app/privacy/page.tsx` has two placeholders — `POSTAL_ADDRESS` and
  `CONTACT_EMAIL` — that need real values before the notice is much use. The
  email has to match the outreach pipeline's opt-out address. Bump
  `LAST_UPDATED` whenever the substance changes.
- `/privacy` isn't linked from anywhere on the site.
- Two external runtime dependencies contradict the otherwise self-contained
  approach: the ASCII TV pulls its video from `ui.aryank.space`, and the case
  study hero is an `embed.mckp.live` iframe. Stack logos, by contrast, are
  vendored into `public/logos/` on purpose — keep doing that.
- `public/` still has create-next-app leftovers (`next.svg`, `window.svg`,
  `globe.svg`, `file.svg`) and an unused `mockup.mp4` / `mockup-poster.jpg`.
