// What we do: basement's Capabilities, measured live on 2026-11-14 at 1440. Statement from the text
// edge; three columns starting one column in. Head 20/20 600 #E6E6E6, body 20/21 600 #C4C4C4.
import { home } from "@/content/home";
import s from "./services.module.css";

export function Services() {
  const { title, statement, items } = home.services;
  return (
    <section className="section grid-12" aria-labelledby="do-title">
      <h2 className="s-title in" id="do-title" data-reveal="fade">{title}</h2>
      <p className={`big-type ${s.statement}`} data-reveal="fade">{statement}</p>
      {items.map((item, i) => (
        <div key={item.title} className={s.col} data-reveal="fade" data-delay={(0.1 + i * 0.08).toFixed(2)}>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </div>
      ))}
    </section>
  );
}
