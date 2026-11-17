// Our stack: every platform we build for, stacked under Blank. The stack's box sits on the left, the
// title and statement beside it, level with its bottom. The scene is stack-scene.tsx.
import { home } from "@/content/home";
import { StackScene } from "./stack-scene";
import s from "./stack.module.css";

export function Stack() {
  const { title, statement, marks } = home.stack;
  const names = marks.map((m) => (m.name === "Web" ? "the web" : m.name));
  const label = `${names.slice(0, -1).join(", ")} and ${names.at(-1)} stacked under Blank`;
  return (
    <section className={`section ${s.stack}`} aria-labelledby="stack-title">
      <StackScene marks={marks} label={label} />
      <h2 className={`s-title ${s.title}`} id="stack-title" data-reveal="fade">{title}</h2>
      <p className={`big-type ${s.statement}`} data-reveal="fade" data-delay="0.1">{statement}</p>
    </section>
  );
}
