// Brand systems: Symbol's studio section with our own renders (symbolstudio.pl/en, "We define brands
// where..."). Statement, two short columns and a button on the left; two columns of images running on
// their own on the right.
import { home } from "@/content/home";
import { Button } from "@/components/ui/button";
import { Reel } from "./reel";
import s from "./studio.module.css";

export function Studio() {
  const { title, statement, columns, action, reel } = home.studio;
  return (
    <section className={`section grid-12 ${s.studio}`} aria-labelledby="studio-title">
      <h2 className={`s-title ${s.title}`} id="studio-title" data-reveal="fade">{title}</h2>
      <p className={`big-type ${s.statement}`} data-reveal="fade">{statement}</p>
      <div className={s.cols}>
        {columns.map((c, i) => (
          <p key={i} data-reveal="fade" data-delay={(0.1 + i * 0.08).toFixed(2)}>{c}</p>
        ))}
      </div>
      <div className={`actions ${s.actions}`} data-reveal="fade" data-delay="0.26">
        <Button href={action.href} label={action.label} />
      </div>
      <Reel className={s.reel} columns={reel} />
    </section>
  );
}
