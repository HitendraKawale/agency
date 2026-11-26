import type { Metadata } from "next";
import Link from "next/link";
import { LabClip } from "@/components/lab/clip";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Nav } from "@/components/sections/nav";
import { lab, labGroups, labItems } from "@/content/lab";

export const metadata: Metadata = {
  title: "Lab · Blank Interfaces",
  description: lab.intro,
};

// The title and count as Showcase sets them, then one section per registry group (Pages first),
// three clips across. No filters: the page is one long scroll.
export default function LabPage() {
  return (
    <div className="page">
      <Nav current="Lab" />
      <div className="mt-24 flex flex-col gap-24 max-lg:mt-16 max-lg:gap-16">
        <section className="grid-12 gap-y-6 font-semibold">
          <h1 className="col-start-1 col-end-7 text-[98px] leading-[88px] tracking-[-3.92px] text-ink-2 max-lg:col-end-10 max-lg:text-[56px] max-lg:leading-[52px] max-lg:tracking-[-2.24px]">
            {lab.title}
          </h1>
          <p
            className="col-start-7 col-end-12 text-[98px] leading-[88px] tracking-[-3.92px] text-ink-3 tabular-nums max-lg:col-start-10 max-lg:col-end-13 max-lg:text-end max-lg:text-[56px] max-lg:leading-[52px] max-lg:tracking-[-2.24px]"
            aria-label={`${labItems.length} recordings`}
          >
            {labItems.length}
          </p>
          <p className="col-start-1 col-end-6 text-base leading-snug font-normal text-ink-3 max-lg:col-end-13">{lab.intro}</p>
        </section>

        {labGroups.map((group) => (
          // off-screen sections skip layout and paint; the size estimate (rows of ~330px) keeps
          // the scrollbar steady until a section has rendered once and remembers its real height
          <section
            key={group.title}
            aria-labelledby={`lab-${group.title}`}
            className="[content-visibility:auto]"
            style={{ containIntrinsicSize: `auto ${Math.ceil(group.items.length / 3) * 330 + 60}px` }}
          >
            <h2 id={`lab-${group.title}`} className="s-title mx-[22px] mb-6 max-[760px]:mx-1">
              {group.title}
              <sup className="ml-1 align-super text-xs tracking-normal">{group.items.length}</sup>
            </h2>
            <ul className="grid-12 gap-y-8">
              {group.items.map((item) => (
                <li key={item.name} className="col-span-4 max-lg:col-span-6 max-sm:col-span-full">
                  <Link href={`/lab/${item.name}`} className="group block">
                    <LabClip item={item} />
                    <p className="mt-2.5 text-sm font-medium tracking-[-0.01em] text-ink-1 transition-colors group-hover:text-ink">
                      {item.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <Contact />
      <Footer />
    </div>
  );
}
