import HalftoneInterfaceHero from "@/components/ui/halftone-interface-hero";
import Gateway from "@/components/site/gateway";
import IndexSheet from "@/components/site/index-sheet";
import Reveal from "@/components/site/reveal";
import { PROJECTS } from "@/components/site/projects";
import Work from "@/components/site/work";

const NAV = [
  { label: "projects", href: "/projects" },
  { label: "about us", href: "/about" },
  { label: "blog", href: "/blog" },
  { label: "contact", href: "mailto:aryan@blankinterface.com" },
];

export default function Home() {
  return (
    <main>
      {/* The hero is unchanged; it stays pinned while the sheet covers it. */}
      <section className="home-hero" aria-label="Blank Interfaces">
        <HalftoneInterfaceHero navigation={NAV} background="#05090A" foreground="#DFEAE8" />
      </section>

      <div className="home-sheet">
        <section className="row statement" data-hover-root>
          <div className="label-stack label">
            <span>( Studio )</span>
            <span className="dim">Mumbai, UK</span>
          </div>
          <Reveal as="h2" className="t-statement">
            <span className="indent" aria-hidden="true" />
            We design and engineer websites and products for the people who use them and the agents that read them.
          </Reveal>
        </section>

        <IndexSheet />

        <section className="sec" aria-labelledby="work-title">
          <div className="row sec-head label">
            <h2 id="work-title" className="span-2">
              ( Work )
            </h2>
            <span className="dim">{String(PROJECTS.length).padStart(2, "0")}</span>
          </div>
          <Work />
        </section>

        <Gateway />
      </div>
    </main>
  );
}
