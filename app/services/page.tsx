import type { Metadata } from "next";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Nav } from "@/components/sections/nav";
import { ServicesHead, ServicesList, ServicesRoom } from "@/components/services";
import { services } from "@/content/services";
import s from "@/components/services/services.module.css";

export const metadata: Metadata = {
  title: "Services · Blank Interfaces",
  description: services.head.title,
};

export default function ServicesPage() {
  return (
    <div className="page">
      <ServicesRoom />
      <Nav current="Services" />
      {/* everything below the scene scrolls up over it */}
      <div className={s.sheet}>
        <ServicesHead />
        <ServicesList />
        <Contact />
        <Footer />
      </div>
    </div>
  );
}
