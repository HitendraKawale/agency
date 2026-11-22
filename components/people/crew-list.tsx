"use client";

// basement's Crew: the list on the left, the portrait grid on the right, linked. Hovering a row
// lights that person's portrait with basement's hatch, and hovering a portrait lights their row.
// The list is grouped by discipline with "A-Z" over the name column; pressing A-Z drops the
// groups for one list sorted by name, pressing it again brings them back.
import { useState } from "react";
import type { Person } from "@/content/people";
import s from "./people.module.css";

type Hover = { on: string | null; set: (name: string | null) => void };

function Row({ p, hover }: { p: Person; hover: Hover }) {
  return (
    <li data-on={hover.on === p.name || undefined} onPointerEnter={() => hover.set(p.name)} onPointerLeave={() => hover.set(null)}>
      <span>{p.name}</span>
      <span>{p.role}</span>
      <span className={s.links}>
        {p.links.map((l) => (
          <a key={l.href} className="tube" href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
        ))}
      </span>
    </li>
  );
}

export function CrewBoard({ crew, join }: { crew: Person[]; join: string }) {
  const [az, setAz] = useState(false);
  const [on, set] = useState<string | null>(null);
  const hover = { on, set };
  const groups = [...new Set(crew.map((p) => p.group))];
  const sorted = [...crew].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className={s.list} data-reveal="fade">
        {az ? (
          <>
            <div className={s.listHead}>
              <button type="button" className={s.az} aria-pressed onClick={() => setAz(false)}>A-Z</button>
            </div>
            <ul>{sorted.map((p) => <Row key={p.name} p={p} hover={hover} />)}</ul>
          </>
        ) : (
          groups.map((g, i) => (
            <div key={g} className={s.group}>
              <div className={s.listHead}>
                {i === 0 ? <button type="button" className={s.az} aria-pressed={false} onClick={() => setAz(true)}>A-Z</button> : <span />}
                <h3>{g}</h3>
              </div>
              <ul>{crew.filter((p) => p.group === g).map((p) => <Row key={p.name} p={p} hover={hover} />)}</ul>
            </div>
          ))
        )}
      </div>
      {/* six across, as basement's; the join tile takes the rest of the last row */}
      <ul className={s.faces} data-reveal="lift">
        {crew.map((p) => (
          <li key={p.name} data-on={on === p.name || undefined} onPointerEnter={() => set(p.name)} onPointerLeave={() => set(null)}>
            {p.picture.src ? (
              <img className={s.pic} src={p.picture.src} width={p.picture.width} height={p.picture.height} alt={p.name} loading="lazy" decoding="async" />
            ) : (
              <div className={s.pic} style={{ aspectRatio: `${p.picture.width} / ${p.picture.height}` }} aria-hidden />
            )}
          </li>
        ))}
        <li className={s.joinTile} style={{ gridColumn: `span ${6 - (crew.length % 6)}` }}>
          <a href="#positions-title"><span className="tube">{join} →</span></a>
        </li>
      </ul>
    </>
  );
}
