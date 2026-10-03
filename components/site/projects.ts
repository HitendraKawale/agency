/**
 * The work, in one place, for the homepage index and /projects. Frames are
 * real captures of each shipped site; unannounced work has no image at all.
 */

export type Frame = {
  src: string;
  alt: string;
  shape: "wide" | "phone";
  /** Columns of the eight-strip grid, and where the tile starts. */
  span: 2 | 4;
  start?: number;
};

export type Project = {
  id: string;
  name: string;
  kind: string;
  year: string;
  status: "live" | "soon";
  /** A case study on this site, or the client's live site. */
  href?: string;
  frames: Frame[];
};

export const PROJECTS: Project[] = [
  {
    id: "parflow",
    name: "Parflow Engineering",
    kind: "Website",
    year: "2026",
    status: "live",
    href: "/projects/parflow-engineering",
    frames: [
      { src: "/frames/parflow-home.png", alt: "Parflow Engineering homepage", shape: "wide", span: 4 },
      { src: "/frames/parflow-home-mobile.png", alt: "Parflow Engineering homepage on a phone", shape: "phone", span: 2 },
      { src: "/frames/parflow-catalogue.png", alt: "Parflow product catalogue", shape: "wide", span: 4 },
      { src: "/frames/parflow-product-mobile.png", alt: "A Parflow product page on a phone", shape: "phone", span: 2 },
    ],
  },
  {
    id: "ralsonics",
    name: "Ralsonics",
    kind: "Website",
    year: "2026",
    status: "live",
    href: "https://ralsonics-engineering.vercel.app/",
    frames: [
      { src: "/frames/ralsonics-home.jpg", alt: "Ralsonics homepage", shape: "wide", span: 4 },
      { src: "/frames/ralsonics-mobile.jpg", alt: "Ralsonics homepage on a phone", shape: "phone", span: 2 },
      { src: "/frames/ralsonics-inner.jpg", alt: "Ralsonics product finder", shape: "wide", span: 2 },
    ],
  },
  {
    id: "moneybee",
    name: "Moneybee",
    kind: "Website",
    year: "2026",
    status: "live",
    href: "https://moneybee-virid.vercel.app/",
    frames: [
      { src: "/frames/moneybee-mobile.jpg", alt: "Moneybee homepage on a phone", shape: "phone", span: 2 },
      { src: "/frames/moneybee-home.jpg", alt: "Moneybee homepage", shape: "wide", span: 4 },
      { src: "/frames/moneybee-inner.jpg", alt: "Moneybee investment approach page", shape: "wide", span: 2 },
    ],
  },
  {
    id: "organic-foods",
    name: "Organic Foods",
    kind: "Website",
    year: "2026",
    status: "live",
    href: "https://organic-market-eight.vercel.app/",
    frames: [
      { src: "/frames/organic-foods-home.jpg", alt: "Organic Foods homepage", shape: "wide", span: 4 },
      { src: "/frames/organic-foods-mobile.jpg", alt: "Organic Foods homepage on a phone", shape: "phone", span: 2 },
      { src: "/frames/organic-foods-inner.jpg", alt: "Organic Foods farm photographs", shape: "wide", span: 2 },
    ],
  },
  { id: "unannounced-product", name: "Unannounced", kind: "Product", year: "2026", status: "soon", frames: [] },
  { id: "unannounced-interface", name: "Unannounced", kind: "Interface", year: "2026", status: "soon", frames: [] },
];

const byId = (id: string) => {
  const project = PROJECTS.find((entry) => entry.id === id);
  if (!project) throw new Error(`Unknown project ${id}`);
  return project;
};

/** One tile per frame, plus a blank tile for each unannounced project. */
type Tile = { project: Project; frame?: Frame };

const frame = (id: string, index: number): Tile => {
  const project = byId(id);
  return { project, frame: project.frames[index] };
};

/**
 * Grid order, eight strips per row: each project keeps its frames together
 * and the unannounced tiles fill the gaps between them.
 */
export const TILES: Tile[] = [
  frame("parflow", 0),
  frame("parflow", 1),
  { project: byId("unannounced-product") },
  frame("ralsonics", 0),
  frame("ralsonics", 1),
  frame("ralsonics", 2),
  frame("moneybee", 0),
  frame("moneybee", 1),
  frame("moneybee", 2),
  frame("organic-foods", 0),
  frame("organic-foods", 1),
  { project: byId("unannounced-interface") },
  frame("organic-foods", 2),
  frame("parflow", 2),
  frame("parflow", 3),
];
