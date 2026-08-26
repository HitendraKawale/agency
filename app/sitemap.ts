import type { MetadataRoute } from "next";

const SITE = "https://blankinterfaces.com";

/**
 * Hand-maintained: the site is a handful of authored pages, not a generated
 * archive. Add a route here when you add one to `app/`. `/heatmap` is
 * deliberately absent — see `robots.ts`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE}/projects`, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${SITE}/projects/parflow-engineering`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    { url: `${SITE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
