// One machine page (/ai/<path>): basement's machine view (basement.studio/ai/home) rendering a Doc.
// The wordmark, the index of pages, the title with its `#` line and rows, the sections, the footer.
// Values from their CSS (reference/basement-machine/0mqjjonkx9iz9.css) in sandpaper on noir instead of
// their orange: bright #ff9c71 → sandpaper, base #ff4d00 → ink-2, dim #993000 → ink-3.
import Link from "next/link";
import { home } from "@/content/home";
import { urls, type Block, type Doc, type Line, type Row } from "@/lib/machine/doc";
import { index } from "@/lib/machine/pages";
import { wordmark } from "./wordmark";

const link = "underline underline-offset-4 transition-colors duration-150 hover:text-sandpaper";

export function Machine({ doc }: { doc: Doc }) {
  const { md, human } = urls(doc.path);
  // basement's index page has no rows; every other page ends its rows with its two twins
  const meta: Row[] =
    doc.path === "home" ? [] : [...(doc.meta ?? []), { key: "markdown", value: [{ text: md, href: md }] }, { key: "human", value: [{ text: human, href: human }] }];
  const current = doc.path.split("/")[0];

  const content = (
    <>
      <header className="flex flex-col gap-4 uppercase">
        <h1 className="text-sandpaper">{doc.title}</h1>
        {doc.note && <p className="text-ink-3">{doc.note}</p>}
        {meta.length > 0 && <Rows rows={meta} />}
      </header>
      {doc.sections.map((section) => (
        <section key={section.name} className="flex w-full flex-col gap-3">
          <h2 className="w-full overflow-hidden whitespace-nowrap text-ink-3">── {section.name} {"─".repeat(80)}</h2>
          {section.blocks.map((block, i) => <BlockView key={i} block={block} />)}
        </section>
      ))}
      <footer className="flex flex-col gap-1 text-ink-3">
        <p>
          {home.footer.copyright} — <a className={link} href={human}>back to human site</a>
        </p>
        <p>{"/* EOF */"}</p>
      </footer>
    </>
  );

  return (
    <>
      {/* the intro: a ground-coloured sheet that steps down out of view, and scanlines over everything */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-50 hidden bg-noir intro:block intro:animate-machine-reveal" />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[1200] bg-[repeating-linear-gradient(#00000040_0_1px,#0000_1px_3px)]" />
      <div className="min-h-svh overflow-x-clip bg-noir font-mono text-ink-2 [text-shadow:0_0_6px_rgb(196_196_196/0.35)] selection:bg-ink-2 selection:text-noir">
        <main className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-12 pb-24 text-xs leading-normal font-semibold lg:text-[0.8125rem]">
          <header className="mb-4 flex flex-col gap-4 uppercase">
            <Link aria-label="Machine index" className="transition-colors duration-150 hover:text-sandpaper" href="/ai/home">
              {/* 80 columns of a 0.6em-wide cell: at most 13px, smaller when the column is narrower */}
              <pre aria-hidden className="w-full font-mono leading-tight" style={{ fontSize: `min(13px, calc((100vw - 2rem) / ${wordmark.columns} / 0.6))` }}>
                {wordmark.text}
              </pre>
            </Link>
            <nav aria-label="Site index" className="flex flex-wrap gap-x-4 gap-y-1">
              {index.map((p) =>
                p === current ? (
                  <span key={p} aria-current="page" className="-mx-1 bg-ink-2 px-1 text-noir">/{p}</span>
                ) : (
                  <Link key={p} className={link} href={urls(p).ai}>/{p}</Link>
                ),
              )}
            </nav>
          </header>
          <div className="flex min-w-0 flex-col gap-8 intro:animate-machine-flicker">
            {doc.upper ? <div className="contents uppercase">{content}</div> : content}
          </div>
        </main>
      </div>
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "text":
      return block.lines.map((line, i) => <p key={i}><Spans line={line} /></p>);
    case "rows":
      return <Rows rows={block.rows} />;
    case "list":
      return (
        <ul className="flex flex-col gap-1">
          {block.lines.map((line, i) => <li key={i}>- <Spans line={line} /></li>)}
        </ul>
      );
    case "items":
      return (
        <ul className="flex flex-col gap-3">
          {block.items.map((item, i) => (
            <li key={i} id={item.id} className="flex flex-col gap-1">
              <h3 className="text-sandpaper uppercase">* <Spans line={item.title} /></h3>
              {item.body.map((line, j) => <p key={j}><Spans line={line} /></p>)}
              {item.tags && <p className="text-ink-3">{item.tags.map((t) => `[${t}]`).join(" ")}</p>}
            </li>
          ))}
        </ul>
      );
  }
}

/** `key ......... value`, the dots filling the key out to 15 columns */
function Rows({ rows }: { rows: readonly Row[] }) {
  return (
    <dl className="flex flex-col gap-1">
      {rows.map((row) => (
        <div key={row.key} className="flex">
          <dt className="shrink-0 whitespace-pre text-ink-3">{`${row.key} ${".".repeat(Math.max(0, 14 - row.key.length))} `}</dt>
          <dd className="min-w-0 wrap-anywhere"><Spans line={row.value} /></dd>
        </div>
      ))}
    </dl>
  );
}

function Spans({ line }: { line: Line }) {
  return line.map((span, i) => {
    if (typeof span === "string") return span;
    if ("dim" in span) return <span key={i} className="text-ink-3">{span.dim}</span>;
    if ("page" in span)
      return <Link key={i} className={link} href={`${urls(span.page).ai}${span.hash ? `#${span.hash}` : ""}`}>{span.text}</Link>;
    const out = /^https?:/.test(span.href);
    return <a key={i} className={link} href={span.href} {...(out && { target: "_blank", rel: "noopener" })}>{span.text}</a>;
  });
}
