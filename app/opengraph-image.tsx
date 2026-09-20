import { ImageResponse } from "next/og";

/**
 * The link preview card. Echoes the halftone hero without running it: the
 * accent triplet reads as the same identity, drawn as a static ink row so the
 * card is a still image with no runtime.
 *
 * Deliberately set in the built-in face. `next/og` renders this outside the
 * document, so it does not inherit the site's Search System Pro Mono webfont.
 *
 * Hierarchy therefore comes from size and colour, never weight.
 */

export const alt =
  "blank interfaces — a craft-led studio for 0→1 brand, interface, and product design";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BACKGROUND = "#000000";
const FOREGROUND = "#f3f3f1";
const ACCENTS = ["#ff266c", "#1cffaf", "#5848ff"];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BACKGROUND,
          color: FOREGROUND,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {ACCENTS.map((color) => (
            <div
              key={color}
              style={{ width: 64, height: 8, background: color }}
            />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ display: "flex", fontSize: 128, lineHeight: 1 }}>
            blank interfaces
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 34,
              lineHeight: 1.35,
              color: "rgba(243, 243, 241, 0.62)",
              maxWidth: 900,
            }}
          >
            A craft-led studio for 0→1 brand, interface, and product design.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 24,
            color: "rgba(243, 243, 241, 0.45)",
          }}
        >
          <div style={{ display: "flex" }}>blankinterfaces.com</div>
          <div style={{ display: "flex" }}>mumbai · uk · remote</div>
        </div>
      </div>
    ),
    size,
  );
}
