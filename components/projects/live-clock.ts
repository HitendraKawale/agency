import { useSyncExternalStore } from "react";

/**
 * Live clock, ported from reference/lebedev/js/cest-times.js: en-GB
 * hour/minute/second with hour12:false, re-rendered by
 * setTimeout(1000 - Date.now() % 1000) so it flips on the second, stopped
 * while the tab is hidden. Unlike theirs, the zone label is computed
 * (timeZoneName: "short" in en-IN, which gives IST) instead of hard-coded.
 */

const TIME_ZONE = "Asia/Kolkata";

const clockFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const zoneFormat = new Intl.DateTimeFormat("en-IN", {
  timeZone: TIME_ZONE,
  timeZoneName: "short",
});

/** "HH:MM:SS|ZONE", a primitive so the store snapshot is stable within a second. */
function read() {
  const date = new Date();
  const parts = { h: "00", m: "00", s: "00" };
  for (const part of clockFormat.formatToParts(date)) {
    if (part.type === "hour") parts.h = part.value;
    if (part.type === "minute") parts.m = part.value;
    if (part.type === "second") parts.s = part.value;
  }
  const zone = zoneFormat.formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? "";
  return `${parts.h}:${parts.m}:${parts.s}|${zone}`;
}

function subscribe(onChange: () => void) {
  let timer: number | undefined;

  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      onChange();
      schedule();
    }, 1000 - (Date.now() % 1000));
  };

  const onVisibility = () => {
    if (document.hidden) {
      window.clearTimeout(timer);
      timer = undefined;
    } else {
      onChange();
      schedule();
    }
  };

  schedule();
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

/** `{ time, zone }`; both empty strings on the server and during hydration. */
export function useStudioClock() {
  const snapshot = useSyncExternalStore(subscribe, read, () => "|");
  const [time = "", zone = ""] = snapshot.split("|");
  return { time, zone };
}
