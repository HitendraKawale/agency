"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";
import { createNothinGlitch } from "./effects/nothin-glitch.mjs";

/**
 * noth.in's section.glitch with our words: the markup and class names are
 * theirs (reference/nothin/raw.html) so their copied code drives it unchanged.
 * Scrolling scrambles the clusters in proportion to scroll speed; scrolling
 * on drops their characters and types the final line in.
 */

// Their fourth line, kept as written; the scramble runs on top of it.
const NOISE = "Pj(è !!” .      U§hs .   jkj . k .     rh";
const CLUSTER = `we are blank<br/>we are blank<br/>we are blank<br/>${NOISE}`;
const FINAL = "We design and build <br/>websites and products <br/>for the people who <br/>use them and the <br/>agents that read them.";

// Hand-placed, as theirs are: one class per position in the 3-column grid.
const POSITIONS = ["_3", "_1", "_2", "_4", "none", "_6"] as const;

// Their teardown restores the section's original HTML, so an old instance
// tearing down after a new one has split the text would wipe the new one.
// React does not promise that order across remounts; this does.
let active: ReturnType<typeof createNothinGlitch> | null = null;

export default function Glitch() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    active?.destroy();
    const glitch = createNothinGlitch(gsap, ScrollTrigger);
    active = glitch;
    glitch.init();
    ScrollTrigger.refresh();
    return () => {
      if (active !== glitch) return;
      glitch.destroy();
      active = null;
    };
  }, []);

  return (
    <section className="section glitch" aria-label="We design and build websites and products for the people who use them and the agents that read them.">
      <div className="glitch-img-w">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/glitch-gateway.jpg" loading="lazy" alt="" className="img-ascenseur" />
      </div>
      <div className="glitch-text-w" aria-hidden="true">
        <div className="glitch-text-sticky-w">
          {POSITIONS.map((position) =>
            position === "none" ? (
              <div key={position} className="div-block-5 none">
                <div className="text-block-6" dangerouslySetInnerHTML={{ __html: CLUSTER }} />
              </div>
            ) : (
              <div key={position} className="div-block-5">
                <div className={`text-block-6 ${position}`} dangerouslySetInnerHTML={{ __html: CLUSTER }} />
              </div>
            ),
          )}
          {/* Their code splits this into characters, so React must not own its text nodes. */}
          <div className="finaltext" dangerouslySetInnerHTML={{ __html: FINAL }} />
        </div>
        <div className="img-glitch-w">
          <div className="merguez">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="merguez-img" src="/team/aryan.png" alt="" loading="lazy" />
          </div>
          <div className="ballon">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ballon-img" src="/team/hitendra.png" alt="" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
}
