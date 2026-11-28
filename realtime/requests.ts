// Requests: every project request sent from /contact, in one Durable Object ("all") with SQLite.
// Nothing is emailed yet; GET /requests on the Worker lists them for whoever has REQUESTS_TOKEN.
// When email is added, this table is where the outbox status goes (the registry's
// effect-outbox-replicator pattern: save first, then send, retry on an alarm).
import * as Cloudflare from "@alchemy.run/cloudflare";
import { Clock, Effect } from "effect";

export type Request = {
  name: string;
  email: string;
  company: string;
  details: string;
  /** the Concierge's lines this visitor saw, by moment */
  lines: Record<string, string>;
  origin: string;
  country: string;
};

export type Stored = Request & { id: number; at: string };

type Row = { id: number; at: number; body: string };

export default class Requests extends Cloudflare.DurableObject<Requests>()(
  "Requests",
  Effect.gen(function* () {
    const state = yield* Cloudflare.DurableObjectState;

    return Effect.gen(function* () {
      const sql = state.storage.sql;
      yield* sql.exec("CREATE TABLE IF NOT EXISTS request (id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, body TEXT NOT NULL)");

      return {
        /** Save a request. Returns its id. */
        add: Effect.fn("Requests.add")(function* (request: Request) {
          const now = yield* Clock.currentTimeMillis;
          const rows = yield* (yield* sql.exec<{ id: number }>(
            "INSERT INTO request (at, body) VALUES (?, ?) RETURNING id",
            now,
            JSON.stringify(request),
          )).toArray();
          return rows[0]?.id ?? 0;
        }),

        /** The newest `limit` requests, newest first. */
        list: Effect.fn("Requests.list")(function* (limit: number) {
          const rows = yield* (yield* sql.exec<Row>("SELECT id, at, body FROM request ORDER BY id DESC LIMIT ?", limit)).toArray();
          return rows.map((r): Stored => ({ id: r.id, at: new Date(r.at).toISOString(), ...(JSON.parse(r.body) as Request) }));
        }),
      };
    });
  }),
) {}
