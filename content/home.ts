// Every word, link, logo and figure on the homepage. Sections only render this.
// The same data will feed the page's .md twin and llms.txt.

export const site = {
  name: "Blank Interfaces",
  email: "aryan@blankinterface.com",
  // basement's nav, in their order
  nav: [
    { label: "Home", href: "/" },
    { label: "Services", href: "#" },
    { label: "Showcase", href: "#" },
    { label: "People", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Lab", href: "#" },
  ],
  contact: { label: "Contact Us", href: "#" },
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
  stack: {
    title: string;
    statement: string;
    /** platform marks, 24 x 24 SVG paths, bottom layer first */
    marks: { name: string; path: string }[];
  };
  faq: {
    title: string;
    principles: { lead: string; not: string }[];
    /** `link` follows the answer, for a question a page answers in full */
    items: { q: string; a: string; link?: { label: string; href: string } }[];
    /** the last row: a question the visitor writes, answered by the model behind realtime/ask.ts */
    ask: { placeholder: string; label: string; errors: { limit: string; down: string } };
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

  stack: {
    title: "Our stack",
    statement: "We build any kind of software, for every platform it has to run on.",
    // Android, Chrome and Apple from Simple Icons (CC0). Simple Icons dropped Windows, so it is the
    // Windows 11 mark drawn out: four 11.4 squares on the 24 grid.
    marks: [
      { name: "Android", path: "M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z" },
      { name: "Web", path: "M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z" },
      { name: "Windows", path: "M0 0h11.4v11.4H0zM12.6 0H24v11.4H12.6zM0 12.6h11.4V24H0zM12.6 12.6H24V24H12.6z" },
      { name: "Apple", path: "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" },
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
      {
        q: "What does Blank offer?",
        a: "Website design and development, visual brand identity, 3D interactive experiences, marketing campaigns and product engineering. Engagements range from a full brand identity system to a high-performance marketing website or a real-time 3D experience on the web. Clients come for speed and accuracy: the studio moves fast and keeps refining until the work is right.",
      },
      {
        q: "How does a project with Blank run?",
        a: "It starts with a working session on goals, audience and constraints, where the timeline is agreed. Then it moves through strategy, identity, design and build, with the same people from the first session to launch.",
        link: { label: "See the process", href: "/process" },
      },
      {
        q: "What is Blank known for?",
        a: "Award-winning marketing sites and real-time 3D experiences on the web. Design and engineering sit in the same team, which takes a brand from visual identity through production web engineering, including real-time 3D, animation and typeface design. The backend is held to national-infrastructure standards: Blank engineers government portals across India, used by tens of thousands of inspectors and by senior officers at agencies including the CID.",
      },
    ],
    ask: {
      placeholder: "Ask anything",
      label: "Ask a question about Blank",
      errors: {
        limit: "That's six questions in a minute. Give it a moment, then ask again.",
        down: `We can't answer right now. Write to us at ${site.email}.`,
      },
    },
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
    // not the nav again. MACHINE will be the agent-readable view (llms.txt and a .md for each page)
    links: [
      { label: "About", href: "#" },
      { label: "Manifesto", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "MACHINE", href: "#" },
    ],
    copyright: "© 2026 Blank Interfaces",
  },
} as const satisfies DeepReadonly<HomeContent>;

type DeepReadonly<T> = T extends readonly (infer R)[]
  ? readonly DeepReadonly<R>[]
  : T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
