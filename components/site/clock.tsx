"use client";

import { useEffect, useState } from "react";

const ZONES = [
  { label: "MUM", timeZone: "Asia/Kolkata" },
  { label: "LDN", timeZone: "Europe/London" },
] as const;

function format(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

/** Aino's loctime: both studio clocks, ticking. Blank until mounted. */
export default function StudioClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      {ZONES.map((zone) => (
        <span key={zone.label} className="label">
          {zone.label} <span suppressHydrationWarning>{now ? format(now, zone.timeZone) : "--:--:--"}</span>
        </span>
      ))}
    </>
  );
}
