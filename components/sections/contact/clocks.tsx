"use client";

// Local time in each city, refreshed every 10 s. Empty on the server, so the markup never disagrees
// with the viewer's clock during hydration.
import { useEffect, useState } from "react";

type Clock = { city: string; timeZone: string };

const format = (timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }).format(new Date());

export function Clocks({ clocks, className }: { clocks: readonly Clock[]; className?: string }) {
  const [times, setTimes] = useState<string[]>([]);

  useEffect(() => {
    const tick = () => setTimes(clocks.map((c) => format(c.timeZone)));
    const first = requestAnimationFrame(tick);
    const id = window.setInterval(tick, 10_000);
    return () => {
      cancelAnimationFrame(first);
      clearInterval(id);
    };
  }, [clocks]);

  return (
    <p className={className} data-reveal="fade">
      {clocks.map((c, i) => (
        <span key={c.city}>
          {c.city}
          <b>{times[i] ?? ""}</b>
        </span>
      ))}
    </p>
  );
}
