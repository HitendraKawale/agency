import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LabClip } from "@/components/lab/clip";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Nav } from "@/components/sections/nav";
import { labItem, labItems, summary } from "@/content/lab";

export const dynamicParams = false;
export const generateStaticParams = () => labItems.map((i) => ({ name: i.name }));

export async function generateMetadata({ params }: PageProps<"/lab/[name]">): Promise<Metadata> {
  const item = labItem((await params).name);
  if (!item) return {};
  return { title: `${item.title} · Lab · Blank Interfaces`, description: item.description };
}

// One recording: the clip large on the left, the title and one sentence of what it is on the right.
export default async function LabItemPage({ params }: PageProps<"/lab/[name]">) {
  const item = labItem((await params).name);
  if (!item) notFound();
  return (
    <div className="page">
      <Nav current="Lab" />
      <article className="grid-12 mt-24 gap-y-8 max-lg:mt-16">
        <LabClip item={item} full className="col-start-1 col-end-9 max-lg:col-end-13" />
        <div className="col-start-9 col-end-13 flex flex-col gap-3 lg:pl-3 max-lg:col-start-1">
          <h1 className="text-[38px] leading-9 font-semibold tracking-[-1.52px] text-ink-1">{item.title}</h1>
          <p className="text-sm leading-normal text-ink-3">{summary(item)}</p>
        </div>
      </article>
      <Contact />
      <Footer />
    </div>
  );
}
