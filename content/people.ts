// Every word on /people. basement's People page (basement.studio/people) for three people: the
// intro, the CRT wall of our work (components/people/wall.tsx), three values with a picture
// each, the team list beside a picture per person, joining, open positions.
//
// Pictures are not made yet (computers and desks, to come). A Picture without `src` renders as an
// empty well at the shape the image will take, so the layout holds while they are made.

export type Picture = { src?: string; width: number; height: number; alt: string };

export type Person = {
  name: string;
  role: string;
  links: { label: string; href: string }[];
  picture: Picture;
};

export type Position = { role: string; type: string; location: string; open: boolean };

export type PeopleContent = {
  intro: { title: string; text: [string, string] };
  values: { title: string; items: { title: string; text: string; picture: Picture }[] };
  crew: { title: string; people: Person[] };
  join: { text: string; pictures: [Picture, Picture] };
  positions: { title: string; columns: [string, string, string]; items: Position[] };
};

const well = (width: number, height: number, alt: string): Picture => ({ width, height, alt });

export const people = {
  intro: {
    title: "People",
    text: [
      "Blank is a studio of three, working across websites, brand identity, real-time 3D and AI. Every project is led by the people who do the work, from the first conversation to launch.",
      "Aryan Kathawale leads design and engineering. Hitendra Kawale leads machine learning and AI. Siddhi Donode leads marketing and communications.",
    ],
  },
  values: {
    title: "Our values",
    items: [
      {
        title: "Speed with accuracy",
        text: "We share working versions early and refine them against the goals agreed at the start. Moving quickly only matters when the result holds up in review, in testing and in use.",
        picture: well(462, 470, ""),
      },
      {
        title: "Design and engineering together",
        text: "The same team designs and builds every project. Layout, motion and performance are decided together, so what launches is what was approved.",
        picture: well(462, 470, ""),
      },
      {
        title: "Built for people and agents",
        text: "Websites are now read by people and by the AI assistants they ask for recommendations. We structure every site for both, with clean markup, a markdown version of each page and an llms.txt file.",
        picture: well(462, 470, ""),
      },
    ],
  },
  crew: {
    title: "The team",
    // A-Z by first name, as basement sorts theirs
    people: [
      {
        name: "Aryan Kathawale",
        role: "Founder, Design and Engineering",
        links: [
          { label: "Site", href: "https://tldr.aryank.space" },
          { label: "GitHub", href: "https://github.com/kiritocode1" },
        ],
        picture: well(400, 500, "Aryan's computer"),
      },
      {
        name: "Hitendra Kawale",
        role: "Machine Learning Engineer and AI Specialist",
        links: [],
        picture: well(400, 500, "Hitendra's computer"),
      },
      {
        name: "Siddhi Donode",
        role: "Chief Marketing Officer",
        links: [],
        picture: well(400, 500, "Siddhi's computer"),
      },
    ],
  },
  join: {
    text: "We are always glad to hear from designers, engineers and marketers who care about detail. Send us your work, even when no role is listed.",
    pictures: [well(462, 400, ""), well(462, 600, "")],
  },
  positions: {
    title: "Open positions",
    columns: ["Role", "Type", "Location"],
    items: [
      { role: "Creative Developer", type: "Development", location: "Remote", open: false },
      { role: "3D Artist", type: "Design", location: "Remote", open: false },
      { role: "Brand Designer", type: "Design", location: "Remote", open: false },
    ],
  },
} satisfies PeopleContent;
