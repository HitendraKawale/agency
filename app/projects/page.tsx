import type { Metadata } from "next";
import WorkPage from "@/components/site/work-page";
import "./work.css";

export const metadata: Metadata = {
  title: "projects , blank interfaces",
  description:
    "Work by blank interfaces, a design and engineering studio in Mumbai and the UK: Parflow Engineering, Ralsonics, Moneybee and Organic Foods.",
  alternates: { canonical: "/projects" },
};

export default function ProjectsPage() {
  return <WorkPage />;
}
