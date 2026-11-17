import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Logos are CSS-sized SVG/PNG (equal-area formula) and the reel art is pre-sized 720w WebP, so
    // next/image's resizing adds nothing there.
    files: ["components/sections/**"],
    rules: { "@next/next/no-img-element": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // brand studies and pinned references, not app code
    ".plannotator/**",
    "reference/**",
    // the Cloudflare Worker has its own tsconfig and runtime types
    "realtime/**",
  ]),
]);

export default eslintConfig;
