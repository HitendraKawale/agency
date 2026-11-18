import type { Metadata } from "next";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Nav } from "@/components/sections/nav";
import { ServicesHead, ServicesList } from "@/components/services";
import { services } from "@/content/services";

export const metadata: Metadata = {
  title: "Services · Blank Interfaces",
  description: services.head.title,
};

export default function ServicesPage() {
  return (
    <div className="page">
      <Nav current="Services" />
      <ServicesHead />
      <ServicesList />
      <Contact />
      <Footer />
    </div>
  );
}
