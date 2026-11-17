// Platforms: we build for every platform. The BI app icon wired to Android, the web, Windows and Apple
// by circuit traces that carry the icon's spectrum into it (board.tsx).
import { home } from "@/content/home";
import { Board } from "./board";
import s from "./platforms.module.css";

export function Platforms() {
  const { title, statement, marks } = home.platforms;
  const names = marks.map((m) => (m.name === "Web" ? "the web" : m.name));
  const label = `Blank connected to ${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  return (
    <section className="section grid-12" aria-labelledby="platforms-title">
      <h2 className="s-title in" id="platforms-title" data-reveal="fade">{title}</h2>
      <p className={`big-type in ${s.statement}`} data-reveal="fade">{statement}</p>
      <Board marks={marks} label={label} />
    </section>
  );
}
