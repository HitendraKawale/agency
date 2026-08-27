# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # next dev (Turbopack, root pinned in next.config.ts)
pnpm build        # next build
pnpm start        # serve the production build
pnpm lint         # eslint (flat config, eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit  # typecheck — `pnpm build` is the only other thing that typechecks
```

pnpm is the package manager (`pnpm-lock.yaml`, `pnpm-workspace.yaml`). There is no test suite and no test runner installed.

shadcn components are added via the CLI using `components.json` — style `base-nova`, `neutral` base, **`@base-ui/react` primitives (not Radix)**, lucide icons, RSC on. `lib/utils.ts` exports `cn`.

## Architecture

Next.js 16 App Router + React 19 + Tailwind v4, deployed as a static-ish marketing site for the studio "blank interfaces". No database, no API routes, no CMS — every page's content lives in `const` blocks at the top of its `page.tsx` (`NAV`/`SKILLS` in `app/page.tsx`, `PROJECTS` in `app/projects/page.tsx`, `CASE` in the Parflow case study).

### Two styling systems, on purpose

- **`app/globals.css`** — Tailwind v4 CSS-first config. `@theme inline` maps Tailwind tokens onto CSS variables defined in `:root`. There is no `tailwind.config.*`. The palette is **dark-only**: `<html>` hard-codes `class="dark"` in `app/layout.tsx` and `:root` holds the dark values directly. Don't add a light theme without changing both.
- **`app/agency.css`** (~1.3k lines) — hand-written semantic classes (`.library-row`, `.case-hero`, `.stack-chip`, `.score-ring`, …) that carry all editorial section styling, its media queries, and its `prefers-reduced-motion` overrides. Tailwind utilities are used only for structural shells (`min-h-full bg-black`, flex wrappers).

New page sections belong in `agency.css` as a named block next to the related ones, not as a utility soup in JSX. Accent triad is `#ff266c` / `#1cffaf` / `#5848ff`; mint (`#1cffaf`) is the studio's own accent and marks "our tool" in the case study, while client colors stay client colors.

Type is a local variable font — `app/fonts/RethinkSans[wght].ttf` loaded via `next/font/local` as `--font-rethink-sans`. (An unused duplicate sits at the repo root; the `app/fonts/` copy is the live one.)

### Canvas / WebGL components

`components/ui/` holds large self-contained visual components (`halftone-interface-hero` 894 lines, `ascii-tv-hero` 637, `ascii-image-reveal` 516) ported from the `ui.aryank.space` registry. Shared conventions worth preserving:

- All `"use client"`, all prop-driven with exported `*Props` interfaces and `DEFAULT_*` consts.
- They generate their own textures/glyph atlases at runtime — no image or font dependency beyond an optional video.
- An `embedded` prop decides whether the component owns its scroll container or rides the window scroll. `.tv-break` in `agency.css` deliberately has no overflow clipping because `AsciiTvHero` is used with `embedded={false}`.
- Expensive ones are mounted lazily behind an `IntersectionObserver` (`TeamReveal` wraps `AsciiImageReveal` this way) so the reveal plays while it's on screen.

### Motion

GSAP with `ScrollTrigger` + `SplitText` drives text reveals through one shared component, `components/ui/line-rise.tsx`. It bails entirely under `prefers-reduced-motion`, calls `ScrollTrigger.refresh()` after `document.fonts.ready` (line breaks are measured pre-webfont), and releases the line masks in `onComplete` so descenders aren't clipped forever. Every animated component follows the same pattern: check reduced motion in JS *and* neutralize the effect in a `@media (prefers-reduced-motion: reduce)` block in `agency.css`.

### FaviconHeatmap

`components/favicon-heatmap.tsx` is mounted globally in the root layout. It runs a `@paper-design/shaders-react` `Heatmap` into a hidden-but-in-viewport canvas (the shader self-pauses via IntersectionObserver, so it can't be parked off-screen), downsamples to 32×32 at 10fps, and swaps the `<link rel="icon">` element — Chrome only repaints the tab when the element itself is replaced, not on `href` mutation. `app/heatmap/page.tsx` is a scratch page for tuning the same shader.

### SVG vector editor

`components/svg-editor/` is a small standalone library, not site chrome:

- `types.ts` — the editable model: a flat `anchors` array across all subpaths, plus `starts` (subpath boundaries) and `closed` (per-subpath `Z`).
- `parse.ts` — `parsePath`/`serializePath` for the `M/L/H/V/C/S/Q/T/Z` subset, normalizing everything to cubics. Arcs (`A`) throw.
- `VectorEditor.tsx` — pointer-driven bezier rig; screen→user-space mapping goes through the live CTM so it stays correct at any render size.
- `FigmaFrame.tsx` — the "selected layer" chrome (drawn-open border, corner handles, live W×H badge via `ResizeObserver`).

Its only consumer is `components/ui/parflow-mark-editor.tsx` on the Parflow case study, which loads the client's real logo path so the page shows the artefact rather than a screenshot of Figma.

### Assets

Third-party logos are vendored into `public/logos/` (sourced from the svgl API) specifically so pages have no third-party runtime dependency. Keep it that way when adding stack logos.

## Repo notes

- `.claude/skills/userinterface-wiki` is a **symlink** into `.agents/skills/userinterface-wiki`, pinned by hash in `skills-lock.json`. Treat those rule files as vendored — don't hand-edit them.
- `app/privacy/page.tsx` carries two deliberate placeholders (`POSTAL_ADDRESS`, `CONTACT_EMAIL`) documented in comments; the email must stay in sync with the outreach pipeline's opt-out address, and `LAST_UPDATED` needs bumping whenever the notice's substance changes.
