import { useEffect } from "react";
import {
  claimTabId,
  readPulseRegistry,
  TAB_CHANNEL,
  TAB_HEARTBEAT_MS,
  TAB_PULSE_PREFIX,
  TAB_SESSION_KEY,
  TAB_STALE_MS,
  tabPulseKey,
} from "../utils/tabs";

type Listener = (count: number) => void;

const listeners = new Set<Listener>();
let live = 1;

export function getLiveTabCount(): number {
  if (typeof localStorage === "undefined") return live;
  try {
    const n = Object.keys(readPulseRegistry(localStorage, Date.now())).length;
    return Math.max(live, n);
  } catch {
    return live;
  }
}

export function subscribeTabCount(fn: Listener): () => void {
  listeners.add(fn);
  fn(getLiveTabCount());
  return () => {
    listeners.delete(fn);
  };
}

function emit(count: number) {
  if (count === live) return;
  live = count;
  for (const fn of listeners) fn(count);
}

/**
 * Advertise this tab with its own localStorage pulse + BroadcastChannel.
 * A shared JSON blob used to last-write-wins itself down to 1.
 */
export function useTabPresence() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return;

    const now0 = Date.now();
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(TAB_SESSION_KEY);
    } catch {
      /* private mode */
    }
    const registry = readPulseRegistry(localStorage, now0);
    const id = claimTabId(stored, registry, now0);
    try {
      sessionStorage.setItem(TAB_SESSION_KEY, id);
    } catch {
      /* ignore */
    }

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(TAB_CHANNEL);
    } catch {
      channel = null;
    }
    const peers = new Map<string, number>();

    const publish = () => {
      const now = Date.now();
      for (const [pid, at] of peers) {
        if (now - at >= TAB_STALE_MS) peers.delete(pid);
      }
      const fromStore = Object.keys(readPulseRegistry(localStorage, now)).length;
      emit(Math.max(fromStore, peers.size + 1));
    };

    const beat = () => {
      const now = Date.now();
      try {
        localStorage.setItem(tabPulseKey(id), String(now));
      } catch {
        /* quota */
      }
      try {
        channel?.postMessage({ t: "hello", id, at: now });
      } catch {
        /* closed */
      }
      publish();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key && !e.key.startsWith(TAB_PULSE_PREFIX)) return;
      publish();
    };

    const onMessage = (e: MessageEvent) => {
      const msg = e.data as { t?: string; id?: string; at?: number } | null;
      if (!msg?.id || msg.id === id) return;
      if (msg.t === "bye") peers.delete(msg.id);
      else {
        peers.set(msg.id, typeof msg.at === "number" ? msg.at : Date.now());
        if (msg.t === "hello") {
          try {
            channel?.postMessage({ t: "here", id, at: Date.now() });
          } catch {
            /* closed */
          }
        }
      }
      publish();
    };

    const leave = () => {
      try {
        localStorage.removeItem(tabPulseKey(id));
      } catch {
        /* ignore */
      }
      try {
        channel?.postMessage({ t: "bye", id });
      } catch {
        /* ignore */
      }
    };

    beat();
    const tick = window.setInterval(beat, TAB_HEARTBEAT_MS + Math.floor(Math.random() * 400));
    window.addEventListener("storage", onStorage);
    window.addEventListener("pagehide", leave);
    channel?.addEventListener("message", onMessage);

    return () => {
      window.clearInterval(tick);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pagehide", leave);
      leave();
      try {
        channel?.close();
      } catch {
        /* ignore */
      }
    };
  }, []);
}
