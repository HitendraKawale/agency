import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Nav } from "@/components/sections/nav";
import { CaseStudy } from "@/components/showcase/case";
import { caseStudies, projectBySlug } from "@/content/showcase";

export const dynamicParams = false;
export const generateStaticParams = () => caseStudies.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: PageProps<"/showcase/[slug]">): Promise<Metadata> {
  const project = projectBySlug((await params).slug);
  if (!project) return {};
  return { title: `${project.name} · Blank Interfaces`, description: project.story[0] };
}

export default async function CasePage({ params }: PageProps<"/showcase/[slug]">) {
  const project = projectBySlug((await params).slug);
  if (!project) notFound();
  return (
    <div className="page">
      <Nav current="Showcase" />
      <CaseStudy project={project} />
      <Contact />
      <Footer />
    </div>
  );
}
