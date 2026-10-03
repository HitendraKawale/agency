import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import localFont from "next/font/local";
import SiteShell from "@/components/site/shell";
import "./globals.css";
import "./site.css";

const DESCRIPTION =
  "A design and engineering studio in Mumbai and the UK. We build websites and products for the people who use them and the agents that read them.";

// Names and statements. Search System Pro Mono (globals.css) carries labels.
const grotesk = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

// Search System Pro Mono is 0.745em wide and has no box-drawing glyphs, so the
// character grid, ASCII renders and terminal diagrams use a 0.6em code face.
// Self-hosted from the JetBrains release (OFL, app/fonts): Google's subsets
// leave out U+2500, and a fallback ─ │ ┌ breaks every rail in the diagrams.
const code = localFont({
  src: [
    { path: "./fonts/JetBrainsMono-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/JetBrainsMono-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-code",
  display: "swap",
});

/**
 * Runs before first paint, so the character grid and the saved Settings exist
 * before anything lays out. The grid math is Aino's inline head script: pick a
 * character width near 7.5px, snap the column count so eight strips and their
 * two-character gutters divide the viewport exactly, then derive font size,
 * tracking and line height from that width.
 */
const BOOT_SCRIPT = `(function(t){
var mood="dark",mode="image";
try{var p=JSON.parse(localStorage.getItem("blank-site")||"{}");if(p.appearance==="light")mood="light";if(p.mode==="text"||p.mode==="pixel")mode=p.mode}catch(e){}
t.dataset.mood=mood;t.dataset.mode=mode;
var safari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);
function grid(){var n=innerWidth,m=n<769,o=m?8:7.5,a=Math.round(n/o),d=0;
function snap(x){x-=18;x-=x%16;x+=18;o=n/x;d=(x-18)/8;a=x}
if(m){a-=6;a-=a%2;a+=6;o=n/a;d=(a-18)/8}else{snap(Math.round(n/o));if(o>8.8){o=8;snap(Math.round(n/o))}}
var f=o/.6-.9,h=2*o,s=t.style;
s.setProperty("--ch",o);s.setProperty("--cols",a);s.setProperty("--strip",d);
s.setProperty("--font-size",f+"px");s.setProperty("--letter-spacing",.6*(o/.6-f)+"px");
s.setProperty("--line-height",h+"px");s.setProperty("--line",(safari?Math.round(h):h)+"px")}
grid();addEventListener("resize",grid)})(document.documentElement)`;

export const metadata: Metadata = {
  // Canonical home of the site. Every relative URL in metadata below, and in
  // each page's own `alternates.canonical`, resolves against this, so the
  // studio reads as one site even while other hostnames still serve the app.
  metadataBase: new URL("https://blankinterfaces.com"),
  title: "blank interfaces",
  description: DESCRIPTION,
  keywords: [
    "blank interfaces",
    "design studio",
    "design and engineering",
    "answer engine optimisation",
    "interface design",
    "Aryan Kathawale",
    "Hitendra Kawale",
  ],
  authors: [
    { name: "Aryan Kathawale", url: "https://tldr.aryank.space" },
    { name: "Hitendra Kawale", url: "https://hitendra.dev/tldr" },
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "blank interfaces",
    description: DESCRIPTION,
    type: "website",
    url: "/",
    siteName: "blank interfaces",
  },
  twitter: {
    card: "summary_large_image",
    title: "blank interfaces",
    description: DESCRIPTION,
    creator: "@blank_spacets",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${grotesk.variable} ${code.variable}`}
      data-mood="dark"
      data-mode="image"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
