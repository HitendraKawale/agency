"use client";
// basement's Rows view (reference/basement-showcase/rows, measured at 1440 on 2026-11-21): an
// accordion with one row open, the first on load. A row is the client's icon and name, the
// categories, the year and View Work. Hovering a closed row fades in their drifting hatch; the open
// row shows six 16:9 frames from the case study, the montage first when there is one. A project
// that's coming soon has no case study, so its row says so and doesn't open.
// Layout is Tailwind; basement's type sizes, the hatch and the accordion track are in
// showcase.module.css.
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Category, Frame, ShowcaseProject } from "@/content/showcase";
import s from "./showcase.module.css";

export function Rows({ projects, picked }: { projects: readonly ShowcaseProject[]; picked: Category | null }) {
  const [open, setOpen] = useState<string | null>(projects[0]?.slug ?? null);

  return (
    <div>
      {projects.map((p) => {
        const soon = "soon" in p;
        const isOpen = !soon && open === p.slug;
        const dim = picked !== null && !(p.categories as readonly Category[]).includes(picked);
        const panel = `row-${p.slug}`;
        return (
          // the last row closes with the same 20% edge every row has on top
          <div
            key={p.slug}
            className="transition-opacity duration-300 last:border-b last:border-ink-1/20 data-dim:opacity-10"
            data-dim={dim ? "" : undefined}
          >
            {/* 12 columns 8px apart, a 1px edge at 20% #E6E6E6 above, 6px above and below */}
            <div
              className="group relative grid grid-cols-12 items-center gap-x-2 border-t border-ink-1/20 font-semibold text-ink-2"
              data-open={isOpen ? "" : undefined}
            >
              <button
                type="button"
                className={cn(
                  "col-span-full row-start-1 grid grid-cols-subgrid items-center py-1.5 text-left",
                  soon ? "cursor-default" : isOpen ? "cursor-s-resize" : "cursor-n-resize",
                )}
                aria-expanded={soon ? undefined : isOpen}
                aria-controls={soon ? undefined : panel}
                onClick={() => !soon && setOpen(isOpen ? null : p.slug)}
              >
                <span
                  className={cn(
                    s.hatch,
                    "pointer-events-none absolute -inset-y-px inset-x-0 overflow-hidden opacity-0 transition-opacity duration-300 ease-in-out",
                    // basement's curve, cubic-bezier(0.4, 0, 0.2, 1), is Tailwind's ease-in-out; the open row,
                    // and a row that can't open, show no hatch
                    !isOpen && !soon && "group-hover:opacity-100",
                  )}
                  aria-hidden
                />
                <span className={cn(s.h3, "col-span-4 flex items-center gap-2")}>
                  <Image
                    src={`/showcase/icons/${p.slug}.png`}
                    alt=""
                    width={18}
                    height={18}
                    className="mb-px size-4.5 rounded-full border border-ink-1/10"
                  />
                  {p.name}
                </span>
                <span className={cn(s.pTight, "col-start-5 col-end-11 inline-flex flex-wrap")}>
                  {p.categories.map((c, i) => (
                    <span key={c}>
                      {i > 0 && <i className="px-1 not-italic text-ink-3">,</i>}
                      {c}
                    </span>
                  ))}
                </span>
                <span className={cn(s.p, "col-start-11 col-end-12 tabular-nums")}>{p.year}</span>
              </button>
              {soon ? (
                <span className={cn(s.p, "col-start-12 col-end-13 row-start-1 justify-self-end text-ink-3")}>Coming soon</span>
              ) : (
                <Link
                  className={cn(s.p, "z-1 col-start-12 col-end-13 row-start-1 inline-flex items-center gap-1 justify-self-end hover:underline")}
                  href={`/showcase/${p.slug}`}
                >
                  View Work
                  <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-none stroke-current">
                    <path d="M3 8h9M9 5l3 3-3 3" />
                  </svg>
                </Link>
              )}
            </div>
            {/* the open row's frames: 16px under the row, six 16:9 frames two columns each */}
            {!soon && <div id={panel} className={s.panel} data-open={isOpen ? "" : undefined}>
              <div className="overflow-hidden">
                <Link className="grid grid-cols-6 gap-x-2 pt-4 pb-0.5" href={`/showcase/${p.slug}`} tabIndex={-1} aria-hidden>
                  {stripOf(p).map((f, i) => (
                    <StripFrame key={i} frame={f} play={isOpen} />
                  ))}
                </Link>
              </div>
            </div>}
          </div>
        );
      })}
    </div>
  );
}

// the montage first, then the case study's own frames, six in all; palettes don't read at this size
function stripOf(p: ShowcaseProject): Frame[] {
  const frames: Frame[] = p.run.filter((f) => f.kind !== "palette" && !("src" in f && f.src.endsWith("montage.mp4")));
  const montage = "montage" in p ? p.montage : undefined;
  const all: Frame[] = montage ? [{ kind: "video", src: montage, poster: `/showcase/tiles/${p.slug}.webp`, alt: "" }, ...frames] : frames;
  return all.slice(0, 6);
}

const frameCls = "block aspect-video h-auto w-full bg-tile object-cover";

function StripFrame({ frame, play }: { frame: Frame; play: boolean }) {
  if (frame.kind === "video")
    return play ? (
      <video
        src={frame.src}
        poster={frame.poster}
        muted
        loop
        playsInline
        autoPlay
        className={cn(frameCls, frame.fit === "contain" && "object-contain")}
      />
    ) : (
      <Image src={frame.poster} alt="" width={1920} height={1080} sizes="16vw" className={frameCls} />
    );
  if (frame.kind === "image") return <Image src={frame.src} alt="" width={1920} height={1080} sizes="16vw" className={frameCls} />;
  return null;
}
