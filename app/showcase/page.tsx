import type { Metadata } from "next";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Nav } from "@/components/sections/nav";
import { ShowcaseIndex } from "@/components/showcase";

export const metadata: Metadata = {
  title: "Showcase · Blank Interfaces",
  description: "Websites, brand identities and research for Parflow, Organic Foods, Relay, Moneybee, Rainpulse, Ralsonics and the CID.",
};

export default function ShowcasePage() {
  return (
    <div className="page">
      <Nav current="Showcase" />
      <ShowcaseIndex />
      <Contact />
      <Footer />
    </div>
  );
}
