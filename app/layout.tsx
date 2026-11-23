import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Realtime } from "@/components/realtime/realtime";
import { CursorSynth } from "@/components/sound/cursor-synth";
import { site } from "@/content/home";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
// the machine view (/ai) only, at 600 as basement sets theirs
const geistMono = Geist_Mono({ subsets: ["latin"], weight: "600", variable: "--font-geist-mono" });
// only the Organic Foods wordmark uses it, at weight 600 with the optical-size axis
const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: site.name,
};

// Runs before first paint: turn the motion on unless the viewer prefers reduced motion or the URL
// asks for a still page (?still, used for screenshots). Everything in lib/motion keys off `.intro`.
const introScript = `if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&!/[?&]still\\b/.test(location.search))document.documentElement.classList.add("intro")`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      {/* extensions such as Grammarly write attributes onto <body> before React hydrates */}
      <body suppressHydrationWarning>
        {children}
        <SmoothScroll />
        <Realtime />
        <CursorSynth />
      </body>
    </html>
  );
}
