import type { MetadataRoute } from "next";

/**
 * `/heatmap` is a shader scratch page, not part of the site's story — kept out
 * of the index so it can stay a scratch page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/heatmap",
    },
    sitemap: "https://blankinterfaces.com/sitemap.xml",
    host: "https://blankinterfaces.com",
  };
}
