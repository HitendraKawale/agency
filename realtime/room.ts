// The room behind the nav's "Online (n)": who is on blankinterfaces.com right now, live, with
// everyone's cursor and chat messages, after basement.studio's. One Durable Object, "global", holds
// every visitor's WebSocket.
//
// A visitor is a browser, not a tab: the client sends a stable id kept in localStorage (`id`), so
// two tabs count once, and a per-tab id (`tab`) that names its cursor. Whenever someone arrives or
// leaves, the room sends everyone the new count as {"n": count}; a tab that leaves is announced as
// {"g": tab} so its cursor goes.
//
// Cursors: a tab sends {"x", "y", "path", "name", "msg"} as its mouse moves (the client throttles
// to 4 a second, 2 when busy). The room checks it, stamps the tab's id and its country (the Worker
// passes Cloudflare's location of the connection as x-country, so it cannot be faked) and passes
// it to everyone else as {"c": cursor}. Clients show cursors on their own page only.
//
// The room holds at most CAP people. Past that, a new visitor still connects and sees the count
// and the cursors, but is not counted and cannot send; when a seat frees up, the longest waiting
// visitor takes it.
//
// The sockets hibernate: with nobody moving, the room is evicted from memory and costs nothing.
// Each socket's Seat lives in its attachment, so it survives; the socket map below is rebuilt from
// the state when the room wakes. Clients keep the line alive by sending "ping" every 25 s; the
// runtime answers "pong" itself, without waking the room. A tab hidden for 10 s closes its socket
// and reconnects when it is shown again (the client does this), so the count is people looking at
// the site.
import * as Cloudflare from "@alchemy.run/cloudflare";
import { Clock, Effect } from "effect";
import { HttpServerRequest } from "effect/http/HttpServerRequest";
import * as HttpServerResponse from "effect/http/HttpServerResponse";

const CAP = 28;
const ID = /^[A-Za-z0-9_-]{8,64}$/;
const MIN_GAP = 80; // ms between a tab's cursor messages; faster ones are dropped

type Socket = Cloudflare.WebSocket;
type RawSocket = Socket["ws"];
type Seat = { id: string; tab: string; country: string; counted: boolean };
type Cursor = { id: string; x: number; y: number; path: string; name: string; msg: string; country: string };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const seatOf = (socket: Socket) => socket.deserializeAttachment<Seat>();

/** A tab's cursor message, checked and clamped, or null for anything malformed. */
function readCursor(message: string, seat: Seat): Cursor | null {
  let m: Record<string, unknown>;
  try {
    m = JSON.parse(message);
  } catch {
    return null;
  }
  const { x, y } = m;
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  return {
    id: seat.tab,
    x: Math.min(1, Math.max(0, x)),
    y: Math.max(0, Math.min(1e6, y)),
    path: text(m.path, 120),
    name: text(m.name, 20),
    msg: text(m.msg, 120),
    country: seat.country,
  };
}

export default class Room extends Cloudflare.DurableObject<Room>()(
  "Room",
  Effect.gen(function* () {
    const state = yield* Cloudflare.DurableObjectState;

    return Effect.gen(function* () {
      yield* state.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));

      // every open socket, by its native socket: handlers get a fresh wrapper each call
      const sockets = new Map<RawSocket, Socket>();
      for (const socket of yield* state.getWebSockets()) sockets.set(socket.ws, socket);
      const last = new Map<RawSocket, number>(); // in memory only: forgetting it on eviction is fine

      /** Distinct counted visitors, leaving out a socket that is closing. */
      const people = (leaving?: RawSocket) => {
        const ids = new Set<string>();
        for (const [ws, socket] of sockets) {
          const seat = ws === leaving ? null : seatOf(socket);
          if (seat?.counted) ids.add(seat.id);
        }
        return ids;
      };

      const send = (msg: string, except?: RawSocket) => {
        for (const ws of sockets.keys()) {
          if (ws === except) continue;
          try {
            ws.send(msg);
          } catch {
            // a socket mid-close; its own close event tidies up
          }
        }
      };

      /** Seat whoever is waiting, then tell everyone the count. */
      const broadcast = (leaving?: RawSocket) => {
        const ids = people(leaving);
        for (const [ws, socket] of sockets) {
          if (ws === leaving || ids.size >= CAP) continue;
          const seat = seatOf(socket);
          if (seat && !seat.counted) {
            socket.serializeAttachment({ ...seat, counted: true } satisfies Seat);
            ids.add(seat.id);
          }
        }
        send(JSON.stringify({ n: ids.size }), leaving);
      };

      const left = (socket: Socket) =>
        Effect.sync(() => {
          last.delete(socket.ws);
          const seat = seatOf(socket);
          if (seat) send(JSON.stringify({ g: seat.tab }), socket.ws);
          broadcast(socket.ws);
          sockets.delete(socket.ws);
        });

      return {
        fetch: Effect.gen(function* () {
          const request = yield* HttpServerRequest;
          const q = new URL(request.url, "http://room").searchParams;
          const id = q.get("id") ?? "", tab = q.get("tab") ?? "";
          if (!ID.test(id) || !ID.test(tab))
            return HttpServerResponse.text("expected ?id=<visitor>&tab=<tab>", { status: 400 });
          const country = (request.headers["x-country"] ?? "").slice(0, 2).toUpperCase();

          const here = people();
          // already here in another tab, or a seat is free
          const counted = here.has(id) || here.size < CAP;
          const [response, socket] = yield* Cloudflare.upgrade();
          socket.serializeAttachment({ id, tab, country, counted } satisfies Seat);
          sockets.set(socket.ws, socket);
          broadcast();
          return response;
        }),

        webSocketMessage: Effect.fn("Room.message")(function* (socket: Socket, message: string | ArrayBuffer) {
          if (typeof message !== "string" || message.length > 600) return;
          const seat = seatOf(socket);
          if (!seat?.counted) return;
          const now = yield* Clock.currentTimeMillis;
          if (now - (last.get(socket.ws) ?? 0) < MIN_GAP) return;
          last.set(socket.ws, now);
          const cursor = readCursor(message, seat);
          if (cursor) send(JSON.stringify({ c: cursor }), socket.ws);
        }),

        webSocketClose: (socket: Socket) => left(socket),
        webSocketError: (socket: Socket) => left(socket),
      };
    });
  }),
) {}
