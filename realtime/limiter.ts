// Limiter: a token bucket per key, each in its own Durable Object, after the registry's
// durable-object-rpc-rate-limit block. The Worker keys buckets by IP and by Origin, so one visitor
// can't run the form all day and a script faking our Origin still shares one bucket with the whole
// site. Unlike the Rate Limiting binding it counts exactly and allows windows past 60 s.
//
// The bucket lives in the object's SQLite and refills from the time since the last take, worked
// out on each call. The block refills on an alarm instead; this way an idle key costs nothing and
// there is no alarm to keep. A Durable Object runs one call at a time, so read-then-write is safe.
import * as Cloudflare from "@alchemy.run/cloudflare";
import { Clock, Effect } from "effect";

/** `capacity` takes in a burst, refilling all of them over `seconds`. */
export type Rule = { readonly capacity: number; readonly seconds: number };

type Bucket = { tokens: number; at: number };

export default class Limiter extends Cloudflare.DurableObject<Limiter>()(
  "Limiter",
  Effect.gen(function* () {
    const state = yield* Cloudflare.DurableObjectState;

    return Effect.gen(function* () {
      yield* state.storage.sql.exec(
        "CREATE TABLE IF NOT EXISTS bucket (id INTEGER PRIMARY KEY CHECK (id = 1), tokens REAL NOT NULL, at INTEGER NOT NULL)",
      );

      return {
        /** Spend one token under `rule`. False when the bucket is empty; nothing is spent then. */
        take: Effect.fn("Limiter.take")(function* (rule: Rule) {
          const now = yield* Clock.currentTimeMillis;
          const rows = yield* (yield* state.storage.sql.exec<Bucket>("SELECT tokens, at FROM bucket WHERE id = 1")).toArray();
          const refill = rule.capacity / (rule.seconds * 1000); // tokens per ms
          const tokens = rows[0] ? Math.min(rule.capacity, rows[0].tokens + (now - rows[0].at) * refill) : rule.capacity;
          const allowed = tokens >= 1;
          yield* state.storage.sql.exec(
            "INSERT INTO bucket (id, tokens, at) VALUES (1, ?, ?) ON CONFLICT (id) DO UPDATE SET tokens = excluded.tokens, at = excluded.at",
            allowed ? tokens - 1 : tokens,
            now,
          );
          return allowed;
        }),
      };
    });
  }),
) {}
