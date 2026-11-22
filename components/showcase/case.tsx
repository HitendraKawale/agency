// One case study, basement's (reference/basement-case, their Cursor page measured at 1440 on
// 2026-11-21): a sticky column on the left with the way back, the facts, the story and two more
// projects, and the run on the right, two 16:9 frames then one full, 8px apart. Videos in the run
// play muted on a loop, as basement's do.
// Layout is Tailwind. Their column is two grid columns (225px at 1440) and the run the other ten.
// Their nav is sticky and ours scrolls away, so the column sticks 16px from the top instead of
// under the nav. Type sizes and the column height are in case.module.css.
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { caseStudies, type CaseProject, type Frame, type Quote } from "@/content/showcase";
import s from "./case.module.css";

const arrow = "size-4 flex-none fill-none stroke-current";
const icon = "rounded-full border border-ink-1/20";

export function CaseStudy({ project }: { project: CaseProject }) {
  const others = caseStudies;
  const at = others.findIndex((p) => p.slug === project.slug);
  // the next two projects in index order, wrapping round
  const more = [1, 2].map((n) => others[(at + n) % others.length]);
  const site = "site" in project ? project.site : undefined;

  return (
    <>
    <div className="grid-12 mt-4 items-start">
      <aside
        className={cn(s.side, s.p, "sticky top-4 col-start-1 col-end-3 flex flex-col gap-4 font-semibold max-lg:static max-lg:col-span-full max-lg:mb-12")}
      >
        <Link className="inline-flex items-center gap-1 self-start text-ink-1 hover:underline" href="/showcase">
          <svg viewBox="0 0 16 16" aria-hidden className={arrow}><path d="M13 8H4M7 5 4 8l3 3" /></svg>
          All Projects
        </Link>

        <h1 className="sr-only">{project.name}</h1>
        {/* the facts: a label a quarter wide in #757575, a 20% edge between rows and after the last */}
        <ul className="text-ink-1 *:grid *:grid-cols-4 *:gap-2 *:border-b *:border-ink-1/20 *:py-1">
          <li>
            <span className="text-ink-3">Client</span>
            <span className="col-span-3 flex min-w-0 items-center gap-0.75">
              <Image src={`/showcase/icons/${project.slug}.png`} alt="" width={14} height={14} className={cn(icon, "size-3.5 flex-none")} />
              {project.name}
            </span>
          </li>
          <li>
            <span className="text-ink-3">Year</span>
            <span className="col-span-3">{project.year}</span>
          </li>
          <li>
            <span className="text-ink-3">Type</span>
            <span className="col-span-3 flex flex-col">
              {project.categories.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </span>
          </li>
          {site && (
            <li>
              <span className="text-ink-3">Link</span>
              <a className="col-span-3 min-w-0 wrap-anywhere hover:underline" href={site.href} target="_blank" rel="noreferrer">{site.label}</a>
            </li>
          )}
        </ul>

        <div className="flex flex-col gap-2 text-balance text-ink-2">
          {project.story.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>

        <nav className="mt-auto flex flex-col gap-2 max-lg:hidden" aria-label="More projects">
          <h2 className={cn(s.h4, "text-ink-3")}>More Projects</h2>
          <ul>
            {more.map((p) => (
              <li key={p.slug} className="border-b border-ink-1/20">
                <Link href={`/showcase/${p.slug}`} className="group flex items-center gap-1.75 pt-1.5 pb-1.75 text-ink-2">
                  <Image src={`/showcase/icons/${p.slug}.png`} alt="" width={18} height={18} className={cn(icon, "size-4.5")} />
                  <span className="flex-1 truncate group-hover:underline">{p.name}</span>
                  <svg viewBox="0 0 16 16" aria-hidden className={arrow}><path d="M3 8h9M9 5l3 3-3 3" /></svg>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="col-start-3 col-end-13 max-lg:col-span-full">
        <div className="grid grid-cols-2 gap-2 max-lg:grid-cols-1">
          {project.run.map((f, i) => (
            <RunFrame key={i} frame={f} full={isFull(i, project.run.length)} eager={i < 2} />
          ))}
        </div>
      </div>
    </div>
    {"brief" in project && <Brief brief={project.brief} />}
    {"quote" in project && <ClientQuote quote={project.quote} />}
    </>
  );
}

// the write-up under the run, in basement's Services article idiom: a #757575 heading at 24/24, the
// text under it, three across
function Brief({ brief }: { brief: { brand: string; needed: string; built: string } }) {
  const parts = [
    ["The brand", brief.brand],
    ["What it needed", brief.needed],
    ["What we built", brief.built],
  ] as const;
  return (
    <section className="grid-12 mt-44 gap-y-12 font-semibold max-lg:mt-24" aria-label="About the project">
      {parts.map(([title, text]) => (
        <article key={title} className="col-span-4 flex flex-col gap-3 max-lg:col-span-full">
          <h2 className={cn(s.h3, "text-ink-3")}>{title}</h2>
          <p className={cn(s.doc, "text-pretty text-ink-2")}>{text}</p>
        </article>
      ))}
    </section>
  );
}

// basement's one quote, copied from their Services page (reference/basement-quote, measured at 1440
// and 390 on 2026-11-22): the words across the full width at 56/52 (theirs is 76/68; the user asked for smaller) with a #2E2E2E rule under every
// line, then 32px below, centred, a 96px square portrait with dots at its corners beside the name and
// role. The portrait is the person's photo in black and white, as basement's is; until it arrives
// there is no square.
function ClientQuote({ quote }: { quote: Quote }) {
  return (
    <figure className="grid-12 mt-44 gap-y-8 font-semibold max-lg:mt-24">
      <blockquote className={cn(s.lines, "col-span-full")}>
        <p className={cn(s.quote, "relative z-10 mx-auto max-w-[1440px] text-center text-ink-1")}>
          &ldquo;{quote.words}&rdquo;
        </p>
      </blockquote>
      <figcaption className="col-span-full mx-auto flex gap-x-4 lg:col-start-3 lg:col-end-11">
        {quote.photo && (
          <div className={s.dots}>
            <div className="after:pointer-events-none after:absolute after:inset-0 after:border after:border-ink-1/20">
              <Image src={quote.photo} alt="" width={192} height={192} sizes="96px" className="size-16 object-cover grayscale lg:size-24" />
            </div>
          </div>
        )}
        <div className={cn(s.who, "flex flex-col justify-center gap-1")}>
          <p className="text-ink-1">{quote.by ?? "Name to confirm"}</p>
          <p className="text-ink-3">{quote.role ? `${quote.role} at ${quote.org}` : quote.org}</p>
        </div>
      </figcaption>
    </figure>
  );
}

// two halves then a full; a half left on its own at the end goes full width instead
function isFull(i: number, n: number) {
  return i % 3 === 2 || (i === n - 1 && i % 3 === 0);
}

function RunFrame({ frame, full, eager }: { frame: Frame; full: boolean; eager: boolean }) {
  const cls = cn("block aspect-video h-auto w-full bg-tile object-cover", full && "col-span-full");
  if (frame.kind === "palette")
    return (
      <div className={cn(cls, "flex *:flex-1")} role="img" aria-label={`Palette: ${frame.colors.join(", ")}`}>
        {frame.colors.map((c) => (
          <span key={c} style={{ background: c }} />
        ))}
      </div>
    );
  if (frame.kind === "video")
    return (
      <video
        className={cn(cls, frame.fit === "contain" && cn(s.cream, "object-contain"))}
        src={frame.src}
        poster={frame.poster}
        muted
        loop
        playsInline
        autoPlay
        preload="metadata"
        aria-label={frame.alt}
      />
    );
  return (
    <Image
      className={cls}
      src={frame.src}
      alt={frame.alt}
      width={1920}
      height={1080}
      sizes={full ? "(max-width: 1023px) 100vw, 82vw" : "(max-width: 1023px) 100vw, 41vw"}
      loading={eager ? "eager" : "lazy"}
    />
  );
}
