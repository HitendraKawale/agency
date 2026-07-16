"use client";

/**
 * TeamReveal — mounts the ASCII image reveal gallery once it scrolls into
 * view, so the glyph decode plays while the visitor is actually watching.
 */

import AsciiImageReveal from "@/components/ui/ascii-image-reveal";
import { useEffect, useRef, useState } from "react";

const TEAM_IMAGES = ["/team/aryan.png", "/team/hitendra.png"];

export default function TeamReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="team-reveal">
      {inView && (
        <AsciiImageReveal
          images={TEAM_IMAGES}
          altPrefix="blank interfaces founder"
          aspectWidth={1}
          aspectHeight={1}
          background="#000"
          canvasBackground="#000"
          gap="2rem"
          embedded
        />
      )}
    </div>
  );
}
