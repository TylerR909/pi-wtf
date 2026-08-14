import { describe, expect, it } from "vitest";
import {
  claimTabId,
  liveTabCount,
  pruneTabs,
  readPulseRegistry,
  readTabRegistry,
  tabPulseKey,
} from "./tabs";

describe("tab presence", () => {
  it("reuses a session id when that slot is empty or stale", () => {
    expect(claimTabId("aaa", {}, 1000, 400, () => "new")).toBe("aaa");
    expect(claimTabId("aaa", { aaa: 100 }, 1000, 400, () => "new")).toBe("aaa");
  });

  it("mints a new id when this session id is already live (duplicated tab)", () => {
    expect(claimTabId("aaa", { aaa: 900 }, 1000, 400, () => "clone")).toBe("clone");
  });

  it("counts only fresh heartbeats", () => {
    const reg = { a: 1000, b: 500, c: 900 };
    expect(liveTabCount(reg, 1000, 400)).toBe(2);
    expect(pruneTabs(reg, 1000, 400)).toEqual({ a: 1000, c: 900 });
  });

  it("reads a registry blob", () => {
    expect(readTabRegistry(null)).toEqual({});
    expect(readTabRegistry(`{"x":1,"y":"nope"}`)).toEqual({ x: 1 });
  });

  it("counts per-tab pulse keys without one blob overwriting another", () => {
    const store = new Map<string, string>();
    const storage = {
      get length() {
        return store.size;
      },
      key(i: number) {
        return [...store.keys()][i] ?? null;
      },
      getItem(k: string) {
        return store.get(k) ?? null;
      },
      setItem(k: string, v: string) {
        store.set(k, v);
      },
      removeItem(k: string) {
        store.delete(k);
      },
      clear() {
        store.clear();
      },
    } as Storage;
    storage.setItem(tabPulseKey("a"), "1000");
    storage.setItem(tabPulseKey("b"), "980");
    storage.setItem("pi-wtf-other", "nope");
    expect(readPulseRegistry(storage, 1000, 400)).toEqual({ a: 1000, b: 980 });
    expect(liveTabCount(readPulseRegistry(storage, 1000, 400), 1000, 400)).toBe(2);
  });
});
