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

const DESCRIPTION =
  "A craft-led studio for 0→1 brand, interface, and product design. We embed with founding teams to build tempo and momentum.";

export const metadata: Metadata = {
  // Canonical home of the site. Every relative URL in metadata below — and in
  // each page's own `alternates.canonical` — resolves against this, so the
  // studio reads as one site even while other hostnames still serve the app.
  metadataBase: new URL("https://blankinterfaces.com"),
  title: "blank interfaces",
  description: DESCRIPTION,
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
      className={`h-full dark ${rethinkSans.variable} ${rethinkSans.className}`}
    >
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
