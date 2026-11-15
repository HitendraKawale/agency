// Contact: basement's, in our type. One large line that is the mail link, the address under it, and
// the local time where each of us is.
import { home, site } from "@/content/home";
import { Clocks } from "./clocks";
import s from "./contact.module.css";

export function Contact() {
  const { title, lines, clocks } = home.contact;
  return (
    <section className="section grid-12" aria-labelledby="contact-title">
      <h2 className="s-title in" id="contact-title" data-reveal="fade">{title}</h2>
      <p className={`big-type in ${s.ask}`} data-reveal="fade">
        <a href={`mailto:${site.email}`}>
          {lines.map((l, i) => <span key={l}>{i > 0 && <br />}{l}</span>)}
          <span className={s.mail}>{site.email}</span>
        </a>
      </p>
      <Clocks className={`in ${s.clocks}`} clocks={clocks} />
    </section>
  );
}
