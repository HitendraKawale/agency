import HalftoneInterfaceHero from "@/components/ui/halftone-interface-hero";

const NAV = [{ label: "projects", href: "/projects" }];

const UTILITY = [
  { label: "follow on x.", href: "https://x.com/blank_spacets" },
];

export default function Home() {
  return (
    <main id="top" className="h-svh w-full overflow-hidden bg-[#e2e1d9]">
      <HalftoneInterfaceHero
        navigation={NAV}
        utilityLinks={UTILITY}
        background="#e2e1d9"
        foreground="#111111"
      />
    </main>
  );
}
