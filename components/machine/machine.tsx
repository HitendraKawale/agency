// One machine page (/ai/<path>): basement's machine view (basement.studio/ai/home) rendering a Doc.
// The wordmark, the index of pages, the title with its `#` line and rows, the sections, the footer.
import Link from "next/link";
import { home } from "@/content/home";
import { urls, type Block, type Doc, type Line, type Row } from "@/lib/machine/doc";
import { index } from "@/lib/machine/pages";
import { wordmark } from "./wordmark";
import s from "./machine.module.css";

export function Machine({ doc }: { doc: Doc }) {
  const { md, human } = urls(doc.path);
  // basement's index page has no rows; every other page ends its rows with its two twins
  const meta: Row[] =
    doc.path === "home" ? [] : [...(doc.meta ?? []), { key: "markdown", value: [{ text: md, href: md }] }, { key: "human", value: [{ text: human, href: human }] }];
  const current = doc.path.split("/")[0];

  const content = (
    <>
      <header className={s.head}>
        <h1 className={s.bright}>{doc.title}</h1>
        {doc.note && <p className={s.dim}>{doc.note}</p>}
        {meta.length > 0 && <Rows rows={meta} />}
      </header>
      {doc.sections.map((section) => (
        <section key={section.name} className={s.section}>
          <h2 className={s.rule}>── {section.name} {"─".repeat(80)}</h2>
          {section.blocks.map((block, i) => <BlockView key={i} block={block} />)}
        </section>
      ))}
      <footer className={s.foot}>
        <p>
          {home.footer.copyright} — <a href={human}>back to human site</a>
        </p>
        <p>{"/* EOF */"}</p>
      </footer>
    </>
  );

  return (
    <>
      <div aria-hidden className={s.reveal} />
      <div aria-hidden className={s.scanlines} />
      <div className={s.screen}>
        <main className={s.main}>
          <header className={s.top}>
            <Link aria-label="Machine index" href="/ai/home">
              <pre aria-hidden className={s.mark} style={{ "--columns": wordmark.columns } as React.CSSProperties}>
                {wordmark.text}
              </pre>
            </Link>
            <nav aria-label="Site index" className={s.index}>
              {index.map((p) =>
                p === current ? (
                  <span key={p} aria-current="page" className={s.current}>/{p}</span>
                ) : (
                  <Link key={p} href={urls(p).ai}>/{p}</Link>
                ),
              )}
            </nav>
          </header>
          <div className={s.body}>{doc.upper ? <div className={s.upper}>{content}</div> : content}</div>
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
        <ul className={s.col1}>
          {block.lines.map((line, i) => <li key={i}>- <Spans line={line} /></li>)}
        </ul>
      );
    case "items":
      return (
        <ul className={s.col3}>
          {block.items.map((item, i) => (
            <li key={i} id={item.id} className={s.col1}>
              <h3 className={`${s.bright} ${s.itemTitle}`}>* <Spans line={item.title} /></h3>
              {item.body.map((line, j) => <p key={j}><Spans line={line} /></p>)}
              {item.tags && <p className={s.dim}>{item.tags.map((t) => `[${t}]`).join(" ")}</p>}
            </li>
          ))}
        </ul>
      );
  }
}

/** `key ......... value`, the dots filling the key out to 15 columns */
function Rows({ rows }: { rows: readonly Row[] }) {
  return (
    <dl className={s.col1}>
      {rows.map((row) => (
        <div key={row.key} className={s.row}>
          <dt>{`${row.key} ${".".repeat(Math.max(0, 14 - row.key.length))} `}</dt>
          <dd><Spans line={row.value} /></dd>
        </div>
      ))}
    </dl>
  );
}

function Spans({ line }: { line: Line }) {
  return line.map((span, i) => {
    if (typeof span === "string") return span;
    if ("dim" in span) return <span key={i} className={s.dim}>{span.dim}</span>;
    if ("page" in span) return <Link key={i} href={`${urls(span.page).ai}${span.hash ? `#${span.hash}` : ""}`}>{span.text}</Link>;
    const out = /^https?:/.test(span.href);
    return <a key={i} href={span.href} {...(out && { target: "_blank", rel: "noopener" })}>{span.text}</a>;
  });
}
