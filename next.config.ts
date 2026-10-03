import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // portless names worktrees `<branch>.blank-agency.localhost`; Next's default
  // `*.localhost` matches one label, so the HMR socket (and dev hydration)
  // would be refused without this.
  allowedDevOrigins: ["*.blank-agency.localhost"],
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
