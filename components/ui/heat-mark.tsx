"use client";

// The Blank wordmark as a link, with the heat effect after a hover (lib/mark/heat-logo.ts), and
// optionally written in by the heat when it first scrolls into view (`heat.reveal`).
// Extra props (data-intro, data-reveal, ...) land on the link; `svgProps` on the <svg>.
import { useEffect, useRef, type ComponentProps, type SVGProps } from "react";
import { attachHeatLogo, type HeatLogoOptions } from "@/lib/mark/heat-logo";
import { motionOn } from "@/lib/motion/gsap";
import { wordmark } from "@/lib/mark/wordmark";

type Props = ComponentProps<"a"> & {
  heat: HeatLogoOptions;
  svgProps?: SVGProps<SVGSVGElement> & Record<`data-${string}`, string>;
};

export function HeatMark({ heat, svgProps, ...link }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { ink, bg, delay, autoplay, reveal } = heat;

  useEffect(() => {
    // the reveal only runs with the intro: reduced motion and ?still get the finished mark
    const logo = attachHeatLogo(ref.current!, { ink, bg, delay, autoplay, reveal: reveal && motionOn() });
    return () => logo?.destroy();
    // the colours are fixed per mark; reattaching on every render would rebuild the blur levels
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <a ref={ref} data-heat-reveal={reveal || undefined} {...link}>
      <svg viewBox={`0 0 ${wordmark.width} ${wordmark.height}`} fillRule="evenodd" {...svgProps}>
        <path d={wordmark.path} />
      </svg>
    </a>
  );
}
