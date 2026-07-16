import type { Metadata } from "next";
import localFont from "next/font/local";
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
    "Independent product studio for strategy, interface design, software engineering, and applied AI.",
  keywords: [
    "blank interfaces",
    "agency",
    "agentic AI",
    "interface design",
    "Aryan Kathawale",
    "Hitendra Kawale",
  ],
  authors: [
    { name: "Aryan Kathawale", url: "https://tldr.aryank.space" },
    { name: "Hitendra Kawale", url: "https://hitendrakawale.github.io/" },
  ],
  openGraph: {
    title: "blank interfaces",
    description:
      "Independent product studio for strategy, design, engineering, and applied AI.",
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
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
