import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // portless names worktrees `<branch>.blank-agency.localhost`; Next's default
  // `*.localhost` matches one label, so the HMR socket (and dev hydration)
  // would be refused without this. *.trycloudflare.com is the public quick tunnel to the dev server.
  allowedDevOrigins: ["*.blank-agency.localhost", "*.trycloudflare.com"],
  // the dev badge sits over the hero artwork and shows up in comparison screenshots
  devIndicators: false,
  // `pnpm dev` runs the realtime worker (alchemy dev, :8787) beside Next. In dev the page reaches it
  // through this path on its own host, sockets included, so Online and Ask work on the portless URL
  // and through a tunnel alike. Production talks to the deployed worker directly.
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      { source: "/_realtime", destination: "http://localhost:8787/" },
      { source: "/_realtime/:path*", destination: "http://localhost:8787/:path*" },
    ];
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
