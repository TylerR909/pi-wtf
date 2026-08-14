/** Per-tab id lives in sessionStorage (refresh = same tab). */
export const TAB_SESSION_KEY = "pi-wtf-tab-id";
/** One localStorage key per tab so heartbeats cannot overwrite each other. */
export const TAB_PULSE_PREFIX = "pi-wtf-tab-pulse:";
export const TAB_STALE_MS = 4000;
export const TAB_HEARTBEAT_MS = 1500;
export const TAB_CHANNEL = "pi-wtf-tabs";

export function tabPulseKey(id: string): string {
  return `${TAB_PULSE_PREFIX}${id}`;
}

export type TabRegistry = Record<string, number>;

export function mintTabId(): string {
  return (
    crypto.randomUUID?.() ?? `t${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  );
}

/**
 * Reuse this tab's session id unless another live tab already claimed it
 * (Chrome duplicates sessionStorage when you Duplicate Tab).
 */
export function claimTabId(
  stored: string | null,
  registry: TabRegistry,
  now: number,
  staleMs = TAB_STALE_MS,
  mint = mintTabId,
): string {
  if (stored) {
    const last = registry[stored];
    if (last == null || now - last >= staleMs) return stored;
  }
  return mint();
}

export function pruneTabs(registry: TabRegistry, now: number, staleMs = TAB_STALE_MS): TabRegistry {
  const next: TabRegistry = {};
  for (const [id, at] of Object.entries(registry)) {
    if (now - at < staleMs) next[id] = at;
  }
  return next;
}

export function liveTabCount(registry: TabRegistry, now: number, staleMs = TAB_STALE_MS): number {
  return Object.keys(pruneTabs(registry, now, staleMs)).length;
}

export function readTabRegistry(raw: string | null): TabRegistry {
  if (raw == null || raw === "") return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const next: TabRegistry = {};
    for (const [id, at] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof at === "number" && Number.isFinite(at)) next[id] = at;
    }
    return next;
  } catch {
    return {};
  }
}

/** Scan localStorage for live pulse keys (no shared JSON blob). */
export function readPulseRegistry(
  storage: Storage,
  now: number,
  staleMs = TAB_STALE_MS,
): TabRegistry {
  const next: TabRegistry = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key?.startsWith(TAB_PULSE_PREFIX)) continue;
    const at = Number(storage.getItem(key));
    if (!Number.isFinite(at) || now - at >= staleMs) continue;
    next[key.slice(TAB_PULSE_PREFIX.length)] = at;
  }
  return next;
}
