import type { Metadata } from "next";
import Reveal from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "privacy — blank interfaces",
  description:
    "How Blank Interfaces collects, uses, and protects personal data — including business contact details used for outreach.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/privacy" },
};

/**
 * Update this whenever the substance changes. People are entitled to know
 * which version of the notice applied when their data was collected.
 */
const LAST_UPDATED = "3 October 2026";

/**
 * Keep CONTACT_EMAIL in sync with OPT_OUT_EMAIL in the outreach pipeline's
 * .env and use a monitored inbox. Replace POSTAL_ADDRESS with the registered
 * office once the Ltd exists. See the outreach pipeline README.
 */
const CONTACT_EMAIL = "aryan@blankinterface.com";
const POSTAL_ADDRESS = "83 London Road, Guildford GU1 1FY";

const RIGHTS = [
  {
    name: "Access",
    body: "Ask for a copy of the personal data we hold about you, and an explanation of what we do with it.",
  },
  {
    name: "Rectification",
    body: "Have anything inaccurate corrected. Business contact data gathered from public sources goes stale quickly, so tell us and we will fix it.",
  },
  {
    name: "Erasure",
    body: "Ask us to delete your data. Where we are relying on legitimate interests, as we are for outreach, we will delete it on request.",
  },
  {
    name: "Objection",
    body: "Object to our use of your data. For direct marketing this right is absolute: object and we stop, with no balancing test and no questions.",
  },
  {
    name: "Restriction",
    body: "Ask us to pause using your data while a question about its accuracy or our basis for holding it is resolved.",
  },
  {
    name: "Portability",
    body: "Receive data you gave us in a structured, commonly used, machine-readable format.",
  },
] as const;

const SOURCES = [
  {
    name: "Companies House",
    body: "The public UK register. We use it to confirm a company is an incorporated body, which determines whether we are permitted to email it at all.",
  },
  {
    name: "The company's own website",
    body: "Publicly published information: what the company does, roles it is advertising, and any contact details shown.",
  },
  {
    name: "Hunter.io",
    body: "A business contact database that publishes work email addresses and job titles gathered from public web sources.",
  },
] as const;

/** Section headings, in order; the contents column links to these ids. */
const SECTIONS = [
  { id: "who", title: "Who we are" },
  { id: "outreach", title: "If we emailed you and you did not ask us to" },
  { id: "clients", title: "If you contact us, or become a client" },
  { id: "visitors", title: "If you just visit this site" },
  { id: "processors", title: "Who else sees your data" },
  { id: "transfers", title: "Where your data goes" },
  { id: "rights", title: "Your rights" },
  { id: "complaints", title: "Complaints" },
  { id: "changes", title: "Changes" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

function Heading({ id }: { id: SectionId }) {
  const section = SECTIONS.find((entry) => entry.id === id);
  return (
    <h2 id={id} className="t-big">
      {section?.title}
    </h2>
  );
}

const Mail = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export default function PrivacyPage() {
  return (
    <main className="page-top" data-hover-root>
      <header className="row case-head">
        <span className="label span-2">( Privacy )</span>
        <Reveal as="h1" className="t-mega">
          Privacy
        </Reveal>
        <p className="t-big start-3 span-4">
          This explains what personal data we collect, why we have it, and how to make us stop. It is written to be
          read, not to be survived.
        </p>
        <p className="label dim start-3 span-4">Last updated {LAST_UPDATED}</p>
      </header>

      <section className="sec row legal">
        <nav className="toc label" aria-label="Sections">
          {SECTIONS.map((section, index) => (
            <a key={section.id} href={`#${section.id}`} className="dim">
              {String(index + 1).padStart(2, "0")} {section.title}
            </a>
          ))}
        </nav>

        <div className="prose">
          <Heading id="who" />
          <p>
            Blank Interfaces is the practice of Aryan Kathawale and Hitendra Kawale, a two-person product studio working
            from Mumbai and the United Kingdom. For UK data protection law we are the &ldquo;controller&rdquo; of the
            personal data described here, which means we decide what is collected and why, and we are accountable for
            it.
          </p>
          <p>
            Write to us at <Mail /> or {POSTAL_ADDRESS}.
          </p>

          <Heading id="outreach" />
          <p>
            This is the section you probably want. We contact a small number of UK companies each week about design and
            product work. If one of those emails reached you, here is exactly what sits behind it.
          </p>

          <h3 className="label">What we hold</h3>
          <p>
            Your work email address, your name and job title where they are published, your employer&apos;s name and
            registration number, and publicly available information about what the company does. We do not hold
            anything about your personal life, and we do not buy bulk marketing lists.
          </p>

          <h3 className="label">Where we got it</h3>
          <ul>
            {SOURCES.map((source) => (
              <li key={source.name}>
                <strong>{source.name}.</strong> {source.body}
              </li>
            ))}
          </ul>

          <h3 className="label">Why we are allowed to hold it</h3>
          <p>
            Our lawful basis is legitimate interests: our interest in finding clients for a small studio, weighed
            against your interest in not being bothered. We have thought about that balance rather than assumed it. We
            contact incorporated companies rather than individuals, we write to people whose role makes the subject
            relevant, we send a handful of emails rather than thousands, every message says who we are and how to stop
            them, and we stop immediately when asked. If you think we have the balance wrong, tell us and we will
            delete your details.
          </p>

          <h3 className="label">How long we keep it</h3>
          <p>
            Up to twelve months from when we collected it, unless you reply and we begin a genuine conversation, in
            which case we keep it for as long as that relationship is live. If you ask us to stop contacting you we
            keep only your email address on a suppression list, indefinitely, for the sole purpose of making sure we
            never contact you again. That is the one piece of data we retain in order to honour your own request.
          </p>

          <h3 className="label">How to make it stop</h3>
          <p>
            Reply with the word &ldquo;unsubscribe&rdquo;, or email <Mail />. No form, no login, no reason needed. We
            will confirm and that will be the end of it.
          </p>

          <Heading id="clients" />
          <p>
            We keep what you send us — your name, contact details, and whatever you tell us about the work — because we
            need it to reply and to do the job. The basis is our legitimate interest in responding to enquiries, and
            performance of a contract once we are working together. Project records are kept for seven years after the
            engagement ends, which is how long UK tax and accounting rules require.
          </p>

          <Heading id="visitors" />
          <p>
            This site does not set advertising or tracking cookies and does not build a profile of you. Our hosting
            provider keeps standard server logs, including IP addresses, for a short period to keep the site running and
            secure.
          </p>

          <Heading id="processors" />
          <p>
            As few people as possible. We use a small number of service providers who process data on our behalf: email
            hosting, the contact-data provider named above, and website hosting. They act on our instructions and cannot
            use your data for their own purposes. We do not sell personal data, and we never will.
          </p>
          <p>
            We draft outreach emails with an AI writing tool. It receives publicly available information about the
            company and the recipient&apos;s name and role in order to write a relevant message. That data is not used
            to train anyone&apos;s models.
          </p>

          <Heading id="transfers" />
          <p>
            We are a two-person studio split between the United Kingdom and India, so data may be accessed from India.
            Where that happens we rely on the safeguards UK law requires for international transfers, and we keep the
            amount of personal data crossing borders to the minimum the work needs.
          </p>

          <Heading id="rights" />
          <p>
            UK data protection law gives you the following rights. Exercising any of them is free, and we will respond
            within one month.
          </p>
          <ul>
            {RIGHTS.map((right) => (
              <li key={right.name}>
                <strong>{right.name}.</strong> {right.body}
              </li>
            ))}
          </ul>
          <p>
            To use any of them, email <Mail />.
          </p>

          <Heading id="complaints" />
          <p>
            If we get something wrong we would rather hear it from you first. You also have the right to complain
            directly to the Information Commissioner&apos;s Office, the UK regulator, at{" "}
            <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">
              ico.org.uk/make-a-complaint
            </a>{" "}
            or on 0303 123 1113. Complaining to them does not affect your right to take the matter up with us.
          </p>

          <Heading id="changes" />
          <p>
            If we change how we use personal data we will update this page and the date at the top. Material changes
            affecting people we have already contacted will be explained here rather than made quietly.
          </p>
        </div>
      </section>
    </main>
  );
}
