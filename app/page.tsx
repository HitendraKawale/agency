import { Contact } from "@/components/sections/contact";
import { Faq } from "@/components/sections/faq";
import { Footer } from "@/components/sections/footer";
import { Hero } from "@/components/sections/hero";
import { Services } from "@/components/sections/services";
import { Studio } from "@/components/sections/studio";
import { Trusted } from "@/components/sections/trusted";
import { Why } from "@/components/sections/why";
import { Work } from "@/components/sections/work";

export default function Home() {
  return (
    <div className="page">
      <Hero />
      <Trusted />
      <Work />
      <Studio />
      <Why />
      <Services />
      <Faq />
      <Contact />
      <Footer />
    </div>
  );
}
