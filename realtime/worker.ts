// blank-realtime: the Cloudflare side of blankinterfaces.com (the site itself is on Vercel).
//
//   WebSocket /?id=&tab=   joins the room: the nav's "Online (n)", everyone's cursors and chat (room.ts)
//   POST /ask              a question about Blank, answered as streamed plain text (ask.ts)
//
// Only our own pages may use either: the Origin must be one of ORIGINS, exact origins or "*.domain"
// for any subdomain (Vercel previews). `alchemy dev` reads realtime/.env.dev, which swaps in the
// local site; deploys read no env file, so they get the list below.
//
// /ask takes the question as a text/plain body, so the browser sends it without a CORS preflight.
// It answers 200 with the text as it is written, 400 for an empty or long question, 429 when this
// IP has asked 6 in a minute, 503 when Workers AI refuses (the day's free allowance is spent).
//
// Run locally: `pnpm realtime:dev`. Deploy: `pnpm realtime:deploy`.
import * as Cloudflare from "@alchemy.run/cloudflare";
import { Config, Effect, Stream } from "effect";
import * as Headers from "effect/http/Headers";
import * as HttpServerRequest from "effect/http/HttpServerRequest";
import * as HttpServerResponse from "effect/http/HttpServerResponse";
import { Ask } from "./ask";
import Room from "./room";

// agency.aryank.space is where the Vercel project serves the site today
const ORIGINS = "https://agency.aryank.space,https://blankinterfaces.com,https://www.blankinterfaces.com,*.vercel.app";
const MAX_QUESTION = 300;

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
    const origins = (yield* Config.String("ORIGINS").pipe(Config.withDefault(ORIGINS))).split(",").map((o) => o.trim());
    const allowed = (origin: string) =>
      origins.some((o) => origin === o || (o.startsWith("*") && origin.endsWith(o.slice(1))));

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

    return {
      fetch: Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const origin = request.headers.origin ?? "";
        if (!allowed(origin)) return HttpServerResponse.text("origin not allowed", { status: 403 });
        if (new URL(request.url, "http://realtime").pathname === "/ask") return yield* answer(request, origin);
        if (request.headers.upgrade !== "websocket") return HttpServerResponse.text("blank-realtime", { status: 426 });

        // the country Cloudflare located the connection in, for the cursor's flag
        const raw = yield* Cloudflare.Workers.Request;
        const country = typeof raw.cf?.country === "string" ? raw.cf.country : "";
        const forwarded = request.modify({ headers: Headers.set(request.headers, "x-country", country) });
        return yield* rooms.getByName("global").fetch(forwarded);
      }),
    };
  }).pipe(Effect.provide(Ask.layer)),
) {}
