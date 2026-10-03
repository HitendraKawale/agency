import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The link preview card: the poster composition from the brief with our
 * lockup where Nocturna's wordmark sat. The doorway is generated artwork
 * (public/media/PROVENANCE.md); the lockup is the real SVG, not redrawn.
 *
 * Set in next/og's built-in face, which renders outside the document and
 * cannot use the site's webfonts.
 */

export const alt = "blank interfaces, visual gateways";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#DFEAE8";
const RULE = "rgba(223, 234, 232, 0.34)";

async function dataUri(path: string, type: string) {
  const file = await readFile(join(process.cwd(), "public", path));
  return `data:${type};base64,${file.toString("base64")}`;
}

export default async function OpengraphImage() {
  const [photo, lockup] = await Promise.all([
    dataUri("media/gateway.jpg", "image/jpeg"),
    dataUri("blank-interfaces-lockup-inverted.svg", "image/svg+xml"),
  ]);

  const label = { display: "flex", fontSize: 15, letterSpacing: 1.2, color: PAPER } as const;

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%", background: "#05090A" }}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={photo} width={1200} height={800} style={{ position: "absolute", top: -60, left: 0, filter: "grayscale(1)" }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: "linear-gradient(180deg, rgba(5,9,10,0.55) 0%, rgba(5,9,10,0) 45%, rgba(5,9,10,0.35) 100%)",
          }}
        />
        {[300, 600, 900].map((left) => (
          <div key={left} style={{ position: "absolute", top: 0, bottom: 0, left, width: 1, background: RULE }} />
        ))}

        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img src={lockup} width={420} height={231} style={{ position: "absolute", left: 300, top: 186 }} />

        <div style={{ ...label, position: "absolute", left: 24, top: 36, flexDirection: "column" }}>
          <span>DESIGN</span>
          <span>ENGINEERING</span>
          <span>ANSWER ENGINES</span>
          <span style={{ marginTop: 14 }}>blankinterfaces.com</span>
        </div>

        <div
          style={{
            position: "absolute",
            left: 24,
            top: 402,
            display: "flex",
            flexDirection: "column",
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -0.5,
            color: PAPER,
          }}
        >
          <span>VISUAL</span>
          <span>GATEWAYS</span>
        </div>

        <div style={{ ...label, position: "absolute", left: 24, right: 24, bottom: 22, justifyContent: "space-between" }}>
          <span>MUMBAI, UK</span>
          <span>REMOTE</span>
        </div>
      </div>
    ),
    size,
  );
}
