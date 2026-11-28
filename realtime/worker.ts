// blank-realtime: the Cloudflare side of blankinterfaces.com (the site itself is on Vercel).
//
//   WebSocket /?id=&tab=   joins the room: the nav's "Online (n)", everyone's cursors and chat (room.ts)
//   POST /ask              a question about Blank, answered as streamed plain text (ask.ts)
//   POST /concierge        a line of the /contact form written for this visitor, streamed (concierge.ts)
//   POST /contact          a project request from /contact, saved (requests.ts)
//   GET  /requests         the saved requests as JSON, with `Authorization: Bearer <REQUESTS_TOKEN>`
//
// Only our own pages may use the first four: the Origin must be one of ORIGINS, exact origins or
// "*.domain" for any subdomain (Vercel previews). `alchemy dev` reads realtime/.env.dev, which swaps
// in the local site; deploys read no env file, so they get the list below.
//
// Bodies are text/plain (JSON inside for /concierge and /contact), so the browser sends them without
// a CORS preflight. /ask answers 200 with the text as it is written, 400 for an empty or long
// question, 429 when this IP has asked 6 in a minute, 503 when Workers AI refuses (the day's free
// allowance is spent).
//
// /concierge and /contact are limited per IP and per Origin by token buckets (limiter.ts, RULES):
// the Origin bucket caps the whole site, so a script faking our Origin can't spend the day's AI
// allowance or fill the store. /concierge answers 200 with the line (possibly empty: the form then
// keeps its fixed line), 429 when a bucket is empty. /contact answers 200 once saved, 400 for a
// missing name, email or project, 429 when a bucket is empty, 503 when saving fails. A request with
// the hidden `website` field filled in is a bot: it gets 200 and is not saved.
//
// Run locally: `pnpm realtime:dev`. Deploy: `pnpm realtime:deploy`.
import * as Cloudflare from "@alchemy.run/cloudflare";
import { RuntimeContext } from "alchemy/RuntimeContext";
import { Config, Effect, Stream } from "effect";
import * as Headers from "effect/http/Headers";
import * as HttpServerRequest from "effect/http/HttpServerRequest";
import * as HttpServerResponse from "effect/http/HttpServerResponse";
import { conciergeBriefs, type ConciergeMoment } from "../content/contact";
import { Ask } from "./ask";
import Concierge, { type Answers } from "./concierge";
import Limiter, { type Rule } from "./limiter";
import Requests from "./requests";
import Room from "./room";

// agency.aryank.space is where the Vercel project serves the site today
const ORIGINS = "https://agency.aryank.space,https://blankinterfaces.com,https://www.blankinterfaces.com,*.vercel.app";
const MAX_QUESTION = 300;

/** Token buckets for the contact form, per IP and per Origin. */
const RULES = {
  line: { ip: { capacity: 10, seconds: 60 }, origin: { capacity: 120, seconds: 60 } },
  send: { ip: { capacity: 3, seconds: 600 }, origin: { capacity: 30, seconds: 3600 } },
} satisfies Record<string, Record<"ip" | "origin", Rule>>;

const VISIT = /^[A-Za-z0-9_-]{8,64}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const isMoment = (v: unknown): v is ConciergeMoment => typeof v === "string" && Object.hasOwn(conciergeBriefs, v);

/** The form's answers out of an untrusted body, trimmed and cut to length. */
const readAnswers = (m: Record<string, unknown>): Answers => ({
  name: text(m.name, 80),
  email: text(m.email, 120),
  company: text(m.company, 80),
  details: text(m.details, 2000),
});

export default class Realtime extends Cloudflare.Worker<Realtime>()(
  "Realtime",
  {
    main: import.meta.url,
    name: "blank-realtime",
    compatibility: { date: "2026-10-01" },
    // portless names it https://realtime.blank-agency.localhost:1355, the site's NEXT_PUBLIC_REALTIME_URL
    dev: { port: 8787, strictPort: true },
  },
  Effect.gen(function* () {
    const rooms = yield* Room;
    const ask = yield* Ask;
    const concierges = yield* Concierge;
    const limiters = yield* Limiter;
    const requests = yield* Requests;
    const origins = (yield* Config.String("ORIGINS").pipe(Config.withDefault(ORIGINS))).split(",").map((o) => o.trim());
    const token = yield* Config.String("REQUESTS_TOKEN").pipe(Config.withDefault(""));
    const allowed = (origin: string) =>
      origins.some((o) => origin === o || (o.startsWith("*") && origin.endsWith(o.slice(1))));

    /** Spend a token from this IP's bucket and this Origin's for `kind`; false when either is empty. */
    const within = (kind: keyof typeof RULES, ip: string, origin: string) =>
      Effect.gen(function* () {
        if (!(yield* limiters.getByName(`${kind}:ip:${ip}`).take(RULES[kind].ip))) return false;
        return yield* limiters.getByName(`${kind}:origin:${origin}`).take(RULES[kind].origin);
      });

    /** The JSON object in a text/plain body, or null. */
    const json = (request: HttpServerRequest.HttpServerRequest) =>
      request.text.pipe(
        Effect.map((body): Record<string, unknown> | null => {
          try {
            const value: unknown = JSON.parse(body);
            return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
          } catch {
            return null;
          }
        }),
      );

    const answer = (request: HttpServerRequest.HttpServerRequest, origin: string) =>
      Effect.gen(function* () {
        const headers = { "access-control-allow-origin": origin, vary: "Origin" };
        const reply = (status: number, body: string) => HttpServerResponse.text(body, { status, headers });

        if (request.method !== "POST") return reply(405, "POST a question");
        const question = (yield* request.text).trim();
        if (!question || question.length > MAX_QUESTION) return reply(400, `1 to ${MAX_QUESTION} characters`);
        const ip = request.headers["cf-connecting-ip"] ?? "unknown";

        return yield* ask.answer(question, ip).pipe(
          Effect.map((text) =>
            HttpServerResponse.stream(Stream.encodeText(text), {
              contentType: "text/plain; charset=utf-8",
              headers: { ...headers, "cache-control": "no-store" },
            }),
          ),
          Effect.catchTags({
            AskRateLimited: () => Effect.succeed(reply(429, "too many questions")),
            AskUnavailable: (error) =>
              Effect.logError("ask: Workers AI refused", error.cause).pipe(
                Effect.as(reply(503, "no answers right now")),
              ),
          }),
        );
      });

    /** POST /concierge {visit, moment, answers}: the Concierge's line, streamed. */
    const concierge = (request: HttpServerRequest.HttpServerRequest, origin: string) =>
      Effect.gen(function* () {
        const headers = { "access-control-allow-origin": origin, vary: "Origin" };
        const reply = (status: number, body: string) => HttpServerResponse.text(body, { status, headers });
        if (request.method !== "POST") return reply(405, "POST {visit, moment, answers}");

        const body = yield* json(request);
        const visit = text(body?.visit, 64);
        if (!body || !VISIT.test(visit) || !isMoment(body.moment)) return reply(400, "expected {visit, moment, answers}");
        const answers = readAnswers(typeof body.answers === "object" && body.answers ? (body.answers as Record<string, unknown>) : {});

        const ip = request.headers["cf-connecting-ip"] ?? "unknown";
        if (!(yield* within("line", ip, origin))) return reply(429, "too many lines");

        // the stub's stream runs after this handler returns, so it takes this request's runtime along
        const runtime = yield* RuntimeContext;
        const line = concierges.getByName(visit).line(body.moment, answers).pipe(Stream.provideService(RuntimeContext, runtime));
        return HttpServerResponse.stream(Stream.encodeText(line), {
          contentType: "text/plain; charset=utf-8",
          headers: { ...headers, "cache-control": "no-store" },
        });
      }).pipe(
        Effect.catchCause((cause) =>
          Effect.logError("concierge: failed", cause).pipe(
            Effect.as(HttpServerResponse.text("", { status: 503, headers: { "access-control-allow-origin": origin, vary: "Origin" } })),
          ),
        ),
      );

    /** POST /contact {visit, name, email, company, details, website}: save the request. */
    const contact = (request: HttpServerRequest.HttpServerRequest, origin: string, country: string) =>
      Effect.gen(function* () {
        const headers = { "access-control-allow-origin": origin, vary: "Origin" };
        const reply = (status: number, body: string) => HttpServerResponse.text(body, { status, headers });
        if (request.method !== "POST") return reply(405, "POST a request");

        const body = yield* json(request);
        if (!body) return reply(400, "expected a JSON body");
        if (text(body.website, 200)) return reply(200, "ok"); // the honeypot: a person never sees this field
        const answers = readAnswers(body);
        if (!answers.name || !EMAIL.test(answers.email) || !answers.details) return reply(400, "name, email and details are needed");

        const ip = request.headers["cf-connecting-ip"] ?? "unknown";
        if (!(yield* within("send", ip, origin))) return reply(429, "too many requests");

        const visit = text(body.visit, 64);
        const lines = VISIT.test(visit)
          ? yield* concierges.getByName(visit).lines().pipe(Effect.orElseSucceed((): Record<string, string> => ({})))
          : {};
        yield* requests.getByName("all").add({ ...answers, lines, origin, country });
        return reply(200, "ok");
      }).pipe(
        Effect.catchCause((cause) =>
          Effect.logError("contact: failed to save", cause).pipe(
            Effect.as(HttpServerResponse.text("not saved", { status: 503, headers: { "access-control-allow-origin": origin, vary: "Origin" } })),
          ),
        ),
      );

    /** GET /requests: the newest 200 requests, for whoever holds REQUESTS_TOKEN. 404 without a token set. */
    const list = (request: HttpServerRequest.HttpServerRequest) =>
      Effect.gen(function* () {
        if (!token) return HttpServerResponse.text("not found", { status: 404 });
        if (request.headers.authorization !== `Bearer ${token}`) return HttpServerResponse.text("unauthorized", { status: 401 });
        const all = yield* requests.getByName("all").list(200);
        return yield* HttpServerResponse.json(all);
      });

    return {
      fetch: Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const path = new URL(request.url, "http://realtime").pathname;
        if (path === "/requests") return yield* list(request);

        const origin = request.headers.origin ?? "";
        if (!allowed(origin)) return HttpServerResponse.text("origin not allowed", { status: 403 });
        if (path === "/ask") return yield* answer(request, origin);

        // the country Cloudflare located the connection in: the cursor's flag, and a request's origin
        const raw = yield* Cloudflare.Workers.Request;
        const country = typeof raw.cf?.country === "string" ? raw.cf.country : "";
        if (path === "/concierge") return yield* concierge(request, origin);
        if (path === "/contact") return yield* contact(request, origin, country);
        if (request.headers.upgrade !== "websocket") return HttpServerResponse.text("blank-realtime", { status: 426 });

        const forwarded = request.modify({ headers: Headers.set(request.headers, "x-country", country) });
        return yield* rooms.getByName("global").fetch(forwarded);
      }),
    };
  }).pipe(Effect.provide(Ask.layer)),
) {}
