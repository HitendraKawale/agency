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
  /** the write-up under the run: who the client is, what the job needed, what we built */
  brief?: { brand: string; needed: string; built: string };
  /** the client's words, set at the end of the case study */
  quote?: Quote;
};

/** A client's review. Every one is our draft until that client signs off its words, name, role and photo;
 *  until then `by` is missing and the page says "Name to confirm". */
export type Quote = {
  words: string;
  /** the organisation, as the client names it */
  org: string;
  by?: string;
  role?: string;
  /** the person's photo, square, in public/showcase/people; the page shows it in black and white */
  photo?: string;
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
      brief: {
        brand: "Parflow Engineering makes instrumentation tube fittings, valves and manifolds in Mumbai for oil and gas, refining, power and chemical plants. One engineering blue, #0B5CFF, carries the brand, with heavy capitals for headlines and a layout taken from the datasheets engineers already read.",
        needed: "The old site ran on a WordPress theme. Parflow needed every product online with its exact part numbers, a way for an engineer to ask for a quote on several parts at once, and an admin the team could run without a developer.",
        built: "A Next.js 16 site on Vercel, every page prerendered. The catalogue holds 92 products, each traced to its source specification tables and part numbers. An enquiry basket gathers rows from several products into one quote request. The admin manages products, posts and enquiries, on Neon Postgres and Vercel Blob. Live since 30 July 2026.",
      },
      quote: { words: "Blank changed how the world finds Parflow. Our website finally feels as precise as the parts we make.", org: "Parflow Engineering", by: "Kunal Parikh" },
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
        { kind: "video", src: "/showcase/parflow/stack.mp4", poster: "/showcase/parflow/stack.jpg", alt: "Parflow moved from WordPress to Next.js 16 on Vercel: 99.99% uptime, every page prerendered" },
        shot("parflow", "hero", "Parflow's home page, precision flow control solutions"),
        shot("parflow", "ratings", "What the range is rated for, 10,000 psi and -196 °C"),
        shot("parflow", "insights", "Parflow's blogs and case studies"),
        shot("parflow", "industries", "The industries Parflow supplies"),
      ],
    },
    {
      name: "Organic Foods",
      slug: "organic",
      quote: { words: "We brought Blank our eggs. They gave us a brand we're proud to put on every carton.", org: "Organic Foods", by: "Vivek Mengji" },
      brief: {
        brand: "Organic Foods sells eggs. When they came to us they had the eggs and a name, and nothing else: no mark, no colours, no packaging, no store.",
        needed: "A whole brand, from the first idea, and a website people could order from.",
        built: "The egg mark, the green #20472E and the cream #F4F0DF, Fraunces for type, and the kraft carton with its green band. The site follows one egg from the box to the breakfast plate, then sells it: a storefront, checkout, and an admin where staff handle the orders. Built with Astro, React and PostgreSQL.",
      },
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
      quote: { words: "Blank gave Relay a look as memorable as what it does. Nobody forgets the pixels.", org: "Manaslu Labs", by: "Himansu Rawal", photo: "/showcase/people/himansu-rawal.webp" },
      brief: {
        brand: "Relay, from Manaslu Labs, remembers the fixes a coding agent's model makes and replays them, verified, so the model stops paying to rediscover them.",
        needed: "A look as particular as the product. The product asked for 8-bit, and the research had to read clearly inside it.",
        built: "A brand built from pixels: orange fields that drift across the page, small pixel creatures, Space Grotesk, and diagrams of how a fix is watched, learned, transferred and verified. We did the research, the brand and the site at relay.manaslulabs.xyz.",
      },
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
      quote: { words: "Blank kept the brand we loved, and gave it the website it deserved.", org: "Moneybee", by: "Shreyam Shah", photo: "/showcase/people/shreyam-shah.webp" },
      brief: {
        brand: "Moneybee is a SEBI-registered portfolio manager. They back small Indian companies, and invest only after meeting the management and visiting the plants. Six of Us designed their brand: the bee, the hive and the orange, #F6A11A.",
        needed: "A new website without a new brand. Moneybee liked their identity and wanted to keep it.",
        built: "A Next.js 16 site on Vercel, set in Rethink Sans, built inside the brand Six of Us made. Their record is drawn in the brand's own shapes: returns by year as hives, and Rs. 10 lakh invested in 2007 compounded against the index. It runs at moneybee.in.",
      },
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
      quote: { words: "Blank found colours for the way we think. Rainpulse finally looks like our research.", org: "Rainpulse", by: "Shuji Iwata", photo: "/showcase/people/shuji-iwata.webp" },
      brief: {
        brand: "Rainpulse is two engineers in Osaka who take AI and software from an unsettled idea to a system in daily use. Their work starts as research.",
        needed: "New colours that keep the research voice, and a site that shows how they work.",
        built: "A set of five colours, from blue #2F55E4 to red #D7261E, and a site drawn as a field of live dots: rain, wind, terrain and a helix, all on one shared canvas. Each service has its own figure. Built with SvelteKit, GSAP and Lenis, set in Geist.",
      },
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
      brief: {
        brand: "Ralsonics has built industrial cleaning and surface treatment systems for over 50 years, each one engineered around the component, the contaminant and the production line. The brand is their blue, #3D82C4, on a warm white, with a line drawing for each step of their process.",
        needed: "The old site ran on WordPress 6.7 with the WPBakery page builder. Everything on it had to move across: 93 posts, 28 products, 29 industry pages and the gallery. The team also needed one place to manage products, jobs, enquiries and exhibitions.",
        built: "One Next.js 16 application on Vercel holds the site and a private admin. The content lives in Neon Postgres and the uploads in Vercel Blob; nothing from WordPress is left. Every page is prerendered. In the footer, the mark comes apart into a cleaning arm, works a part and closes back into the mark.",
      },
      quote: { words: "Blank reworked our relationship with the internet, and gave Ralsonics a home on it.", org: "Ralsonics", by: "Kunal Parikh" },
      categories: ["Websites", "Brand identity"],
      year: 2026,
      site: { href: "https://www.ralsonics.com/", label: "ralsonics.com" },
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
        { kind: "video", src: "/showcase/ralsonics/stack.mp4", poster: "/showcase/ralsonics/stack.jpg", alt: "Ralsonics moved from WordPress to Next.js 16 on Vercel: 99.99% uptime, every page prerendered" },
        shot("ralsonics", "evaluation", "Component and process evaluation, drawn"),
        shot("ralsonics", "testing", "System integration and internal testing, drawn"),
        shot("ralsonics", "commissioning", "Delivery, installation and site commissioning, drawn"),
      ],
    },
    {
      name: "Kitse",
      slug: "kitse",
      quote: { words: "Blank built Kitse a site that feels like the first day of the trip.", org: "Kitse", by: "Mayank Bisht" },
      brief: {
        brand: "Kitse plans holidays across India and beyond: Kashmir, Kerala, Ladakh, Bali.",
        needed: "A site that starts where a traveller starts, with a search for the trip.",
        built: "The trip search sits on the first screen, over their hero film. Under it come the destinations, featured packages and occasion specials, on dark green #181A18 with a warm #D99865, set in Rethink Sans.",
      },
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
      quote: { words: "Yoinkd feels like it came with the phone. Share a link, and it's yours.", org: "Yoinkd", by: "Mayank Bisht" },
      brief: {
        brand: "Yoinkd is our own iPhone app, a native take on Pablo Stanley's Yoinks. The ember icon and the lockup are ours.",
        needed: "Downloads that run on the phone itself, with no server, in an app that feels native to iOS.",
        built: "Swift and SwiftUI, with native tabs and glass controls. Share a link, pick video or audio and a quality, and it downloads. It has an artwork-first audio player, video with fullscreen, and six themes: Neutral, Sage, Lavender, Amber, Ocean and Dynamic.",
      },
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
