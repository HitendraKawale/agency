import Reveal from "./reveal";

/**
 * The studio in its own words, for the homepage. Every line comes from the
 * founders' own pages (tldr.aryank.space, hitendra.dev/tldr) or from what the
 * studio has shipped; nothing here is a claim we can't point to.
 */

const PEOPLE = [
  {
    name: "Aryan Kathawale",
    role: "Engineer, designer",
    place: "Mumbai",
    href: "https://tldr.aryank.space",
    link: "tldr.aryank.space",
    lines: ["Backend and platform, 4+ years", "Edge, cloud and on-device systems", "Interfaces and the code under them"],
  },
  {
    name: "Hitendra Kawale",
    role: "AI engineer",
    place: "United Kingdom",
    href: "https://hitendra.dev/tldr",
    link: "hitendra.dev/tldr",
    lines: ["LLM systems and RAG pipelines", "3D vision tools", "MSc Artificial Intelligence, University of Surrey"],
  },
] as const;

const PRACTICE = [
  {
    title: "Websites",
    body: "We design the site, build it and launch it, so nothing is lost between the design file and the deploy.",
  },
  {
    title: "Products",
    body: "We design the interface and build the backend and infrastructure under it, for production.",
  },
  {
    title: "AI and answer engines",
    body: "We add LLM features and retrieval to the product, and write pages a model can quote without guessing.",
  },
] as const;

export default function AboutUs() {
  return (
    <section className="sec about-us" aria-labelledby="about-us-title" data-hover-root>
      <div className="row sec-head">
        <h2 id="about-us-title" className="label span-2">
          ( Team )
        </h2>
        <Reveal as="p" className="t-big">
          Led by Aryan Kathawale in Mumbai and Hitendra Kawale in the UK, we design the interface, build the
          system under it, and wire in the AI. You work with both of us.
        </Reveal>
      </div>

      <div className="row about-people">
        {PEOPLE.map((person, index) => (
          <Reveal key={person.name} className={`about-person span-3 ${index === 0 ? "start-3" : "start-6"}`} delay={index * 120}>
            <span className="t-cell">{person.name}</span>
            <span className="label dim">
              {person.role}, {person.place}
            </span>
            <ul className="label">
              {person.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <a className="label" href={person.href}>
              {person.link}
            </a>
          </Reveal>
        ))}
      </div>

      <div className="row about-practice">
        <h3 className="label span-2">( Practice )</h3>
        {PRACTICE.map((item, index) => (
          <Reveal key={item.title} className={`about-practice-item span-2${index === 0 ? " start-3" : ""}`} delay={index * 120}>
            <span className="label dim">{String(index + 1).padStart(2, "0")}</span>
            <span className="t-cell">{item.title}</span>
            <p className="t-body">{item.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
