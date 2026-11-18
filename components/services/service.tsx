// One service, as Symbol lays it out: the title; the scope list on the left and the question with
// the reasoning on the right; then the image run, one large image and two small ones beside it.
import type { Service as ServiceData } from "@/content/services";
import { vars } from "@/lib/utils";
import { RunVideo } from "./run-video";
import s from "./services.module.css";

export function Service({ id, title, scope, question, text, run }: ServiceData) {
  return (
    <section className={s.svc} id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} data-reveal="fade">{title}</h2>
      <ul className={s.scope} data-reveal="fade" data-delay="0.08">
        {scope.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <div className={s.text} data-reveal="fade" data-delay="0.16">
        <p className={s.q}>{question}</p>
        {text.map((t) => <p key={t}>{t}</p>)}
      </div>
      <div className={s.run} data-reveal="lift">
        {run.map((m) =>
          m.kind === "video" ? (
            <RunVideo key={m.src} className={s.media} src={m.src} poster={m.poster} width={m.width} height={m.height} alt={m.alt} />
          ) : (
            <img
              key={m.src}
              className={s.media}
              src={m.src}
              width={m.width}
              height={m.height}
              alt={m.alt}
              loading="lazy"
              decoding="async"
              style={m.position ? vars({ "--pos": m.position }) : undefined}
            />
          ),
        )}
      </div>
    </section>
  );
}
