/** One row and one background video on /projects. */
export type StageProject = {
  id: string;
  name: string;
  industry: string;
  year: string;
  /** Internal case study, or the client's live site. */
  href: string;
  external: boolean;
  /** Label for the link shown in the active row. */
  note: string;
  /** Resolved against public/ by the page; null when no clip exists yet. */
  video: string | null;
  poster: string | null;
};

type Source = Omit<StageProject, "video" | "poster"> & {
  /** Candidates, first one that exists on disk wins. */
  videos: readonly string[];
  posters: readonly string[];
};

export const SOURCES: readonly Source[] = [
  {
    id: "parflow",
    name: "Parflow Engineering",
    industry: "Website",
    year: "2026",
    href: "/projects/parflow-engineering",
    external: false,
    note: "Case study",
    videos: ["/media/clients/parflow.mp4", "/media/parflow-walkthrough.mp4"],
    posters: ["/media/clients/parflow.jpg", "/media/parflow-walkthrough.jpg", "/frames/parflow-home.png"],
  },
  {
    id: "ralsonics",
    name: "Ralsonics",
    industry: "Industrial",
    year: "2026",
    href: "https://ralsonics-engineering.vercel.app/",
    external: true,
    note: "Visit site",
    videos: ["/media/clients/ralsonics.mp4"],
    posters: ["/media/clients/ralsonics.jpg", "/frames/ralsonics-home.jpg"],
  },
  {
    id: "moneybee",
    name: "Moneybee",
    industry: "Finance",
    year: "2026",
    href: "https://moneybee-virid.vercel.app/",
    external: true,
    note: "Visit site",
    videos: ["/media/clients/moneybee.mp4"],
    posters: ["/media/clients/moneybee.jpg", "/frames/moneybee-home.jpg"],
  },
  {
    id: "organic-foods",
    name: "Organic Foods",
    industry: "Food",
    year: "2026",
    href: "https://organic-market-eight.vercel.app/",
    external: true,
    note: "Visit site",
    videos: ["/media/clients/organic-foods.mp4"],
    posters: ["/media/clients/organic-foods.jpg", "/frames/organic-foods-home.jpg"],
  },
];

export const EMAIL = "aryan@blankinterface.com";

export const TAGLINES = [
  "Built for people. Read by agents.",
  "Two people. One studio.",
  "Shipped, then measured.",
] as const;
