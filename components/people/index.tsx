// /people, basement's People page in our look (basement.studio/people, capture in
// .plannotator/brand-v1/reference/basement/people.png). Columns at 1440 map onto our 12: the left
// third (titles, the crew list), the middle third (pictures) and the right third (text).
// Left out by our rules: the rules between rows and table lines, the A-Z and group labels.
import { site } from "@/content/home";
import { people, type Picture } from "@/content/people";
import s from "./people.module.css";

/** the picture, or an empty well at its shape until it is made */
function Pic({ p, className }: { p: Picture; className?: string }) {
  const cls = `${s.pic} ${className ?? ""}`;
  if (!p.src) return <div className={cls} style={{ aspectRatio: `${p.width} / ${p.height}` }} aria-hidden />;
  return <img className={cls} src={p.src} width={p.width} height={p.height} alt={p.alt} loading="lazy" decoding="async" />;
}

export { PeopleWall } from "./wall";

export function PeopleIntro() {
  const { title, text } = people.intro;
  return (
    <header className={`grid-12 ${s.intro}`}>
      <h1 className="big-type" data-intro="fade" data-delay="0.5">{title}</h1>
      {text.map((t, i) => (
        <p key={t} data-intro="fade" data-delay={(0.7 + i * 0.1).toFixed(1)}>{t}</p>
      ))}
    </header>
  );
}

export function PeopleValues() {
  const { title, items } = people.values;
  return (
    <section className={`section grid-12 ${s.values}`} aria-labelledby="values-title">
      <h2 className="s-title" id="values-title" data-reveal="fade">{title}</h2>
      {items.map((v) => (
        <div key={v.title} className={s.value}>
          <h3 className="big-type" data-reveal="fade">{v.title}</h3>
          <Pic p={v.picture} className={s.valuePic} />
          <p data-reveal="fade" data-delay="0.08">{v.text}</p>
        </div>
      ))}
    </section>
  );
}

export function PeopleCrew() {
  const { title, people: crew } = people.crew;
  return (
    <section className={`section grid-12 ${s.crew}`} aria-labelledby="crew-title">
      <div className={s.crewHead} data-reveal="fade">
        <h2 className="big-type" id="crew-title">{title}</h2>
        <span className="big-type" aria-label={`${crew.length} people`}>{crew.length}</span>
      </div>
      <ul className={s.list} data-reveal="fade">
        {crew.map((p) => (
          <li key={p.name}>
            <span>{p.name}</span>
            <span>{p.role}</span>
            <span className={s.links}>
              {p.links.map((l) => (
                <a key={l.href} className="tube" href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <ul className={s.faces} data-reveal="lift">
        {crew.map((p) => (
          <li key={p.name}>
            <Pic p={p.picture} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function PeopleJoin() {
  const { text, pictures } = people.join;
  return (
    <section className={`section grid-12 ${s.join}`} aria-label="Join us">
      <Pic p={pictures[0]} className={s.joinA} />
      <Pic p={pictures[1]} className={s.joinB} />
      <p data-reveal="fade">
        {text}{" "}
        <a href={`mailto:${site.email}`}><span className="tube tube-line">{site.email}</span></a>
      </p>
    </section>
  );
}

export function PeoplePositions() {
  const { title, columns, items } = people.positions;
  return (
    <section className={`section grid-12 ${s.positions}`} aria-labelledby="positions-title">
      <h2 className="big-type" id="positions-title" data-reveal="fade">{title}</h2>
      <table data-reveal="fade">
        <thead>
          <tr>
            {columns.map((c) => <th key={c} scope="col">{c}</th>)}
            <th scope="col"><span className="sr-only">Status</span></th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.role} className={p.open ? s.open : undefined}>
              <td>{p.role}</td>
              <td>{p.type}</td>
              <td>{p.location}</td>
              <td>
                {p.open ? (
                  <a className="tube" href={`mailto:${site.email}?subject=${encodeURIComponent(p.role)}`}>Apply</a>
                ) : (
                  "(closed)"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
