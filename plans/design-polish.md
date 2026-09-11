# Agency design polish plan

> Implementation: use the executing-plans skill after approval. This file is a review draft, not permission to edit the site.

## Goal

The homepage gives effects more space than project work, and its mobile header hides every navigation link.
Keep the halftone identity, make work and contact easy to find, and improve reading contrast and spacing.
Prove the change with desktop/mobile screenshots, navigation checks, reduced-motion checks, lint, and a production build.

Architecture: edit the existing homepage, stylesheet, and hero component. Keep Next.js, Rethink Sans, and the current shader. No new UI library or component framework.

Design brief: the user chose the recommended refined experimental direction. Detailed scope below still needs approval.

## The visual decision

Keep the animated wordmark as the memorable element. Give the rest of the page clear typography and real project content rather than another full-screen animation.

```text
Before                              After
[Halftone + hidden mobile links]  -> [Halftone + visible work/contact]
[Large intro + practice table]    -> [Compact intro + featured work]
[3.4-screen TV interlude]         -> [Practice + studio + contact]
```

### Palette and type

| Token | Value | Use |
| --- | --- | --- |
| Black | `#000000` | Keep the existing page background |
| Chalk | `#f3f3f1` | Keep primary text |
| Silver | `#a6a6a4` | Readable secondary copy instead of 42% foreground opacity |
| Rule | `#303030` | Quiet section separators, not control outlines |
| Mint | `#1cffaf` | Existing link and focus accent only |

Keep Rethink Sans for body, navigation, and section headings. Preserve the shader's existing Helvetica wordmark geometry rather than changing its texture generator.

Use 16–20px body text with 1.5 line height and a 60-character maximum measure. Use 32–64px section headings. Reserve larger type for the hero and final contact heading. Replace tracked uppercase section labels with sentence case. Keep actual project names and business claims unchanged.

Keep shared horizontal gutters at `clamp(1.25rem, 4vw, 4rem)`. Cap inner content at 1440px. Use 64–112px section spacing, with 24–40px between a heading and its content. Left-align copy; remove the philosophy paragraph's 25% first-line indent.

Rejected: a new palette, a serif rebrand, glass panels, and a grid of identical service cards. Those replace the site's identity instead of polishing it.

## Files

Paths below are relative to `agency/`.

| File | Today | After |
| --- | --- | --- |
| `app/page.tsx` | Brand-only hero, large intro, practice table, TV interlude, studio story | Useful hero links, shorter intro, featured Parflow project, simpler practice list, existing studio/team/contact content |
| `app/agency.css` | Repeated gutters, dim secondary text, small uppercase labels, large section gaps | Consistent reading scale, aligned content, project feature, visible focus and touch targets |
| `components/ui/halftone-interface-hero.tsx` | Mobile nav hidden; custom particle cursor; hidden heading even when WebGL fails | Visible mobile links, native cursor, same halftone effect, visible fallback heading and static reduced-motion state |

Read-only regression targets: `/projects`, `/projects/parflow-engineering`, `/privacy`, and `/heatmap`. Shared CSS loads through `app/layout.tsx`, so those routes must be checked even though their page files do not change.

## Checklist and decision diffs

### 1. Capture the baseline before implementation

- [ ] Inspect `portless --help` and `portless list`; reuse the task's server if present, otherwise start `pnpm dev` through a distinct agency name in the background.
- [ ] Use Agent Browser to capture `/` at 1440×1000 and 390×844. Also inspect 320px width and the shared-style routes. Record actual URLs, screenshots, console errors, and failed requests.
- [ ] Confirm the source findings visually. If the baseline contradicts this plan, revise before editing.

Source inspection is complete for the three planned edit files. No running-browser baseline has been captured yet.

### 2. Make the hero useful without changing its identity

- [ ] Reduce primary navigation to Work, Studio, and Contact. Keep social links in the existing contact section, not the hero.

```diff
 const NAV = [
-  { label: "about", href: "#about" },
-  { label: "practice", href: "#practice" },
-  { label: "projects", href: "/projects" },
-  { label: "philosophy", href: "#philosophy" },
-  { label: "contact", href: "#contact" },
+  { label: "Work", href: "#work" },
+  { label: "Studio", href: "#about" },
+  { label: "Contact", href: "#contact" },
 ];
```

- [ ] Show those same three native anchor links on mobile. No hamburger or menu state. Give each a minimum 44px target and visible keyboard focus.
- [ ] Replace the hero's duplicate copyright line with `Brand, interface, and product. Built with your team.` Keep copyright in the page footer. Allow the hero footer to wrap on narrow screens.
- [ ] Remove the separate `PointerTrail` component and its particle implementation from this file. Restore the native cursor. Preserve the halftone shader's pointer response for normal-motion desktop users.

```diff
 <HalftoneCanvas headline={headline} foreground={foreground} />
-<PointerTrail accentColors={accentColors} />
```

Remove the now-unused accent-color prop and its homepage argument after confirming all callers with `rg`. Do not rewrite shader math.

- [ ] Render the existing heading visibly until WebGL has drawn successfully. On context/shader failure, keep the readable heading. Under reduced motion, draw the static wordmark without pointer listeners; do not merely hide an actively animating canvas.

### 3. Put project evidence before the service list

- [ ] Shorten the intro heading to `From first sketch to production.` Retain the founders, locations, and embedded-team description in the supporting paragraph.
- [ ] Add one `#work` section immediately after the intro: Parflow Engineering, existing local mockup media, a link to `/projects/parflow-engineering`, and `All projects` linking to `/projects`.

```jsx
<section id="work" className="featured-work" aria-labelledby="work-title">
  <h2 id="work-title">Selected work</h2>
  <video controls playsInline preload="none" poster="/mockup-poster.jpg">
    <source src="/mockup.mp4" type="video/mp4" />
  </video>
  <h3><a href="/projects/parflow-engineering">Parflow Engineering</a></h3>
  <a href="/projects">All projects</a>
</section>
```

No autoplay, custom video player, invented results, or new promotional copy. Give the video an accessible name in implementation and verify its audio/caption needs before shipping.

Asset limitation: the existing poster shows a loading screen and an `mckp.live` watermark. Keep attribution intact. Use this asset as supplied for the first pass; a cleaner authorized poster is a separate content improvement, not something to fabricate or crop around.

- [ ] Remove the homepage TV mount and its import. Leave `ascii-tv-hero.tsx` intact for future use rather than deleting an unrelated component.

```diff
-import AsciiTvHero from "@/components/ui/ascii-tv-hero";
-<section id="watch" className="tv-break" aria-label="ASCII television">
-  <AsciiTvHero ... scrollLength={3} />
-</section>
```

This removes the second major animation and the remote video dependency from the homepage.

### 4. Quiet the reading sections

- [ ] Keep four practice descriptions. Remove redundant category and number columns from this homepage list only. Use an unordered list since the disciplines are not sequential. Do not change the project listing's table layout.
- [ ] Remove `LineRise` wrappers around body paragraphs and individual service rows on the homepage. Keep it on section headings; leave its implementation untouched.
- [ ] Apply the planned type, contrast, spacing, and alignment values directly to the existing selectors rather than appending an override stylesheet.

```diff
-  --muted: color-mix(in srgb, var(--fg) 42%, transparent);
+  --muted: #a6a6a4;

 .philosophy h2 {
-  text-indent: 25%;
+  text-indent: 0;
 }
```

- [ ] Keep team portraits, founder links, and existing contact destinations. Make the email the strongest contact action, with social and phone links visually secondary.
- [ ] Add explicit `:focus-visible` styling and 44px minimum interactive targets where layout permits. Verify text contrast at least 4.5:1 for normal text and 3:1 for large text. Do not fade focused links.
- [ ] Disable decorative row translations under reduced motion. Preserve readable content without requiring hover.

### 5. Prove the result

- [ ] Run `pnpm lint` and `pnpm build` from `agency/`. Record failures separately from pre-existing baseline failures.
- [ ] Capture matching after screenshots at 1440×1000, 390×844, and 320px width. Compare gutters, section gaps, heading wraps, contrast, video framing, and footer layout.
- [ ] Exercise Work → project feature → case study → projects → home; Studio and Contact anchors; keyboard traversal; media controls. Check mail and phone hrefs without initiating messages or calls.
- [ ] Verify no horizontal overflow at each width, visible mobile navigation, one accessible primary heading, and no new console or network errors.
- [ ] Check reduced motion, disabled WebGL, and touch input. The hero must remain readable and navigable without animation or hover.
- [ ] Recheck the shared-style routes and team reveal after viewport resizing. No unseen case-study or legal-page regression is acceptable.
- [ ] Leave one runnable browser smoke check for mobile navigation, the project link, heading fallback, and overflow using available browser tooling. Do not add a test framework solely for this pass.
- [ ] Submit the implementation diff for browser review. Do not commit unless asked.

## Not doing

- No new dependencies, routes, CMS, contact form, or analytics.
- No redesign of the case study, vector editor, heatmap, or privacy content.
- No new shader effects or animation infrastructure.
- No invented clients, testimonials, metrics, or replacement brand assets.
- No performance claims without measurements.

## Review status

- [x] User selected refined experimental over a quiet-studio redesign.
- [x] Draft grounded in the current source and inspected poster.
- [ ] Browser baseline captured.
- [ ] Detailed scope approved in Plannotator.
- [ ] Implementation started.

The current session exposes neither `plannotator_submit_plan` nor a `plannotator` executable. Keep this draft pending until browser review is available or the user explicitly waives that gate.
