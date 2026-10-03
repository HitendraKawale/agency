import type { Metadata } from "next";
import Reveal from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "blog , blank interfaces",
  description: "Writing from blank interfaces, a design and engineering studio in Mumbai and the UK.",
  alternates: { canonical: "/blog" },
};

/** Posts land here as { no, title, date } when there are any. */
const ENTRIES: ReadonlyArray<{ no: string; title: string; date: string }> = [];

export default function BlogPage() {
  return (
    <main className="page-top" data-hover-root>
      <header className="row case-head">
        <span className="label span-2">( Blog )</span>
        <Reveal as="h1" className="t-mega">
          Blog
        </Reveal>
      </header>

      <section className="sec" aria-label="Entries">
        <div className="entries label">
          <div className="dim" aria-hidden="true">
            <span>No.</span>
            <span className="title">Title</span>
            <span>Date</span>
          </div>
          {ENTRIES.length ? (
            ENTRIES.map((entry) => (
              <div key={entry.no}>
                <span>{entry.no}</span>
                <span className="title">{entry.title}</span>
                <span>{entry.date}</span>
              </div>
            ))
          ) : (
            <div>
              <span className="dim">00</span>
              <span className="title">Nothing published yet</span>
              <span className="dim">2026</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
