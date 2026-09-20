import HalftoneInterfaceHero from "@/components/ui/halftone-interface-hero";

const NAV = [
  { label: "projects", href: "/projects" },
  { label: "about us", href: "/about" },
  { label: "blog", href: "/blog" },
  { label: "contact", href: "mailto:hello@aryank.space" },
];

export default function Home() {
  return (
    <main id="top" className="h-svh w-full overflow-hidden bg-white">
      <HalftoneInterfaceHero
        navigation={NAV}
        background="#FFFFFF"
        foreground="#111111"
      />
    </main>
  );
}
