import type { Metadata } from "next";
import { Fraunces, Geist } from "next/font/google";
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Realtime } from "@/components/realtime/realtime";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
// only the Organic Foods wordmark uses it, at weight 600 with the optical-size axis
const fraunces = Fraunces({ subsets: ["latin"], axes: ["opsz"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  metadataBase: new URL("https://blankinterfaces.com"),
  title: "Blank Interfaces",
};

// Runs before first paint: turn the motion on unless the viewer prefers reduced motion or the URL
// asks for a still page (?still, used for screenshots). Everything in lib/motion keys off `.intro`.
const introScript = `if(!matchMedia("(prefers-reduced-motion: reduce)").matches&&!/[?&]still\\b/.test(location.search))document.documentElement.classList.add("intro")`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${fraunces.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>
        {children}
        <SmoothScroll />
        <Realtime />
      </body>
    </html>
  );
}
