import type { Metadata } from "next";
import { RequestForm } from "@/components/contact/request-form";
import { Footer } from "@/components/sections/footer";
import { Nav } from "@/components/sections/nav";

export const metadata: Metadata = {
  title: "Request a project · Blank Interfaces",
  description: "Tell us who you are and what you'd like built. We write back within a day.",
};

// The nav, the one-line-at-a-time request form, the footer. No Contact section: this is it.
export default function ContactPage() {
  return (
    <div className="page">
      <Nav />
      <RequestForm />
      <Footer />
    </div>
  );
}
