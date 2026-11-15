// Client wall after basement's (reference/basement/home.png): a quiet grey heading, logos in one soft
// grey, tiles two px apart. Their tiles are hairline frames; ours are a tone up from the ground, so the
// grid shows without a line. The wall runs the panel's full width; the heading keeps the text indent.
import { home } from "@/content/home";
import { vars } from "@/lib/utils";
import s from "./trusted.module.css";

// tiles reveal in rows of four, left to right
const delay = (i: number) => (0.15 + (i % 4) * 0.07 + Math.floor(i / 4) * 0.1).toFixed(2);

export function Trusted() {
  const { title, clients } = home.trusted;
  return (
    <section className={s.trusted} aria-labelledby="trusted-title">
      <div className="grid-12">
        <h2 className="s-title in" id="trusted-title" data-reveal="fade">{title}</h2>
      </div>
      <ul className={s.wall}>
        {clients.map((c, i) => (
          <li key={c.src} data-reveal="fade" data-delay={delay(i)}>
            {c.kind === "official" && (
              <span className={`${s.official} ${s[c.variant]}`} role="img" aria-label={c.label}>
                <img src={c.src} alt="" />
                <span>{c.lines.map((l, j) => <span key={l}>{j > 0 && <br />}{l}</span>)}</span>
              </span>
            )}
            {c.kind === "logo" && (
              <a href={c.href}>
                <img
                  src={c.src}
                  alt={c.alt}
                  style={vars({ "--a": c.aspect }, "height" in c ? { height: `calc(${c.height}px / sqrt(${c.aspect}))` } : undefined)}
                />
              </a>
            )}
            {c.kind === "organic" && (
              <a className={s.organic} href={c.href} aria-label={c.label}>
                <img src={c.src} alt="" />
                <span>{c.lines.map((l, j) => <span key={l}>{j > 0 && <br />}{l}</span>)}</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
