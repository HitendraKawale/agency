import type { Metadata } from "next";
import localFont from "next/font/local";
import { FaviconHeatmap } from "@/components/favicon-heatmap";
import "./globals.css";
import "./agency.css";

const rethinkSans = localFont({
  src: "./fonts/RethinkSans[wght].ttf",
  weight: "400 800",
  display: "swap",
  variable: "--font-rethink-sans",
  fallback: ["Helvetica", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "blank interfaces",
  description:
    "A craft-led studio for 0→1 brand, interface, and product design. We embed with founding teams to build tempo and momentum.",
  keywords: [
    "blank interfaces",
    "design studio",
    "0 to 1 product design",
    "agentic AI",
    "interface design",
    "Aryan Kathawale",
    "Hitendra Kawale",
  ],
  authors: [
    { name: "Aryan Kathawale", url: "https://tldr.aryank.space" },
    { name: "Hitendra Kawale", url: "https://hitendra.dev" },
  ],
  openGraph: {
    title: "blank interfaces",
    description:
      "A craft-led studio for 0→1 brand, interface, and product design. We embed with founding teams to build tempo and momentum.",
    type: "website",
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
      className={`h-full dark ${rethinkSans.variable} ${rethinkSans.className}`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <FaviconHeatmap />
        {children}
      </body>
    </html>
  );
}
