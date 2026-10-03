import type { Metadata } from "next";
import Work from "@/components/site/work";

export const metadata: Metadata = {
  title: "projects , blank interfaces",
  description:
    "Work by blank interfaces, a design and engineering studio in Mumbai and the UK: Parflow Engineering, Ralsonics, Moneybee, Organic Foods and two projects not yet announced.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return (
    <main className="page-top">
      <Work title="Projects" toggle />
    </main>
  );
}
