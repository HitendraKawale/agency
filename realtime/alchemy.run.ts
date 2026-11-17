// The realtime stack: one Worker (worker.ts) hosting the Room Durable Object, the Workers AI
// binding and the ASK_LIMIT rate limit. `alchemy dev` runs it locally; `alchemy deploy --stage prod`
// deploys it, keeping its state in the Cloudflare account.
import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Alchemy from "alchemy";
import * as Effect from "effect/Effect";
import Realtime from "./worker";

export default Alchemy.Stack(
  "BlankRealtime",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const realtime = yield* Realtime;
    return { url: realtime.url.as<string>() };
  }),
);
