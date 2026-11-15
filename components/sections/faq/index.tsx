// FAQ. Questions from basement's FAQ and Symbol's, answered the way basement answers: third person,
// plain facts a person or an answer engine can quote alone. The principles sit opposite in large type,
// the "not" half stepped back. The accordion is styled after Symbol's (faq-item.tsx).
import { home } from "@/content/home";
import { FaqItem } from "./faq-item";
import s from "./faq.module.css";

export function Faq() {
  const { title, principles, items } = home.faq;
  return (
    <section className={`section grid-12 ${s.faq}`} aria-labelledby="faq-title">
      <h2 className={`s-title ${s.title}`} id="faq-title" data-reveal="fade">{title}</h2>
      <ul className={s.principles} aria-label="What we work by">
        {principles.map((p, i) => (
          <li key={p.lead} data-reveal="fade" data-delay={(0.08 + i * 0.07).toFixed(2)}>
            {p.lead} <span>{p.not}</span>
          </li>
        ))}
      </ul>
      <div className={s.qa}>
        {items.map((item, i) => (
          <FaqItem key={item.q} q={item.q} a={item.a} defaultOpen={i === 0} delay={0.05 + Math.min(i, 6) * 0.05} />
        ))}
      </div>
    </section>
  );
}
