// blank-realtime: who is on blankinterfaces.com right now, live: the "Online (n)" in the nav, and
// everyone's cursor and chat messages, after basement.studio's. The site is on Vercel; this room
// is a Cloudflare Worker.
//
// One Durable Object, the room, holds every visitor's WebSocket. A visitor is a browser, not a tab:
// the client sends a stable id kept in localStorage (`id`), so two tabs count once, and a per-tab
// id (`tab`) that names its cursor. Whenever someone arrives or leaves, the room sends everyone
// the new count as {"n": count}; a tab that leaves is announced as {"g": tab} so its cursor goes.
//
// Cursors: a tab sends {"x", "y", "path", "name", "msg"} as its mouse moves (the client throttles
// to 4 a second, 2 when busy). The room checks it, stamps the tab's id and its country (from
// Cloudflare's location of the connection, so it cannot be faked) and passes it to everyone else
// as {"c": cursor}. Clients show cursors on their own page only.
//
// The room holds at most CAP people. Past that, a new visitor still connects and sees the count
// and the cursors, but is not counted and cannot send; when a seat frees up, the longest waiting
// visitor takes it.
//
// The sockets hibernate: with nobody moving, the room is evicted from memory and costs nothing.
// Clients keep the line alive by sending "ping" every 25 s; the runtime answers "pong" itself,
// without waking the room. A tab hidden for 10 s closes its socket and reconnects when it is shown
// again (the client does this), so the count is people looking at the site.
//
// Run locally: `pnpm realtime:dev`. Deploy: `pnpm realtime:deploy`.
import { DurableObject } from "cloudflare:workers";

const CAP = 28;
const ID = /^[A-Za-z0-9_-]{8,64}$/;
const MIN_GAP = 80; // ms between a tab's cursor messages; faster ones are dropped

type Seat = { id: string; tab: string; country: string; counted: boolean };
type Cursor = { id: string; x: number; y: number; path: string; name: string; msg: string; country: string };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export class Room extends DurableObject<Env> {
  private last = new Map<WebSocket, number>(); // in memory only: forgetting it on eviction is fine

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(request: Request): Promise<Response> {
    const q = new URL(request.url).searchParams;
    const id = q.get("id") ?? "", tab = q.get("tab") ?? "";
    if (!ID.test(id) || !ID.test(tab)) return new Response("expected ?id=<visitor>&tab=<tab>", { status: 400 });
    const country = (request.headers.get("x-country") ?? "").slice(0, 2).toUpperCase();

    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    const people = this.people();
    // already here in another tab, or a seat is free
    const counted = people.has(id) || people.size < CAP;
    server.serializeAttachment({ id, tab, country, counted } satisfies Seat);
    this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== "string" || message.length > 600) return;
    const seat = ws.deserializeAttachment() as Seat | null;
    if (!seat?.counted) return;
    const now = Date.now();
    if (now - (this.last.get(ws) ?? 0) < MIN_GAP) return;
    this.last.set(ws, now);

    let m: Record<string, unknown>;
    try {
      m = JSON.parse(message);
    } catch {
      return;
    }
    const x = m.x, y = m.y;
    if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const cursor: Cursor = {
      id: seat.tab,
      x: Math.min(1, Math.max(0, x)),
      y: Math.max(0, Math.min(1e6, y)),
      path: text(m.path, 120),
      name: text(m.name, 20),
      msg: text(m.msg, 120),
      country: seat.country,
    };
    this.send(JSON.stringify({ c: cursor }), ws);
  }

  async webSocketClose(ws: WebSocket) {
    this.left(ws);
  }

  async webSocketError(ws: WebSocket) {
    this.left(ws);
  }

  private left(ws: WebSocket) {
    this.last.delete(ws);
    const seat = ws.deserializeAttachment() as Seat | null;
    if (seat) this.send(JSON.stringify({ g: seat.tab }), ws);
    this.broadcast(ws);
  }

  /** Distinct counted visitors, leaving out a socket that is closing. */
  private people(leaving?: WebSocket) {
    const ids = new Set<string>();
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === leaving) continue;
      const seat = ws.deserializeAttachment() as Seat | null;
      if (seat?.counted) ids.add(seat.id);
    }
    return ids;
  }

  /** Seat whoever is waiting, then tell everyone the count. */
  private broadcast(leaving?: WebSocket) {
    const people = this.people(leaving);
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === leaving || people.size >= CAP) continue;
      const seat = ws.deserializeAttachment() as Seat | null;
      if (seat && !seat.counted) {
        ws.serializeAttachment({ ...seat, counted: true } satisfies Seat);
        people.add(seat.id);
      }
    }
    this.send(JSON.stringify({ n: people.size }), leaving);
  }

  private send(msg: string, except?: WebSocket) {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except) continue;
      try {
        ws.send(msg);
      } catch {
        // a socket mid-close; its own close event tidies up
      }
    }
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") return new Response("blank-realtime", { status: 426 });
    // only our own pages may join the room
    const origin = request.headers.get("Origin") ?? "";
    if (!env.ORIGINS.split(",").some((o) => origin === o.trim() || origin.endsWith(o.trim().replace(/^\*/, ""))))
      return new Response("origin not allowed", { status: 403 });
    // the country Cloudflare located the connection in, for the cursor's flag
    const headers = new Headers(request.headers);
    headers.set("x-country", typeof request.cf?.country === "string" ? request.cf.country : "");
    return env.ROOM.getByName("global").fetch(new Request(request, { headers }));
  },
} satisfies ExportedHandler<Env>;
