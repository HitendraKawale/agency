import AboutUs from "@/components/site/about-us";
import Gateway from "@/components/site/gateway";
import HomeHero from "@/components/site/home-hero";
import Glitch from "@/components/site/glitch";
import IndexSheet from "@/components/site/index-sheet";
import Reveal from "@/components/site/reveal";

const NAV = [
  { label: "projects", href: "/projects" },
  { label: "about us", href: "/about" },
  { label: "blog", href: "/blog" },
  { label: "contact", href: "mailto:aryan@blankinterface.com" },
];

export default function Home() {
  return (
    <main>
      {/* The hero, one full screen; the sections follow it in normal flow. */}
      <section className="home-hero" aria-label="Blank Interfaces">
        <HomeHero navigation={NAV} />
      </section>

      <div className="home-sheet">
        <section className="row statement" data-hover-root>
          <div className="label-stack label">
            <span>( Studio )</span>
            <span className="dim">Mumbai, UK</span>
          </div>
          <Reveal as="h2" className="t-statement">
            <span className="indent" aria-hidden="true" />
            Blank Interfaces designs and builds websites and products for the people who use them and the agents
            that read them. You bring us in when both have to work.
          </Reveal>
        </section>

        <IndexSheet />

        <AboutUs />

        <Glitch />

        <Gateway />
      </div>
    </main>
  );
}
