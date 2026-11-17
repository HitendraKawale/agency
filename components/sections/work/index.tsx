// Featured work: the client's logo on a tile, what we did beside it.
import { home } from "@/content/home";
import { vars } from "@/lib/utils";
import s from "./work.module.css";

export function Work() {
  const { title, projects } = home.work;
  return (
    <section className="section" aria-labelledby="work-title">
      <div className="grid-12">
        <h2 className="s-title in" id="work-title" data-reveal="fade">{title}</h2>
      </div>
      <div className={s.work}>
        {projects.map((p) => (
          <a key={p.name} className={s.proj} href={p.href}>
            <div className={s.art} data-reveal="lift">
              <img src={p.logo} alt="" style={vars({ "--w": p.logoWidth })} />
            </div>
            <div className={s.info} data-reveal="fade" data-delay="0.12">
              <h3 className="tube">{p.name}</h3>
              <p className={s.body}>{p.body}</p>
              <p className={s.meta}>{p.services}<br />{p.year}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
