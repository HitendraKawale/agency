// Every word on /people. basement's People page (basement.studio/people) for our crew: the
// intro, the CRT wall of our work (components/people/wall.tsx), three values with a picture
// each, the team list beside a picture per person, joining.
//
// Pictures are photos the team will send: portraits for the crew grid, the studio for the values
// and joining (shown in black and white, as basement does). A Picture without `src` renders as an
// empty well at basement's size for that slot, so the layout holds until they arrive.

export type Picture = { src?: string; width: number; height: number; alt: string };

export type Person = {
  name: string;
  role: string;
  /** the discipline the list groups them under, as basement groups by department */
  group: string;
  links: { label: string; href: string }[];
  picture: Picture;
};

export type PeopleContent = {
  intro: { title: string; text: [string, string] };
  values: { title: string; items: { title: string; text: string; picture: Picture }[] };
  crew: { title: string; join: string; people: Person[] };
  join: { text: string; pictures: [Picture, Picture] };
};

const well = (width: number, height: number, alt: string): Picture => ({ width, height, alt });

export const people = {
  intro: {
    title: "People",
    text: [
      "Blank is its people, and the people who trust it. We take brands onto surfaces they never thought they could reach, with an artist's eye and an engineer's hands, and give them the image they deserve in 2027.",
      "We push technology to its extreme to meet you where you want to see yourself. In a post-agentic era your vision and your business both need rethinking, and that is where we take you.",
    ],
  },
  values: {
    title: "Our values",
    items: [
      {
        title: "Work first, questions later",
        text: "We start building on day one and show you something real before the brief is even finished. It's why 98% of the people who trust Blank come back for more work.",
        picture: well(461, 461, ""),
      },
      {
        title: "Art, engineered",
        text: "Every idea is drawn and built by the same people. Nothing beautiful gets cut because it was hard to ship, and nothing ships until it holds up.",
        picture: well(461, 461, ""),
      },
      {
        title: "The best tools in the industry",
        text: "We work with the strongest stacks and tools there are, so what we ship is something people are proud to use, on every surface it reaches.",
        picture: well(461, 461, ""),
      },
    ],
  },
  crew: {
    title: "The Crew",
    join: "Join the Crew",
    // A-Z by first name, as basement sorts theirs
    people: [
      {
        name: "Aryan Kathawale",
        role: "Founder, Design and Engineering",
        group: "Design and Engineering",
        links: [
          { label: "Site", href: "https://tldr.aryank.space" },
          { label: "GitHub", href: "https://github.com/kiritocode1" },
        ],
        picture: { src: "/people/crew/aryan.webp", width: 596, height: 684, alt: "Aryan Kathawale" },
      },
      {
        name: "Hitendra Kawale",
        role: "Machine Learning Engineer and AI Specialist",
        group: "Machine Learning and AI",
        links: [
          { label: "Site", href: "https://hitendra.dev" },
          { label: "GitHub", href: "https://github.com/HitendraKawale" },
          { label: "LinkedIn", href: "https://linkedin.com/in/hitendra-kawale" },
        ],
        picture: { src: "/people/crew/hitendra.webp", width: 596, height: 684, alt: "Hitendra Kawale" },
      },
      {
        name: "Mayank Kudu",
        role: "Frontend Engineer",
        group: "Design and Engineering",
        links: [{ label: "Site", href: "https://maynkudu.com" }],
        picture: { src: "/people/crew/mayank.webp", width: 596, height: 684, alt: "Mayank Kudu" },
      },
      {
        name: "Siddhi Donode",
        role: "Chief Marketing Officer",
        group: "Marketing",
        links: [{ label: "Site", href: "https://casti71.com" }],
        picture: { src: "/people/crew/siddhi.webp", width: 596, height: 684, alt: "Siddhi Donode" },
      },
    ],
  },
  join: {
    text: "If you want to take technology to its extreme with us, send us something you've made. We read every message, even when no role is listed.",
    pictures: [well(461, 624, ""), well(461, 750, "")],
  },
} satisfies PeopleContent;
