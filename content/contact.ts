// Every word on /contact, and what the Concierge agent (realtime/concierge.ts) is told to write.
//
// The page is one line at a time: four questions, then a closing screen with the team, a short
// paragraph on what happens next and Send, then the thank-you. A question marked `agent` is
// rewritten by the Concierge from the answers so far (its brief is in conciergeBriefs); `line` is
// what shows when the agent is slow, down or out of allowance, so every `line` must stand alone.
// The closing paragraph is a template filled in here: the Concierge only names the project, so the
// facts in it (the email, the call, the proposal) can't drift.

export type Field = "name" | "email" | "company" | "details";
export type Answers = Record<Field, string>;

export type Step =
  | {
      kind: "ask";
      field: Field;
      line: string;
      placeholder: string;
      /** shown when the answer is missing or wrong */
      need?: string;
      optional?: boolean;
      /** a long answer: typed smaller, Shift Return for a new line */
      long?: boolean;
      agent?: boolean;
    }
  | { kind: "close" };

const first = (name: string) => name.trim().split(/\s+/)[0] ?? "";

export const contact = {
  title: "Request a project",
  handoff: {
    label: "Need your agent to fill this in?",
    copied: "Copied. Paste it into your agent.",
    prompt: "Read https://blankinterfaces.com/contact.md and fill in a project request for me.",
  },
  steps: [
    { kind: "ask", field: "name", line: "Hi, who are we speaking with?", placeholder: "Your full name", need: "Your name is needed" },
    { kind: "ask", field: "email", line: "What's the best email to reach you?", placeholder: "you@company.com", need: "Your email is needed", agent: true },
    { kind: "ask", field: "company", line: "What's your organisation's name?", placeholder: "Optional", optional: true, agent: true },
    {
      kind: "ask",
      field: "details",
      line: "What would you like us to build?",
      placeholder: "Links, references, a deadline",
      need: "A few words are needed",
      long: true,
      agent: true,
    },
    { kind: "close" },
  ] satisfies Step[],
  /** the closing screen: the team's portraits, as Symbol shows who will call, and what happens next */
  close: {
    team: ["/people/crew/aryan.webp", "/people/crew/hitendra.webp"],
    /** `project` is the Concierge's name for it ("your booking site"), or `fallback` */
    paragraph: (a: Answers, project: string) =>
      `We'll write to ${a.email.trim()} within a day to set up an hour‑long call about ${project}. On it, we show you how we'd build it, then send ${a.company.trim() || "you"} a written proposal.`,
    fallback: "your project",
  },
  /** the thank-you; the Concierge writes its own from the "sent" brief */
  sent: (name: string) => (first(name) ? `Thanks, ${first(name)}. Talk soon.` : "Thanks. Talk soon."),
  buttons: { next: "Next", send: "Send request", sending: "Sending", back: "Back" },
  hints: { press: "or press", next: "next", newLine: "for a new line" },
  errors: {
    email: "That email looks incomplete",
    limit: "That's a lot of requests from here. Try again in a few minutes.",
    down: "It didn't send. Write to aryan@blankinterfaces.com instead.",
  },
} as const;

// mail providers, whose domain says nothing about the organisation
const FREE_MAIL = /^(gmail|googlemail|yahoo|ymail|outlook|hotmail|live|msn|icloud|me|mac|aol|proton|protonmail|pm|gmx|zoho|yandex|mail|rediffmail|fastmail|hey|tutanota)$/;

/** The organisation an email's domain suggests ("sam@acme-labs.co.uk" is "Acme Labs"), or "". */
export function organisationFromEmail(email: string): string {
  const host = email.trim().toLowerCase().split("@")[1] ?? "";
  const parts = host.split(".");
  // the label before the public suffix: acme.com, acme.co.uk, mail.acme.io
  const name = parts.length >= 3 && parts.at(-2)!.length <= 3 ? parts.at(-3) : parts.at(-2);
  if (!name || FREE_MAIL.test(name)) return "";
  return name
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * What the Concierge is asked to write at each moment, given the answers so far. The questions keep
 * the fixed line's meaning and add what it knows about this person; `project` is only a name.
 */
export const conciergeBriefs = {
  email: "Greet them warmly by first name, then ask for the best email to reach them. Example: \"Good to meet you, Sam. What's the best email to reach you?\"",
  company:
    "Ask for their organisation's name, by first name. If their email is at a work domain, ask whether the organisation is the one that domain suggests. Example: \"Thanks, Sam. Is Acme your organisation's name?\" or \"Thanks, Sam. What's your organisation's name?\"",
  details: "Ask what they would like us to build, naming their organisation if they gave one. Example: \"What would you like us to build for Acme, Sam?\"",
  project:
    "Reply with only a name for their project: the word your, then at most four words copied from what they wrote. Add no words they didn't write, such as platform, app or marketplace. No full stop. If they haven't said what the thing to build is, reply: your project. Examples: for \"a booking site for our clinics\", your booking site; for \"not sure yet, we sell soap\", your project",
  sent: "Thank them by first name and say we'll talk soon. Example: \"Thanks, Sam. Talk soon.\"",
} as const;

export type ConciergeMoment = keyof typeof conciergeBriefs;
