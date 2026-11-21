"use client";
// basement's Showcase: the title and count, the Grid/Rows switch and the categories, then the
// projects as tiles or rows. Picking a category dims everything outside it to 10% without moving
// anything; picking it again clears it. Rows is hidden below 1024, as basement hides it.
// Layout is Tailwind; basement's type sizes are in showcase.module.css.
import { useState } from "react";
import { cn } from "@/lib/utils";
import { categories, showcase, type Category } from "@/content/showcase";
import { Rows } from "./rows";
import { Tile } from "./tile";
import s from "./showcase.module.css";

type View = "grid" | "rows";

export function ShowcaseIndex() {
  const [picked, setPicked] = useState<Category | null>(null);
  const [view, setView] = useState<View>("grid");
  const { title, projects } = showcase;

  return (
    // head, then the categories block 96px below it, then the projects 8px under that
    <div className="mt-24 flex flex-col gap-24 max-lg:mt-16 max-lg:gap-9">
      <section className="grid-12 font-semibold">
        <h1 className={cn(s.display, "col-start-1 col-end-7 text-ink-2 max-lg:col-end-10")}>{title}</h1>
        <p
          className={cn(s.display, "col-start-7 col-end-12 text-ink-3 tabular-nums max-lg:col-start-10 max-lg:col-end-13 max-lg:text-end")}
          aria-label={`${projects.length} projects`}
        >
          {projects.length}
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <div className="grid-12 items-end pb-2 font-semibold">
          {/* Grid , Rows: 12px glyphs 4px from the word; the current view underlined in #E6E6E6 */}
          <div className={cn(s.p, "col-start-1 col-end-7 flex items-center gap-1 text-ink-3 max-lg:hidden")}>
            {(["grid", "rows"] as const).map((v, i) => (
              <span key={v} className="contents">
                {i > 0 && <span aria-hidden>,</span>}
                <button
                  type="button"
                  role="radio"
                  aria-checked={view === v}
                  onClick={() => setView(v)}
                  className="tube group flex h-4 items-center gap-1 text-ink-3 not-aria-checked:hover:text-ink-2 aria-checked:cursor-default aria-checked:text-ink-1"
                >
                  <svg viewBox="0 0 12 12" aria-hidden className="size-3 fill-current">
                    <path d={v === "grid" ? "M2 2h5v5H2zM7 7h3v3H7z" : "M1 4h10v1H1zM1 7h10v1H1z"} />
                  </svg>
                  <span className="group-aria-checked:underline">{v === "grid" ? "Grid" : "Rows"}</span>
                </button>
              </span>
            ))}
          </div>

          {/* once one is picked, the rest go grey */}
          <div className="group col-start-7 col-end-13 max-lg:col-span-full" data-picked={picked ? "" : undefined}>
            <p className={cn(s.h3, "mb-2 text-ink-3")}>Categories</p>
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {categories.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    className={cn(s.cat, "tube text-left text-ink-1 transition-colors duration-300 group-data-picked:not-aria-pressed:text-ink-3")}
                    aria-pressed={picked === c}
                    onClick={() => setPicked((p) => (p === c ? null : c))}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {view === "rows" && (
          <div className="grid-12 max-lg:hidden">
            <Rows projects={projects} picked={picked} />
          </div>
        )}
        {/* 12px gaps both ways, each tile three columns wide; in Rows the tiles are only for below 1024 */}
        <div className={cn("grid-12 gap-y-3 max-lg:gap-y-8", view === "rows" && "lg:hidden")}>
          {projects.map((p, i) => {
            const dim = picked !== null && !(p.categories as readonly Category[]).includes(picked);
            return (
              <article
                key={p.slug}
                className="col-span-3 transition-opacity duration-300 data-dim:opacity-10 max-lg:col-span-full"
                data-dim={dim ? "" : undefined}
              >
                <Tile project={p} eager={i < 4} />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
