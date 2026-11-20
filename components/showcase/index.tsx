"use client";
// basement's Showcase: the title and count, the Grid/Rows switch and the categories, then the
// tiles. Picking a category dims every tile outside it to 10% without moving the grid; picking it
// again clears it. Rows is shown as basement shows it, but only the grid is built so far.
import Image from "next/image";
import { useState } from "react";
import { categories, showcase, type Category } from "@/content/showcase";
import s from "./showcase.module.css";

export function ShowcaseIndex() {
  const [picked, setPicked] = useState<Category | null>(null);
  const { title, projects } = showcase;

  return (
    <div className={s.wrap}>
      <section className={`grid-12 ${s.head}`}>
        <h1>{title}</h1>
        <p className={s.count} aria-label={`${projects.length} projects`}>{projects.length}</p>
      </section>

      <section className={s.body}>
        <div className={`grid-12 ${s.bar}`}>
          <div className={s.views}>
            <button type="button" role="checkbox" aria-checked="true">
              <svg viewBox="0 0 12 12" aria-hidden><path d="M2 2h5v5H2zM7 7h3v3H7z" /></svg>
              <span>Grid</span>
            </button>
            <span aria-hidden>,</span>
            <button type="button" role="checkbox" aria-checked="false" aria-disabled="true" className="tube">
              <svg viewBox="0 0 12 12" aria-hidden><path d="M1 4h10v1H1zM1 7h10v1H1z" /></svg>
              <span>Rows</span>
            </button>
          </div>

          <div className={s.cats} data-picked={picked ? "" : undefined}>
            <p>Categories</p>
            <ul>
              {categories.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    className="tube"
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

        <div className={`grid-12 ${s.grid}`}>
          {projects.map((p, i) => {
            const dim = picked !== null && !(p.categories as readonly Category[]).includes(picked);
            // the first row is above the fold, and one of its tiles is the page's largest paint
            const img = (
              <Image
                src={`/showcase/tiles/${p.slug}.webp`}
                alt=""
                width={1920}
                height={1080}
                sizes="(max-width: 1023px) 100vw, 25vw"
                loading={i < 4 ? "eager" : "lazy"}
              />
            );
            return (
              <article key={p.slug} className={s.item} data-dim={dim ? "" : undefined}>
                {"href" in p ? (
                  <a className={`${s.tile} ${s.ticks}`} href={p.href} target="_blank" rel="noreferrer" aria-label={`View ${p.name}`}>
                    {img}
                  </a>
                ) : (
                  <div className={s.tile} role="img" aria-label={p.name}>{img}</div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
