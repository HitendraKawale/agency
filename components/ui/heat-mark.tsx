"use client";

// The Blank wordmark as a link, with the heat effect after a hover (lib/mark/heat-logo.ts), and
// optionally written in by the heat when it first scrolls into view (`heat.reveal`).
// Extra props (data-intro, data-reveal, ...) land on the link; `svgProps` on the <svg>.
import NextLink from "next/link";
import { useEffect, useRef, type ComponentProps, type SVGProps } from "react";
import { attachHeatLogo, type HeatLogo, type HeatLogoOptions } from "@/lib/mark/heat-logo";
import { motionOn } from "@/lib/motion/gsap";
import { wordmark } from "@/lib/mark/wordmark";

// Safari has no requestIdleCallback; there the build waits for the next task instead
const idleOK = () => typeof requestIdleCallback === "function";
const whenIdle = (fn: () => void) => (idleOK() ? requestIdleCallback(fn, { timeout: 3000 }) : window.setTimeout(fn, 200));
const cancelIdle = (id: number) => (idleOK() ? cancelIdleCallback(id) : window.clearTimeout(id));

type Props = ComponentProps<"a"> & {
  heat: HeatLogoOptions;
  svgProps?: SVGProps<SVGSVGElement> & Record<`data-${string}`, string>;
};

export function HeatMark({ heat, svgProps, ...link }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const { ink, bg, delay, autoplay, reveal } = heat;

  useEffect(() => {
    const el = ref.current!;
    let logo: HeatLogo | null = null, idle = 0;
    // the reveal only runs with the intro: reduced motion and ?still get the finished mark
    const attach = () => { logo = attachHeatLogo(el, { ink, bg, delay, autoplay, reveal: reveal && motionOn() }); };
    // Building the heat (a large shader, and five blurred copies of the mark made on the CPU) holds
    // the main thread for hundreds of ms, so it waits until the mark is within a screen of view and
    // the browser has a free moment. The footer's mark is built when you scroll down to it, not on load.
    const near = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      near.disconnect();
      idle = whenIdle(attach);
    }, { rootMargin: "100% 0px" });
    near.observe(el);
    return () => {
      near.disconnect();
      cancelIdle(idle);
      logo?.destroy();
    };
    // the colours are fixed per mark; reattaching on every render would rebuild the blur levels
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const svg = (
    <svg viewBox={`0 0 ${wordmark.width} ${wordmark.height}`} fillRule="evenodd" {...svgProps}>
      <path d={wordmark.path} />
    </svg>
  );
  // a page route navigates client-side, so the layout and its audio keep running
  const { href } = link;
  if (href?.startsWith("/"))
    return (
      <NextLink ref={ref} data-heat-reveal={reveal || undefined} {...link} href={href}>
        {svg}
      </NextLink>
    );
  return (
    <a ref={ref} data-heat-reveal={reveal || undefined} {...link}>
      {svg}
    </a>
  );
}
