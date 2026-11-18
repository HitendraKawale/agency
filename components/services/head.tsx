// Symbol's services header: one centred statement and a short paragraph under it.
// Intro: the statement at .5s, the paragraph at .8s, after the nav's logo.
import { services } from "@/content/services";
import s from "./services.module.css";

export function ServicesHead() {
  const { title, line } = services.head;
  return (
    <header className={`grid-12 ${s.head}`}>
      <h1 data-intro="fade" data-delay="0.5" data-dur="1.2">{title}</h1>
      <p data-intro="fade" data-delay="0.8">{line}</p>
    </header>
  );
}
