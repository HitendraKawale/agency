// Every project on /showcase. The grid only renders this; the nav's count reads its length.
// Tiles are basement's kind: one 1920x1080 image of the client's mark on the client's own ground
// (public/showcase/tiles, rendered from .plannotator/works/proof/tiles-render.html).

export const categories = ["Websites", "Brand identity", "Research", "Apps", "Government"] as const;
export type Category = (typeof categories)[number];

export type Project = {
  name: string;
  slug: string;
  /** where the tile goes: the live site until each case study exists; none for work we can't show */
  href?: string;
  categories: readonly Category[];
};

export const showcase = {
  title: "Showcase",
  projects: [
    { name: "Parflow Engineering", slug: "parflow", href: "https://parflowengineering.com/", categories: ["Websites", "Brand identity"] },
    { name: "Organic Foods", slug: "organic", href: "https://organic-market-eight.vercel.app/", categories: ["Brand identity", "Websites"] },
    { name: "Relay, Manaslu Labs", slug: "relay", href: "https://relay.manaslulabs.xyz/", categories: ["Research", "Brand identity", "Websites"] },
    { name: "Moneybee", slug: "moneybee", href: "https://moneybee.in/", categories: ["Websites", "Brand identity"] },
    { name: "Rainpulse", slug: "rainpulse", href: "https://rainpulse-six.vercel.app/", categories: ["Research", "Brand identity", "Websites"] },
    { name: "Ralsonics", slug: "ralsonics", href: "https://ralsonics-engineering.vercel.app/", categories: ["Websites", "Brand identity"] },
    { name: "Kitse", slug: "kitse", href: "https://www.kitse.in/", categories: ["Websites"] },
    // our own app, still being built: no link yet
    { name: "Yoinkd", slug: "yoinkd", categories: ["Apps", "Brand identity"] },
    { name: "CID and the Government of India", slug: "gov", categories: ["Government"] },
  ],
} as const satisfies { title: string; projects: readonly Project[] };
