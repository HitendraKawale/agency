# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # next dev (Turbopack, root pinned in next.config.ts)
pnpm build        # next build
pnpm lint         # eslint (flat config, eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit  # typecheck
```

pnpm is the package manager. There is no test suite.

## State

Clean Next.js 16 App Router + React 19 + Tailwind v4 base, ahead of a full revamp (logo, colour scheme, concept). The previous site (Aino-grid port, case studies, WebGL heroes, SVG editor) lives at commit `f8bc4c6`. Recover assets or code from there with `git show f8bc4c6:<path>`.

- `app/globals.css` holds Tailwind v4 CSS-first config. There is no `tailwind.config.*`. No palette or fonts are defined yet.
- shadcn is configured in `components.json`: style `base-nova`, `@base-ui/react` primitives (not Radix), lucide icons, and the `@compronents` registry (needs `BLANK_REGISTRY_TOKEN`). `lib/utils.ts` exports `cn`. The CLI installs component dependencies on `add`.
- `public/team/` holds the two founder photos, the only asset kept from the old site.
- `metadataBase` in `app/layout.tsx` is `https://blankinterfaces.com`.

## Repo notes

- `.claude/skills/userinterface-wiki` is a symlink into `.agents/skills/userinterface-wiki`, pinned by hash in `skills-lock.json`. Treat those files as vendored.
