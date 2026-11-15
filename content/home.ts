// Every word, link, logo and figure on the homepage. Sections only render this.
// The same data will feed the page's .md twin and llms.txt.

export const site = {
  name: "Blank Interfaces",
  email: "aryan@blankinterface.com",
  nav: [
    { label: "Projects", href: "#" },
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
  ],
  contact: { label: "Contact", href: "#" },
} as const;

/** A logo image. `aspect` is width / height; tiles size logos to equal area from it. */
type Logo = { src: string; alt: string; aspect: number };

export type HomeContent = {
  hero: {
    headline: string;
    line: string;
    actions: { label: string; href: string; variant: "primary" | "quiet" }[];
    car: { src: string; title: string };
  };
  trusted: {
    title: string;
    clients: (
      | ({ kind: "logo"; href: string; height?: number } & Logo)
      | { kind: "official"; variant: "goi" | "cid"; src: string; label: string; lines: string[] }
      | { kind: "organic"; href: string; src: string; label: string; lines: string[] }
    )[];
  };
  work: {
    title: string;
    projects: { name: string; href: string; logo: string; logoWidth: string; body: string; services: string; year: string }[];
  };
  studio: {
    title: string;
    statement: string;
    columns: [string, string];
    action: { label: string; href: string };
    reel: [ReelItem[], ReelItem[]];
  };
  why: {
    title: string;
    statement: string;
    legend: { loss: string; gain: string };
    chart: {
      label: string;
      gain: { title: string; range: [number, number] };
      loss: { title: string; range: [number, number] };
    };
    refs: { title: string; items: (Logo & { text: string })[] };
  };
  services: {
    title: string;
    statement: string;
    items: { title: string; body: string }[];
  };
  faq: {
    title: string;
    principles: { lead: string; not: string }[];
    items: { q: string; a: string }[];
  };
  contact: {
    title: string;
    lines: string[];
    clocks: { city: string; timeZone: string }[];
  };
  footer: { links: { label: string; href: string }[]; copyright: string };
};

export type ReelItem =
  | { kind: "image"; src: string; width: number; height: number; alt: string }
  | { kind: "video"; src: string; poster: string; width: number; height: number; alt: string };

const img = (name: string, width: number, height: number, alt: string): ReelItem =>
  ({ kind: "image", src: `/reel/${name}.webp`, width, height, alt });
const vid = (name: string, width: number, height: number, alt: string): ReelItem =>
  ({ kind: "video", src: `/reel/${name}.mp4`, poster: `/reel/${name}.jpg`, width, height, alt });

export const home = {
  hero: {
    headline: "A digital studio & branding powerhouse making cool shit that performs.",
    line: "Based in Mumbai and the UK, led by Aryan Kathawale and Hitendra Kawale.",
    actions: [
      { label: "Start a project", href: "#", variant: "primary" },
      { label: "See the work", href: "#", variant: "quiet" },
    ],
    car: { src: "/f1/heatcar.html", title: "Heat render of a Formula 1 car" },
  },

  trusted: {
    title: "Trusted by visionaries",
    clients: [
      // official marks with the name beside them: the State Emblem (Wikimedia, line engraving) and the
      // Mumbai Police badge (mumbaipolice.gov.in, white parts cut out so it stays one colour)
      { kind: "official", variant: "goi", src: "/logos/emblem-of-india.svg", label: "Government of India", lines: ["Government", "of India"] },
      { kind: "official", variant: "cid", src: "/logos/mumbai-police.png", label: "CID, Mumbai Police", lines: ["CID"] },
      { kind: "logo", href: "https://relay.manaslulabs.xyz/", src: "/logos/manaslu.webp", alt: "Manaslu Labs", aspect: 5.71 },
      { kind: "logo", href: "https://rainpulse-six.vercel.app/", src: "/logos/rainpulse.svg", alt: "Rainpulse", aspect: 8.56, height: 48 },
      { kind: "logo", href: "https://parflowengineering.com/", src: "/logos/parflow.svg", alt: "Parflow Engineering", aspect: 4.69 },
      { kind: "logo", href: "https://ralsonics-engineering.vercel.app/", src: "/logos/ralsonics.webp", alt: "Ralsonics", aspect: 3.72 },
      { kind: "logo", href: "https://moneybee-virid.vercel.app/", src: "/logos/moneybee.svg", alt: "Moneybee", aspect: 3.27 },
      { kind: "organic", href: "https://organic-market-eight.vercel.app/", src: "/logos/organic-symbol.svg", label: "Organic Foods", lines: ["organic", "foods"] },
    ],
  },

  work: {
    title: "Featured work",
    projects: [
      {
        name: "Relay, Manaslu Labs", href: "https://relay.manaslulabs.xyz/", logo: "/logos/manaslu.webp", logoWidth: "46%",
        body: "Research and the website for Relay, which keeps the fixes a coding agent's model makes and replays them without calling the model again.",
        services: "Research, Website", year: "2026",
      },
      {
        name: "Rainpulse", href: "https://rainpulse-six.vercel.app/", logo: "/logos/rainpulse.svg", logoWidth: "52%",
        body: "Research and the website for a two-person AI engineering firm in Osaka.",
        services: "Research, Website", year: "2026",
      },
      {
        name: "Parflow Engineering", href: "https://parflowengineering.com/", logo: "/logos/parflow.svg", logoWidth: "42%",
        body: "A WordPress theme rebuilt as a 92-product catalogue on Next.js. 99, 100, 100 and 100 on PageSpeed.",
        services: "Website", year: "2026",
      },
    ],
  },

  studio: {
    title: "Brand systems",
    statement: "In the era of infinite software, giving an idea a clear form is what sets it apart.",
    columns: [
      "Every brand starts with a strategy: the goals, the identity, the positioning and the way it speaks to its audience. It is the foundation for every decision that follows.",
      "We combine research, market knowledge and design, then carry the system into every touchpoint, so the brand reads as one finished whole.",
    ],
    action: { label: "See the work", href: "#" },
    reel: [
      [
        img("wall-posters", 720, 480, "Blank posters on a concrete wall"),
        img("label-heat", 720, 426, "The BI mark in heat"),
        img("laptop", 720, 540, "The Blank site on a laptop"),
        img("beanie", 720, 480, "Beanie with the BI label in heat"),
        vid("logo-motion", 720, 406, "The Blank logo animation"),
        img("poster-gods-image", 720, 1019, "Poster, Software made in God's image"),
        img("phone-rock", 720, 540, "The podcast player on a phone"),
      ],
      [
        img("display-cybertruck", 720, 540, "Poster in a frame, a truck in heat"),
        vid("ooh-metro", 720, 540, "Blank on a metro screen"),
        img("frames-three", 720, 540, "Three framed posters in sunlight"),
        img("poster-launch", 720, 1019, "Poster, Agency in the era of infinite software"),
        img("tote", 720, 958, "Tote bag with the BI mark"),
        img("bust-heat", 720, 720, "A bust in heat"),
        img("spreads", 720, 405, "Editorial spreads"),
        img("stage", 720, 480, "The Blank wordmark on a stage screen"),
      ],
    ],
  },

  // PLACEHOLDER FIGURES: dummy numbers in Symbol's style, not ours to quote until we have a measure
  why: {
    title: "Why it matters",
    statement: "Appealing to everyone feels like the safe choice. The brands that sell more stand apart and speak to one audience.",
    legend: {
      loss: "A brand that looks like its competitors can lose 20–30% of potential customers to the ones that stand apart.",
      gain: "Brands that differentiate and speak to a defined audience can see sales rise by 30–40%.",
    },
    chart: {
      label: "Increase in sales, plus 30 to 40 percent. Loss of customers, minus 20 to 30 percent.",
      gain: { title: "Increase in sales", range: [30, 40] },
      loss: { title: "Loss of customers", range: [20, 30] },
    },
    refs: {
      title: "It worked for",
      items: [
        { src: "/logos/ref-speedrun.svg", alt: "a16z Speedrun", aspect: 5.24, text: "a16z gave Speedrun a brand of its own, and founders now compete to get in." },
        { src: "/logos/ref-cloudflare.svg", alt: "Cloudflare", aspect: 3.03, text: "Cloudflare built its software for developers first, and developers carried it into their companies." },
        { src: "/logos/ref-mrbeast.png", alt: "MrBeast", aspect: 4.34, text: "MrBeast ships big videos fast, and fans buy Feastables to be part of it." },
        { src: "/logos/ref-wtf.svg", alt: "WTF by Nikhil Kamath", aspect: 1.9, text: "Nikhil Kamath turned a podcast into a community young founders want to join." },
      ],
    },
  },

  services: {
    title: "What we do",
    statement: "We design the interface, build the system under it, and wire in the AI.",
    items: [
      { title: "Websites", body: "We design the site, build it and launch it, so nothing is lost between the design file and the deploy." },
      { title: "Products", body: "We design the interface and build the backend and infrastructure under it, for production." },
      { title: "AI and answer engines", body: "We add LLM features and retrieval to the product, and write pages a model can quote without guessing." },
    ],
  },

  faq: {
    title: "FAQ",
    principles: [
      { lead: "Products,", not: "not papers." },
      { lead: "Founders,", not: "not followers." },
      { lead: "Tinkering,", not: "not training." },
      { lead: "Craft,", not: "not shortcuts." },
      { lead: "Curiosity,", not: "not convention." },
    ],
    items: [
      { q: "What is Blank Interfaces?", a: "Blank Interfaces is a digital studio and branding practice based in Mumbai and the UK, led by Aryan Kathawale and Hitendra Kawale. It gives a company the foundation it builds on: the brand, the website, the product and the systems under them, designed and built by one team." },
      { q: "What does Blank do?", a: "Brand identity, websites, product design and engineering, and AI features. Engagements range from a full identity system to a production web app with its backend and infrastructure, and every site ships with pages that answer engines and AI agents can read." },
      { q: "What makes Blank different from other studios?", a: "Brand and engineering sit in the same team. The people who design the identity also build the product and the infrastructure it runs on, so nothing is lost in a handoff and the brand holds up inside the product, not only on the launch page." },
      { q: "How does Blank use AI?", a: "Blank uses AI to explore more directions and build faster, then holds the result to the same bar as work made by hand. Every mark, layout and line of code is reviewed and finished by the team before it reaches a client." },
      { q: "Is work made with AI original?", a: "Yes. Each identity starts from the client's brief, research and audience, not from a model's average of existing brands. Final marks are drawn by the team and checked against existing marks before delivery." },
      { q: "Does Blank build to SOC 2 and security standards?", a: "Blank builds software to the controls a SOC 2 audit looks for: access control, encryption in transit and at rest, audit logging and reviewed changes. A client's own audit starts with the evidence already in place." },
      { q: "What does working with Blank look like?", a: "A project starts with a working session on goals, audience and constraints. It then moves through strategy, identity, design and build, with the same people throughout and a timeline agreed at the start." },
      { q: "I only need a website. Can Blank help?", a: "Yes, and many projects start there. Blank designs the site from the brand outward, so if the identity needs work, that shows up early rather than after launch." },
      { q: "I already have a logo. Do I need a rebrand?", a: "Not necessarily. If the mark works, Blank keeps it and builds the system around it: colour, type, imagery and the rules that carry it across every touchpoint." },
      { q: "Who does Blank work with?", a: "Founders and the companies they build: AI startups, engineering and industrial firms, investment management, food retail and government. Clients include Manaslu Labs, Rainpulse, Parflow Engineering, Ralsonics, Moneybee and Organic Foods." },
      { q: "Where is Blank based?", a: "Mumbai and the UK, with clients in India and Japan. The studio works across time zones and runs projects remotely." },
      { q: "How do I start a project?", a: "Email aryan@blankinterface.com with what you are building and where it needs to go, or use Start a project at the top of this page." },
    ],
  },

  contact: {
    title: "Contact",
    lines: ["Tell us what", "you're building."],
    clocks: [
      { city: "Mumbai", timeZone: "Asia/Kolkata" },
      { city: "United Kingdom", timeZone: "Europe/London" },
    ],
  },

  footer: {
    links: [...site.nav, site.contact, { label: "llms.txt", href: "#" }],
    copyright: "© 2026 Blank Interfaces",
  },
} as const satisfies DeepReadonly<HomeContent>;

type DeepReadonly<T> = T extends readonly (infer R)[]
  ? readonly DeepReadonly<R>[]
  : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
