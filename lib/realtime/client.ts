// The browser's side of the realtime room (realtime/worker.ts): one WebSocket per tab, shared by the
// nav's "Online (n)", the other visitors' cursors, and the chat. Components read it with
// useRealtime() and change it with setChat() / setName().
//
// After basement.studio's client:
//   joining    a stable visitor id from localStorage (two tabs count once) and an id per tab, for
//              its cursor. With no NEXT_PUBLIC_REALTIME_URL nothing connects and nothing shows.
//   line       "ping" every 25 s; no "pong" before the next one closes the line, and a dropped line
//              reconnects after 1 to 5 s. A tab hidden for 10 s leaves, and rejoins when shown.
//   cursor     the mouse position as a fraction of the window's width and a page offset in px, so
//              it lands on the same content at any window size. Sent at most every 250 ms (500 ms
//              with more than 6 people here), only when someone else is here, and only if it moved
//              2 px or the name or message changed. When someone arrives, the last position goes out
//              at once, so they see you without waiting for you to move.
import { useSyncExternalStore } from "react";

export type Cursor = { id: string; x: number; y: number; path: string; name: string; msg: string; country: string };
type State = {
  /** people here, or null before the room has answered */
  n: number | null;
  cursors: Readonly<Record<string, Cursor>>;
  name: string;
  /** the message showing at my cursor, for 6 s after sending */
  msg: string;
};

// absolute in production (the deployed worker); "/_realtime" in dev, which next.config.ts forwards
// to the local worker, so it works on whatever host the page came from (portless or a tunnel)
const URL_ = process.env.NEXT_PUBLIC_REALTIME_URL;
const PING = 25_000, HIDDEN = 10_000, MSG_FOR = 6_000;

const EMPTY: State = { n: null, cursors: {}, name: "", msg: "" }; // also what the server renders
let state: State = EMPTY;
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

/** Read the room: `useRealtime((s) => s.n)`. */
export function useRealtime<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => pick(state),
    () => pick(EMPTY),
  );
}

export const realtimeEnabled = Boolean(URL_);

let msgTimer = 0;
/** Show a message at my cursor, to everyone on the page, for 6 s. */
export function setChat(msg: string) {
  clearTimeout(msgTimer);
  set({ msg: msg.trim().slice(0, 120) });
  if (state.msg) msgTimer = window.setTimeout(() => (set({ msg: "" }), push()), MSG_FOR);
  push();
}
/** Name my cursor; kept in localStorage. */
export function setName(name: string) {
  const n = name.trim().slice(0, 20);
  try {
    localStorage.setItem("rt-cursor-name", n);
  } catch {}
  set({ name: n });
  push();
}

const store = (key: string, make: () => string) => {
  try {
    let v = localStorage.getItem(key);
    if (!v) localStorage.setItem(key, (v = make()));
    return v;
  } catch {
    return make(); // storage blocked: count this page view alone
  }
};
const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);

let ws: WebSocket | null = null;
let last: { x: number; y: number } | null = null; // my latest position
let sent: { x: number; y: number; name: string; msg: string } | null = null;
let sentAt = -Infinity, pending = 0;

/** Send my cursor now, or as soon as the throttle allows. */
function push() {
  if (pending) return;
  const gap = sentAt + ((state.n ?? 0) > 6 ? 500 : 250) - performance.now();
  if (gap > 0) return void (pending = window.setTimeout(() => ((pending = 0), push()), gap));
  if (!ws || ws.readyState !== WebSocket.OPEN || (state.n ?? 0) <= 1) return;
  const at = last ?? (state.msg || state.name ? { x: 0.5, y: scrollY + innerHeight / 2 } : null);
  if (!at) return;
  const same = sent && sent.name === state.name && sent.msg === state.msg;
  if (same && ((at.x - sent!.x) * innerWidth) ** 2 + (at.y - sent!.y) ** 2 < 4) return;
  ws.send(JSON.stringify({ ...at, path: location.pathname, name: state.name, msg: state.msg }));
  sent = { ...at, name: state.name, msg: state.msg };
  sentAt = performance.now();
}

/** Join the room for the life of the page; returns the leave function. Called once, from <Realtime />. */
export function connect() {
  if (!URL_) return () => {};
  const id = store("rt-visitor-id", newId), tab = newId();
  set({ name: (() => { try { return localStorage.getItem("rt-cursor-name") ?? ""; } catch { return ""; } })() });
  let ping = 0, retry = 0, away = 0, alive = true, waiting = false;

  const open = () => {
    if (!alive || ws || document.hidden) return;
    const sock = (ws = new WebSocket(new URL(`${URL_}?id=${id}&tab=${tab}`, location.href.replace(/^http/, "ws"))));
    sent = null;
    sock.onmessage = (e) => {
      if (e.data === "pong") return void (waiting = false);
      let m: { n?: number; c?: Cursor; g?: string };
      try {
        m = JSON.parse(e.data);
      } catch {
        return;
      }
      if (typeof m.n === "number") {
        const before = state.n ?? 0;
        set({ n: m.n });
        if (before <= 1 && m.n > 1) push(); // someone arrived: show them where I am
      }
      if (m.c && typeof m.c.id === "string") set({ cursors: { ...state.cursors, [m.c.id]: m.c } });
      if (typeof m.g === "string" && m.g in state.cursors) {
        const rest = { ...state.cursors };
        delete rest[m.g];
        set({ cursors: rest });
      }
    };
    sock.onopen = () => {
      waiting = false;
      ping = window.setInterval(() => {
        if (waiting) return sock.close(); // no pong since the last ping: the line is dead
        waiting = true;
        sock.send("ping");
      }, PING);
    };
    sock.onclose = () => {
      clearInterval(ping);
      if (ws !== sock) return;
      ws = null;
      set({ n: null, cursors: {} });
      if (alive && !document.hidden) retry = window.setTimeout(open, 1000 + 4000 * Math.random());
    };
  };
  const leave = () => {
    clearInterval(ping);
    clearTimeout(retry);
    const sock = ws;
    ws = null;
    sock?.close();
    set({ n: null, cursors: {} });
  };
  const visibility = () => {
    clearTimeout(away);
    if (document.hidden) away = window.setTimeout(leave, HIDDEN);
    else open();
  };
  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    last = { x: e.clientX / innerWidth, y: e.clientY + scrollY };
    push();
  };

  open();
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("pagehide", leave);
  window.addEventListener("pageshow", open);
  window.addEventListener("pointermove", move, { passive: true });
  return () => {
    alive = false;
    clearTimeout(away);
    clearTimeout(pending);
    pending = 0;
    leave();
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("pagehide", leave);
    window.removeEventListener("pageshow", open);
    window.removeEventListener("pointermove", move);
  };
}
