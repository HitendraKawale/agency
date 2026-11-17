// Footer: links, then the wordmark across the page, which heats up after a short hover.
import { home, site } from "@/content/home";
import { HeatMark } from "@/components/ui/heat-mark";
import s from "./footer.module.css";

export function Footer() {
  const { links, copyright } = home.footer;
  return (
    <footer className={s.footer}>
      <div className={s.foot} data-reveal="fade">
        <ul>
          {links.map((l) => (
            // the flicker sits on a span: .foot a's colour transition would override .tube's timing
            <li key={l.label}><a href={l.href}><span className="tube">{l.label}</span></a></li>
          ))}
        </ul>
        <span>{copyright}</span>
      </div>
      <HeatMark
        className={s.big}
        href="#"
        aria-label={`${site.name}, home`}
        data-reveal="lift"
        heat={{ ink: [0.77, 0.77, 0.77], bg: [0.055, 0.055, 0.055], delay: 400 }}
      />
    </footer>
  );
}
