import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LabClip } from "@/components/lab/clip";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Nav } from "@/components/sections/nav";
import { lab, labItem, labItems, sourceUrl } from "@/content/lab";

export const dynamicParams = false;
export const generateStaticParams = () => labItems.map((i) => ({ name: i.name }));

export async function generateMetadata({ params }: PageProps<"/lab/[name]">): Promise<Metadata> {
  const item = labItem((await params).name);
  if (!item) return {};
  return { title: `${item.title} · Lab · Blank Interfaces`, description: item.description };
}

// One recording: the clip large on the left, and on the right what it is, the behaviour it has to
// get right (the notes from ui.aryank.space), and a link to the live component.
export default async function LabItemPage({ params }: PageProps<"/lab/[name]">) {
  const item = labItem((await params).name);
  if (!item) notFound();
  return (
    <div className="page">
      <Nav current="Lab" />
      <article className="grid-12 mt-24 gap-y-8 max-lg:mt-16">
        <LabClip item={item} full className="col-start-1 col-end-9 max-lg:col-end-13" />
        <div className="col-start-9 col-end-13 flex flex-col gap-6 lg:pl-3 max-lg:col-start-1">
          <header>
            <h1 className="text-[38px] leading-9 font-semibold tracking-[-1.52px] text-ink-1">{item.title}</h1>
            <p className="mt-2 text-sm text-ink-3">{item.group}</p>
          </header>
          <p className="text-[15px] leading-normal text-ink-2">{item.description}</p>
          {item.notes.length > 0 && (
            <ul className="flex flex-col gap-4">
              {item.notes.map((n) => (
                <li key={n.label} className="text-sm leading-normal">
                  <p className="mb-1 font-semibold text-ink-1">{n.label}</p>
                  <p className="text-ink-3">{n.description}</p>
                </li>
              ))}
            </ul>
          )}
          <a href={sourceUrl(item)} className="tube-line self-start text-sm font-medium text-ink">
            {lab.source}
          </a>
        </div>
      </article>
      <Contact />
      <Footer />
    </div>
  );
}
