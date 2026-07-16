import HalftoneInterfaceHero from "@/components/ui/halftone-interface-hero";
import {
  AboutSection,
  ContactSection,
  InterfacesSection,
  PeopleSection,
  SiteFooter,
} from "@/components/agency/sections";

const NAVIGATION = [
  { label: "work", href: "#interfaces" },
  { label: "people", href: "#people" },
  { label: "about", href: "#about" },
  { label: "contact", href: "#contact" },
];

const UTILITY_LINKS = [
  { label: "arth", href: "https://www.arthtechnologies.com/" },
  { label: "follow", href: "https://x.com/blank_spacets" },
];

export default function Home() {
  return (
    <main
      id="top"
      className="min-h-full"
      style={{ backgroundColor: "var(--bg)", color: "var(--fg)" }}
    >
      <div
        className="h-[100svh] w-full overflow-hidden"
        style={{ backgroundColor: "#151515" }}
      >
        <HalftoneInterfaceHero
          headline={["blank", "interfaces"]}
          brand={["blank", "interfaces"]}
          navigation={NAVIGATION}
          utilityLinks={UTILITY_LINKS}
          footerLabel="© 2026 blank interfaces"
          locationLabel="ldn / bom"
          timeZone="Europe/London"
          background="#151515"
          foreground="#ffffff"
          accentColors={["#ff266c", "#1cffaf", "#5848ff"]}
        />
      </div>

      <AboutSection />
      <InterfacesSection />
      <PeopleSection />
      <ContactSection />
      <SiteFooter />
    </main>
  );
}
