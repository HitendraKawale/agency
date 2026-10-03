"use client";

import HalftoneInterfaceHero, { type HalftoneHeroLink } from "@/components/ui/halftone-interface-hero";
import { usePreferences } from "./preferences";

/** The hero in the page's own Mood: ink and ground swap with Settings. */
export default function HomeHero({ navigation }: { navigation: HalftoneHeroLink[] }) {
  const { appearance } = usePreferences();
  const dark = appearance === "dark";
  return (
    <HalftoneInterfaceHero
      navigation={navigation}
      background={dark ? "#05090A" : "#DFEAE8"}
      foreground={dark ? "#DFEAE8" : "#05090A"}
    />
  );
}
