const ARTH_URL = "https://www.arthtechnologies.com/";

const PEOPLE = [
  {
    name: "aryan kathawale",
    role: "principal engineer & designer",
    href: "https://tldr.aryank.space",
  },
  {
    name: "hitendra kawale",
    role: "ai engineering",
    href: "https://hitendrakawale.github.io/",
  },
] as const;

export function AboutSection() {
  return (
    <section id="about" className="ni-section page-x">
      <div className="mx-auto w-full max-w-[920px]">
        <p className="ni-kicker">about</p>
        <h2 className="ni-title">
          design and software that holds up.
        </h2>
        <p className="ni-body mt-6">
          blank interfaces is an agentic-first studio by aryan kathawale and
          hitendra kawale. we partner with teams who need serious digital
          products — clear strategy, sharp interfaces, and engineering that does
          not fall apart after launch.
        </p>
        <p className="ni-body mt-4">
          selected work lives with{" "}
          <a
            href="https://www.arthtechnologies.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="ni-link underline underline-offset-2"
            style={{ textDecorationColor: "rgba(255,255,255,0.22)" }}
          >
            arth technologies
          </a>
          .
        </p>
      </div>
    </section>
  );
}

export function InterfacesSection() {
  return (
    <section id="interfaces" className="ni-section page-x">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <p className="ni-kicker" style={{ marginBottom: "0.5rem" }}>
              projects
            </p>
            <h2 className="ni-title">one project</h2>
          </div>
          <p
            className="text-sm tracking-tight lowercase"
            style={{ color: "var(--fg)", opacity: 0.35 }}
          >
            more to come
          </p>
        </div>
        <div className="ni-iframe-frame">
          <iframe
            src={ARTH_URL}
            title="arth technologies"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="ni-iframe"
            tabIndex={-1}
          />
          <a
            href={ARTH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ni-iframe-hit"
            aria-label="Open arth technologies"
          />
        </div>
      </div>
    </section>
  );
}

export function PeopleSection() {
  return (
    <section id="people" className="ni-section page-x">
      <div className="mx-auto w-full max-w-[920px]">
        <p className="ni-kicker">people</p>
        <h2 className="ni-title mb-8">founders</h2>

        <ul className="ni-list">
          {PEOPLE.map((person) => (
            <li key={person.name} className="ni-list-item">
              <a
                href={person.href}
                target="_blank"
                rel="noopener noreferrer"
                className="ni-person-row"
              >
                <span className="ni-person-name">{person.name}</span>
                <span className="ni-person-role">{person.role}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ContactSection() {
  return (
    <section id="contact" className="ni-section page-x">
      <div className="mx-auto w-full max-w-[920px]">
        <p className="ni-kicker">contact</p>
        <h2 className="ni-title mb-8">
          have something to build?
        </h2>

        <ul className="ni-list">
          <li className="ni-list-item">
            <a href="mailto:hello@aryank.space" className="ni-person-row">
              <span className="ni-person-name">hello@aryank.space</span>
              <span className="ni-person-role">email</span>
            </a>
          </li>
          <li className="ni-list-item">
            <a
              href="https://x.com/blank_spacets"
              target="_blank"
              rel="noopener noreferrer"
              className="ni-person-row"
            >
              <span className="ni-person-name">@blank_spacets</span>
              <span className="ni-person-role">x</span>
            </a>
          </li>
          <li className="ni-list-item">
            <a href="tel:+447818916926" className="ni-person-row">
              <span className="ni-person-name">+44 7818 916926</span>
              <span className="ni-person-role">uk</span>
            </a>
          </li>
          <li className="ni-list-item">
            <a href="tel:+918421911353" className="ni-person-row">
              <span className="ni-person-name">+91 8421911353</span>
              <span className="ni-person-role">india</span>
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="ni-footer">
      <p>© 2026 blank interfaces</p>
      <a
        href="https://www.arthtechnologies.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="ni-link"
      >
        arth technologies
      </a>
    </footer>
  );
}
