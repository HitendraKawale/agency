"use client";

// The index beside the services (Symbol's "Navigation" list, without the label). It sticks as the
// page scrolls and marks the service whose title has passed the upper third of the viewport.
import { useEffect, useState } from "react";
import s from "./services.module.css";

export function IndexNav({ items }: { items: { id: string; title: string }[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sections = items.map((i) => document.getElementById(i.id)).filter((el) => el !== null);
    const update = () => {
      let i = 0;
      sections.forEach((el, k) => {
        if (el.getBoundingClientRect().top < innerHeight * 0.35) i = k;
      });
      setActive(i);
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    return () => {
      removeEventListener("scroll", update);
      removeEventListener("resize", update);
    };
  }, [items]);

  return (
    <nav className={s.index} aria-label="Services">
      <ul>
        {items.map((item, i) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className={i === active ? s.on : undefined} aria-current={i === active ? "location" : undefined}>
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
