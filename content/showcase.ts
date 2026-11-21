// Every project on /showcase and its case study at /showcase/<slug>. The grid, the rows and the case
// pages only render this; the nav's count reads its length.
// Tiles are basement's kind: one 1920x1080 image of the client's mark on the client's own ground
// (public/showcase/tiles, rendered from .plannotator/works/proof/tiles-render.html). A montage is the
// clip a tile plays on hover (.plannotator/works/montage, rendered by render.sh). Run frames come from
// the clients' live sites (.plannotator/works/assets.py).

export const categories = ["Websites", "Brand identity", "Research", "Apps", "Government"] as const;
export type Category = (typeof categories)[number];

/** One frame in a case study's run. basement's rhythm: two half frames, then one full, all 16:9. */
export type Frame =
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; poster: string; alt: string; fit?: "contain" }
  | { kind: "palette"; colors: readonly string[] };

export type Project = {
  name: string;
  slug: string;
  categories: readonly Category[];
  year: number;
  /** the live site; none for work we can't show or haven't launched */
  site?: { href: string; label: string };
  /** the clip a tile plays on hover; tiles without one keep basement's pulse */
  montage?: string;
  /** not out yet: the tile says "Coming soon" and there is no case study */
  soon?: true;
  /** the case study's paragraphs, about 100 words in all */
  story: readonly string[];
  run: readonly Frame[];
};

const tile = (slug: string, name: string): Frame => ({ kind: "image", src: `/showcase/tiles/${slug}.webp`, alt: `${name} mark` });
const shot = (slug: string, file: string, alt: string): Frame => ({ kind: "image", src: `/showcase/${slug}/${file}.webp`, alt });
const montage = (slug: string, name: string): Frame => ({ kind: "video", src: `/showcase/${slug}/montage.mp4`, poster: `/showcase/tiles/${slug}.webp`, alt: `${name}, the brand and site in motion` });

export const showcase = {
  title: "Showcase",
  projects: [
    {
      name: "Parflow Engineering",
      slug: "parflow",
      categories: ["Websites", "Brand identity"],
      year: 2026,
      site: { href: "https://parflowengineering.com/", label: "parflowengineering.com" },
      montage: "/showcase/parflow/montage.mp4",
      story: [
        "Parflow makes tube fittings, valves and manifolds in Mumbai for oil and gas, refining, power and chemical plants. Their website ran on a WordPress theme.",
        "We revamped how the brand shows up on the web and rebuilt the site on Next.js 16, with all 92 products in one catalogue an engineer can search. It went live on 30 July 2026.",
      ],
      run: [
        tile("parflow", "Parflow"),
        { kind: "palette", colors: ["#0b5cff", "#17181a", "#f2f3f4", "#ffffff"] },
        montage("parflow", "Parflow"),
        shot("parflow", "products", "Parflow's products section, needle valves in a row"),
        shot("parflow", "vision", "The world's critical flows run on Parflow"),
        shot("parflow", "hero", "Parflow's home page, precision flow control solutions"),
        shot("parflow", "ratings", "What the range is rated for, 10,000 psi and -196 °C"),
        shot("parflow", "insights", "Parflow's blogs and case studies"),
        shot("parflow", "industries", "The industries Parflow supplies"),
      ],
    },
    {
      name: "Organic Foods",
      slug: "organic",
      categories: ["Brand identity", "Websites"],
      year: 2026,
      site: { href: "https://organic-market-eight.vercel.app/", label: "organic-market-eight.vercel.app" },
      montage: "/showcase/organic/montage.mp4",
      story: [
        "Organic Foods sells eggs. When they came to us there was no brand yet, so we made all of it, starting from the first idea.",
        "The egg mark, the green and the cream, the kraft carton with its green band, and a site that follows one egg from the box to the breakfast plate.",
      ],
      run: [
        tile("organic", "Organic Foods"),
        { kind: "palette", colors: ["#20472e", "#788457", "#f4f0df", "#dfb94f"] },
        montage("organic", "Organic Foods"),
        shot("organic", "hero", "Eggs worth waking up for, the Organic Foods home page"),
        shot("organic", "box", "A good egg. In every sense. The carton, closed"),
        shot("organic", "grade", "The top grade an egg can get, the carton open"),
        shot("organic", "candling", "Checked inside, without a crack, an egg held to the light"),
        shot("organic", "table", "How an egg earns AA, the grade table"),
        shot("organic", "breakfast", "From this box. To your breakfast."),
        shot("organic", "closing", "Here's to good mornings"),
      ],
    },
    {
      name: "Relay, Manaslu Labs",
      slug: "relay",
      categories: ["Research", "Brand identity", "Websites"],
      year: 2026,
      site: { href: "https://relay.manaslulabs.xyz/", label: "relay.manaslulabs.xyz" },
      montage: "/showcase/relay/montage.mp4",
      story: [
        "Every coding agent pays its model to rediscover fixes it has already made. Relay, from Manaslu Labs, remembers each fix once and replays it, verified.",
        "The product asked for an 8-bit look. So the brand is built from pixels: the fields that drift across the page, the small creatures, the type and the diagrams.",
      ],
      run: [
        tile("relay", "Relay"),
        { kind: "palette", colors: ["#f3f2ef", "#ff6a2b", "#ffb08a", "#c2410c", "#1f1a17"] },
        montage("relay", "Relay"),
        shot("relay", "hero", "Fix it once. Never twice. The Relay home page"),
        shot("relay", "memory", "Not a cache. A memory for fixes."),
        shot("relay", "models", "Models are brilliant. They just don't remember."),
        shot("relay", "watch", "Watch. Learn. Transfer. Verify."),
        shot("relay", "bugs", "Same 26 bugs, 77% less spend"),
        shot("relay", "api", "One API. Every format your agent speaks."),
        shot("relay", "waitlist", "The waitlist, set in pixels"),
      ],
    },
    {
      name: "Moneybee",
      slug: "moneybee",
      categories: ["Websites", "Brand identity"],
      year: 2026,
      site: { href: "https://moneybee.in/", label: "moneybee.in" },
      montage: "/showcase/moneybee/montage.mp4",
      story: [
        "Moneybee is a SEBI-registered portfolio manager. They back small Indian companies, and invest only after meeting the management and visiting the plants.",
        "They loved the brand Six of Us made for them, so we didn't replace it. We kept the bee, the hive and the orange, and built the new site inside that brand.",
      ],
      run: [
        tile("moneybee", "Moneybee"),
        { kind: "palette", colors: ["#f6a11a", "#000000", "#f6f6f6", "#ffffff"] },
        montage("moneybee", "Moneybee"),
        shot("moneybee", "hero", "Fund the next version of India, the Moneybee home page"),
        shot("moneybee", "compounding", "Compounding, Rs. 10 lakh in 2007 against the index"),
        shot("moneybee", "two-ways", "Two ways to invest with Moneybee"),
        shot("moneybee", "returns", "Returns by year, drawn as hives"),
        shot("moneybee", "ranked", "Ranked among India's top-performing portfolio managers"),
        shot("moneybee", "footer", "Know Venture. Know Gain."),
      ],
    },
    {
      name: "Rainpulse",
      slug: "rainpulse",
      categories: ["Research", "Brand identity", "Websites"],
      year: 2026,
      site: { href: "https://rainpulse-six.vercel.app/", label: "rainpulse-six.vercel.app" },
      montage: "/showcase/rainpulse/montage.mp4",
      story: [
        "Rainpulse is two engineers in Osaka who take AI and software from an unsettled idea to a system in daily use. Their work starts as research.",
        "We gave that research new colours. The dot fields, the figures for each service and the site around them all come from one set.",
      ],
      run: [
        tile("rainpulse", "Rainpulse"),
        { kind: "palette", colors: ["#2f55e4", "#1fa463", "#f2b807", "#f06a1d", "#d7261e"] },
        montage("rainpulse", "Rainpulse"),
        shot("rainpulse", "hero", "A two-person engineering firm in Osaka, the Rainpulse home page"),
        shot("rainpulse", "services", "Rainpulse's three services, each with its own figure"),
        shot("rainpulse", "ecri", "ecri, a Rainpulse project"),
        shot("rainpulse", "ecri-devices", "ecri on a laptop and a tablet"),
        shot("rainpulse", "work", "Rainpulse's work, drawn in dots"),
      ],
    },
    {
      name: "Ralsonics",
      slug: "ralsonics",
      categories: ["Websites", "Brand identity"],
      year: 2026,
      site: { href: "https://ralsonics-engineering.vercel.app/", label: "ralsonics-engineering.vercel.app" },
      montage: "/showcase/ralsonics/montage.mp4",
      story: [
        "Ralsonics has built industrial cleaning and surface treatment systems for over 50 years. Every machine is engineered around the component, the contaminant and the production line.",
        "We revamped how the brand shows up and built a site that walks an engineer through that process, from the first evaluation to commissioning and support, with a drawing for each step.",
        "At the foot of every page, the mark comes apart into a cleaning arm, works a part and closes back into the mark.",
      ],
      run: [
        tile("ralsonics", "Ralsonics"),
        { kind: "palette", colors: ["#3d82c4", "#141414", "#f3ede9", "#fcfcfa"] },
        montage("ralsonics", "Ralsonics"),
        shot("ralsonics", "hero", "Better cleaning. Built into the process. The Ralsonics home page"),
        shot("ralsonics", "experience", "Over 50 years of experience"),
        { kind: "video", src: "/showcase/ralsonics/footer.mp4", poster: "/showcase/ralsonics/footer.jpg", alt: "The Ralsonics footer mark becoming a cleaning arm and back" },
        shot("ralsonics", "products", "Cleaning and surface treatment, ultrasonics, drying"),
        shot("ralsonics", "services", "Contract designing and contract manufacturing"),
        shot("ralsonics", "evaluation", "Component and process evaluation, drawn"),
        shot("ralsonics", "testing", "System integration and internal testing, drawn"),
        shot("ralsonics", "commissioning", "Delivery, installation and site commissioning, drawn"),
      ],
    },
    {
      name: "Kitse",
      slug: "kitse",
      categories: ["Websites"],
      year: 2026,
      site: { href: "https://www.kitse.in/", label: "kitse.in" },
      montage: "/showcase/kitse/montage.mp4",
      story: [
        "Kitse plans holidays across India and beyond: Kashmir, Kerala, Ladakh, Bali. We built their site, from the trip search on the first screen to the packages and the occasion specials.",
      ],
      run: [
        tile("kitse", "Kitse"),
        { kind: "palette", colors: ["#181a18", "#2d332c", "#d99865", "#f1f2eb"] },
        montage("kitse", "Kitse"),
        shot("kitse", "hero", "Your next trip starts here, the Kitse home page"),
        shot("kitse", "destinations", "India and beyond, Kitse's destinations"),
        { kind: "video", src: "/showcase/kitse/film.mp4", poster: "/showcase/kitse/film.jpg", alt: "Kitse's hero film" },
        shot("kitse", "packages", "Featured packages"),
        shot("kitse", "occasions", "Occasion specials"),
      ],
    },
    {
      name: "Yoinkd",
      slug: "yoinkd",
      categories: ["Apps", "Brand identity"],
      year: 2026,
      montage: "/showcase/yoinkd/montage.mp4",
      story: [
        "Yoinkd is our own iPhone app, a native take on Yoinks, and it's still being built. Share a link to it, pick video or audio and a quality, and it downloads. The extraction runs on the phone itself, with no server.",
        "We made the app, the ember icon and the lockup. It comes in six themes, light and dark.",
      ],
      // captured on the simulator, its library filled with clips from ui.aryank.space, in our
      // iPhone mockups (.plannotator/works/app-mockups.py)
      run: [
        tile("yoinkd", "Yoinkd"),
        { kind: "image", src: "/showcase/yoinkd/lockup.webp", alt: "The Yoinkd lockup" },
        { kind: "image", src: "/showcase/yoinkd/library.webp", alt: "Yoinkd's library on an iPhone" },
        montage("yoinkd", "Yoinkd"),
        { kind: "image", src: "/showcase/yoinkd/player.webp", alt: "A clip open in Yoinkd, in dark" },
        { kind: "image", src: "/showcase/yoinkd/amber.webp", alt: "The library in Yoinkd's Amber theme" },
        { kind: "image", src: "/showcase/yoinkd/home.webp", alt: "The Yoinkd icon on an iPhone home screen" },
      ],
    },
    {
      name: "CID and the Government of India",
      slug: "gov",
      categories: ["Government", "Apps"],
      year: 2026,
      montage: "/showcase/gov/montage.mp4",
      // UI only: the project isn't named and its mark isn't shown (sensitive, the user, 2026-11-21)
      story: [
        "We build software for the police in Maharashtra and the Government of India. A control room on the web plans each deployment, from the posts on the map to the officers who fill them.",
        "Officers carry the app, in Marathi and English. It takes them to their post and through the duty.",
        "These screens use a demo district. Our investigation work with the CID can't be shown.",
      ],
      run: [
        { kind: "image", src: "/showcase/gov/control-room.webp", alt: "The district control room" },
        { kind: "image", src: "/showcase/gov/posts.webp", alt: "Placing a post on the map and setting the officers it needs" },
        montage("gov", "Government of India"),
        { kind: "image", src: "/showcase/gov/detail.webp", alt: "A deployment's coverage, posts and duration" },
        { kind: "image", src: "/showcase/gov/map.webp", alt: "Deployments across the district on a map" },
        { kind: "image", src: "/showcase/gov/app-dark.webp", alt: "The officers' app on an iPhone: today's duty" },
        { kind: "image", src: "/showcase/gov/duty.webp", alt: "A duty's details in the officers' app" },
        { kind: "image", src: "/showcase/gov/plan-choice.webp", alt: "Starting a plan from the map or from the officers needed" },
        { kind: "image", src: "/showcase/gov/app-light.webp", alt: "The officers' app in Marathi" },
      ],
    },
    {
      name: "Electric Sheep",
      slug: "electric-sheep",
      categories: ["Apps", "Research"],
      year: 2026,
      // the line-drawn sheep in gray on black, nothing else until it launches (the user, 2026-11-21)
      soon: true,
      story: [],
      run: [],
    },
  ],
} as const satisfies { title: string; projects: readonly Project[] };

export type ShowcaseProject = (typeof showcase.projects)[number];
/** the projects that have a case study at /showcase/<slug>: everything not coming soon */
export const caseStudies = showcase.projects.filter((p): p is Exclude<ShowcaseProject, { soon: true }> => !("soon" in p));
export type CaseProject = (typeof caseStudies)[number];
export const projectBySlug = (slug: string): CaseProject | undefined => caseStudies.find((p) => p.slug === slug);
