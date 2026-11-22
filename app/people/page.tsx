import type { Metadata } from "next";
import { Contact } from "@/components/sections/contact";
import { Footer } from "@/components/sections/footer";
import { Nav } from "@/components/sections/nav";
import { PeopleCrew, PeopleIntro, PeopleJoin, PeoplePositions, PeopleValues, PeopleWall } from "@/components/people";
import { people } from "@/content/people";
import s from "@/components/people/people.module.css";

export const metadata: Metadata = {
  title: "People · Blank Interfaces",
  description: people.intro.text[0],
};

// Two page columns with the CRT wall between them, so the wall can run to both window edges.
export default function PeoplePage() {
  return (
    <>
      <div className="page">
        <Nav current="People" />
        <PeopleIntro />
      </div>
      <PeopleWall />
      <div className={`page ${s.after}`}>
        <PeopleValues />
        <PeopleCrew />
        <PeopleJoin />
        <PeoplePositions />
        <Contact />
        <Footer />
      </div>
    </>
  );
}
