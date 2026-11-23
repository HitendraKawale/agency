import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Machine } from "@/components/machine/machine";
import { urls } from "@/lib/machine/doc";
import { docByPath, docs } from "@/lib/machine/pages";

export const dynamicParams = false;
export const generateStaticParams = () => docs.map((d) => ({ path: d.path.split("/") }));

export async function generateMetadata({ params }: PageProps<"/ai/[...path]">): Promise<Metadata> {
  const doc = docByPath((await params).path.join("/"));
  if (!doc) return {};
  const { ai, md } = urls(doc.path);
  return {
    title: { absolute: doc.head.title },
    description: doc.head.description,
    alternates: { canonical: ai, types: { "text/markdown": md } },
    other: { "color-scheme": "dark" },
  };
}

export default async function MachinePage({ params }: PageProps<"/ai/[...path]">) {
  const doc = docByPath((await params).path.join("/"));
  if (!doc) notFound();
  return <Machine doc={doc} />;
}
