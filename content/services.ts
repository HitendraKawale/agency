// Every word and image on /services. Symbol's services page (symbolstudio.pl/en/services) in our
// look: a centred statement, then one section per service with its scope, the question it answers,
// the reasoning and a run of three images (one large, two small).
import type { ReelItem } from "@/content/home";

/** a reel item, optionally framed off-centre where the tile crops it */
type RunItem = ReelItem & { position?: string };

export type Service = {
  /** anchor for the index, /services#id */
  id: string;
  title: string;
  scope: string[];
  question: string;
  text: string[];
  run: [RunItem, RunItem, RunItem];
};

export type ServicesContent = {
  head: { title: string; line: string };
  services: Service[];
};

const img = (name: string, width: number, height: number, alt: string, position?: string): RunItem =>
  ({ kind: "image", src: `/reel/${name}.webp`, width, height, alt, position });
const vid = (name: string, width: number, height: number, alt: string): RunItem =>
  ({ kind: "video", src: `/reel/${name}.mp4`, poster: `/reel/${name}.jpg`, width, height, alt });

export const services = {
  head: {
    title: "We design and build websites, brands and real-time 3D.",
    line: "For the people who use them and the agents that read them. Two founders, in Mumbai and the UK, do the work from the first call to launch.",
  },
  services: [
    {
      id: "websites",
      title: "Websites & products",
      scope: ["Audit of the current site", "Structure and content", "Design and prototypes", "Next.js build", "CMS and integrations", "Performance and SEO", "llms.txt and markdown pages for agents"],
      question: "How many buyers left while your site was still loading?",
      text: [
        "We design the site and write the code ourselves, so nothing gets lost between a design file and someone else's guess at it. Every page is built on Next.js and measured on PageSpeed before launch, and it can be served as markdown too, so the agents people now ask for recommendations can read it.",
        "Parflow Engineering came to us with a WordPress theme. We rebuilt it as a 92-product catalogue that scores 99 for performance and 100 for accessibility, best practices and SEO.",
      ],
      // no website in this run yet: the laptop mockup is never used (see memory), a new visual is due
      run: [
        img("phone-rock", 720, 540, "The podcast player on a phone"),
        img("label-heat", 720, 426, "The BI mark in heat"),
        vid("logo-motion", 720, 406, "The Blank logo animation"),
      ],
    },
    {
      id: "brand",
      title: "Brand identity",
      scope: ["Positioning", "Logo and wordmark", "Typography and colour", "Motion", "Guidelines", "Print and merch"],
      question: "How many people scrolled past because you looked like everyone else in your category?",
      text: [
        "A brand is a set of decisions: what you stand for, how you sound and what someone sees first. We make those decisions with you, then draw the mark, choose the type and colour, set the motion and write the rules, so anyone on your team can use them.",
        "Our own identity is the example. The posters, the merch, the films and this site all come out of one system.",
      ],
      run: [
        img("wall-posters", 720, 480, "Blank posters on a concrete wall"),
        img("tote", 720, 958, "Tote bag with the BI mark", "center 30%"),
        img("beanie", 720, 480, "Beanie with the BI label in heat"),
      ],
    },
    {
      id: "3d",
      title: "3D & real-time web",
      scope: ["3D modelling", "Shaders and effects", "WebGL and React Three Fiber", "Scroll and interaction", "Mobile performance"],
      question: "How much of your product does a flat screenshot leave out?",
      text: [
        "Some things are easier to understand when you can move around them. We model them, write the shaders and put them in the browser, tuned to run on phones as well as desktops. Every scene has a still frame for devices that can't run it and for people who turn motion off.",
        "The heat car at the top of our homepage is one of these, rendered live in the page.",
      ],
      run: [
        img("bust-heat", 720, 720, "A bust in heat", "center 20%"),
        img("display-cybertruck", 720, 540, "Poster in a frame, a truck in heat"),
        { kind: "image", src: "/services/heatcar.webp", width: 1200, height: 724, alt: "The heat car from our homepage", position: "60% center" },
      ],
    },
    {
      id: "campaigns",
      title: "Campaigns",
      scope: ["Launch campaigns", "Posters and out-of-home", "Motion and video", "Social assets", "Stage and event graphics"],
      question: "How many launches were forgotten by the following week?",
      text: [
        "A launch is seen once on a phone, once on a wall and once on a screen at an event. We make the posters, out-of-home, films and social from the same brand system, so each one is recognisable before anyone reads it.",
      ],
      run: [
        vid("ooh-metro", 720, 540, "Blank on a metro screen"),
        img("stage", 720, 480, "The Blank wordmark on a stage screen"),
        img("poster-launch", 720, 1019, "Poster, Agency in the era of infinite software", "center 75%"),
      ],
    },
    {
      id: "research",
      title: "Research",
      scope: ["Product and market study", "Competitor sites", "Positioning", "Messaging", "Page structure"],
      question: "How many pages were designed before anyone wrote down what they had to prove?",
      text: [
        "Before we design anything, we read the market, the competitors and the product, and write down the questions a buyer needs answered before they get in touch. Every section of the site then has one of those questions to answer.",
        "For Relay, which keeps the fixes a coding agent's model makes and replays them, and for Rainpulse, an AI engineering firm in Osaka, the research came before the first page.",
      ],
      run: [
        img("spreads", 720, 405, "Editorial spreads"),
        img("poster-gods-image", 720, 1019, "Poster, Software made in God's image", "center 46%"),
        img("frames-three", 720, 540, "Three framed posters in sunlight"),
      ],
    },
  ],
} satisfies ServicesContent;
