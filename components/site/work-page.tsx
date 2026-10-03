"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { createAinoWork, type WorkView } from "./effects/aino-work.mjs";
import { readPreferences, subscribePreferences } from "./preferences";

/**
 * /projects as Aino's work page: their markup (reference/aino/work.html) with
 * our projects, driven by their work module gn (components/site/effects/
 * aino-work.mjs). Tiles decode from glyphs into the image one after another,
 * a project lights up as a group under the pointer, and Grid/List switches
 * between the tiles and the numbered line list.
 */

type Tile = { kind: "image" | "video"; src: string; width: number; height: number };

type Case = {
  number: string;
  name: string;
  year: string;
  href: string;
  tiles: Tile[];
};

const CASES: Case[] = [
  {
    number: "A001",
    name: "Parflow Engineering",
    year: "2026",
    href: "/projects/parflow-engineering",
    tiles: [
      { kind: "video", src: "/media/clients/parflow.mp4", width: 1920, height: 1080 },
      { kind: "image", src: "/frames/parflow-home-mobile.png", width: 390, height: 844 },
      { kind: "image", src: "/frames/parflow-product-mobile.png", width: 390, height: 844 },
      { kind: "image", src: "/frames/parflow-catalogue.png", width: 1440, height: 900 },
    ],
  },
  {
    number: "A002",
    name: "Ralsonics",
    year: "2026",
    href: "https://ralsonics-engineering.vercel.app/",
    tiles: [
      { kind: "video", src: "/media/clients/ralsonics.mp4", width: 1920, height: 1080 },
      { kind: "image", src: "/frames/ralsonics-mobile.jpg", width: 390, height: 844 },
      { kind: "image", src: "/frames/ralsonics-home.jpg", width: 1440, height: 900 },
      { kind: "image", src: "/frames/ralsonics-inner.jpg", width: 1440, height: 900 },
    ],
  },
  {
    number: "A003",
    name: "Moneybee",
    year: "2026",
    href: "https://moneybee-virid.vercel.app/",
    tiles: [
      { kind: "video", src: "/media/clients/moneybee.mp4", width: 1920, height: 1080 },
      { kind: "image", src: "/frames/moneybee-mobile.jpg", width: 390, height: 844 },
      { kind: "image", src: "/frames/moneybee-home.jpg", width: 1440, height: 900 },
      { kind: "image", src: "/frames/moneybee-inner.jpg", width: 1440, height: 900 },
    ],
  },
  {
    number: "A004",
    name: "Organic Foods",
    year: "2026",
    href: "https://organic-market-eight.vercel.app/",
    tiles: [
      { kind: "video", src: "/media/clients/organic-foods.mp4", width: 1920, height: 1080 },
      { kind: "image", src: "/frames/organic-foods-mobile.jpg", width: 390, height: 844 },
      { kind: "image", src: "/frames/organic-foods-home.jpg", width: 1440, height: 900 },
      { kind: "image", src: "/frames/organic-foods-inner.jpg", width: 1440, height: 900 },
    ],
  },
];

/** Listed but without a page, as Aino lists theirs (.line.inactive). */
const UNANNOUNCED = [
  { number: "005", name: "Unannounced", year: "2026" },
  { number: "006", name: "Unannounced", year: "2026" },
];

const VIEW_KEY = "blank-work-view";

function readView(): WorkView {
  try {
    return localStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

// Their module restores what it changed on dispose; an old instance disposing
// after a new one has started would undo the new one. Keep one at a time.
let active: ReturnType<typeof createAinoWork> | null = null;

const isExternal = (href: string) => /^https?:/.test(href);

export default function WorkPage() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    active?.dispose();
    const work = createAinoWork(root, readPreferences(), {
      workView: readView(),
      onWorkView(view) {
        try {
          localStorage.setItem(VIEW_KEY, view);
        } catch {}
      },
      // gn hands over the anchor's resolved href, which is absolute even for
      // our own pages. Client sites open in a new tab, as their tiles do.
      navigate(href) {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin) {
          router.push(url.pathname + url.search + url.hash);
          return;
        }
        window.open(url.href, "_blank", "noopener,noreferrer");
        // This page stays, so undo gn's exit state (.out on the list, the blinking row).
        root.querySelector(".linelist")?.classList.remove("out");
        for (const row of root.querySelectorAll(".linelist li.active")) row.classList.remove("active");
      },
    });
    active = work;
    void work.run();
    const unsubscribe = subscribePreferences(() => work.update(readPreferences()));
    return () => {
      unsubscribe();
      if (active !== work) return;
      work.dispose();
      active = null;
    };
  }, [router]);

  return (
    <div ref={rootRef} className="aino-work">
      <main className="aino-app">
        <div className="section menu" data-view="">
          <div className="col">
            <h1 className="monocaps projects">Projects</h1>
          </div>
          <div className="col">
            <div className="buttons">
              <div className="btn">
                <button className="ghost monocaps" name="grid" type="button">
                  Grid
                </button>
              </div>
              <div className="btn">
                <button className="ghost monocaps" name="list" type="button">
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="section gridcontainer">
          <div className="span-4">
            <div className="items">
              {CASES.map((project) => (
                <div key={project.number} className="case">
                  {project.tiles.map((tile) => (
                    <div key={tile.src} className="item">
                      <a
                        href={project.href}
                        aria-label={tile.kind === "video" ? `${project.name}, work by Blank Interfaces` : undefined}
                        target={isExternal(project.href) ? "_blank" : undefined}
                        rel={isExternal(project.href) ? "noopener noreferrer" : undefined}
                        onClick={(event) => {
                          if (isExternal(project.href)) return;
                          event.preventDefault();
                          router.push(project.href);
                        }}
                      >
                        <div className="image">
                          {tile.kind === "video" ? (
                            <video
                              src={tile.src}
                              width={tile.width}
                              height={tile.height}
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                          ) : (
                            // The kernel samples this element, so it stays a plain <img>.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={tile.src} alt={`${project.name}, work by Blank Interfaces`} width={tile.width} height={tile.height} />
                          )}
                        </div>
                      </a>
                      <div className="info">
                        <div className="number">{project.number}</div>
                        <div className="name">{project.name}</div>
                        <div className="year">{project.year}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section listcontainer">
          <div className="span-4">
            <ul className="linelist">
              {CASES.map((project, index) => (
                <li key={project.number} data-index={index}>
                  <a
                    href={project.href}
                    className="line"
                    target={isExternal(project.href) ? "_blank" : undefined}
                    rel={isExternal(project.href) ? "noopener noreferrer" : undefined}
                  >
                    <span>{project.number.slice(1)}</span>
                    <span className="wide">{project.name}</span>
                    <span>{project.year}</span>
                  </a>
                </li>
              ))}
              {UNANNOUNCED.map((project, index) => (
                <li key={project.number} data-index={CASES.length + index}>
                  <div className="line inactive">
                    <span>{project.number}</span>
                    <span className="wide">{project.name}</span>
                    <span>{project.year}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
