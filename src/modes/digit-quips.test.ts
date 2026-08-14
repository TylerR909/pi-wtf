import { afterEach, describe, expect, it, vi } from "vitest";
import { createQuipQueue, MOCK_MIN_DWELL_MS, mockDwellMs } from "./digit-quips";

afterEach(() => {
  vi.useRealTimers();
});

describe("mockDwellMs", () => {
  it("never goes below the mock floor", () => {
    expect(mockDwellMs("Hi.", () => 0.5)).toBeGreaterThanOrEqual(MOCK_MIN_DWELL_MS);
  });
});

describe("createQuipQueue", () => {
  it("holds the current line until its dwell ends", () => {
    vi.useFakeTimers();
    const shown: string[] = [];
    const q = createQuipQueue({
      show: (t) => shown.push(t),
      hide: () => shown.push("HIDE"),
    });
    expect(q.push("first", 3000)).toBe("shown");
    expect(q.push("switch", 3600)).toBe("queued");
    expect(shown).toEqual(["first"]);
    vi.advanceTimersByTime(2999);
    expect(shown).toEqual(["first"]);
    vi.advanceTimersByTime(1);
    expect(shown).toEqual(["first", "switch"]);
    q.dispose();
  });

  it("does not honor a hide until the dwell is done", () => {
    vi.useFakeTimers();
    const shown: string[] = [];
    const q = createQuipQueue({
      show: (t) => shown.push(t),
      hide: () => shown.push("HIDE"),
    });
    q.push("stay", 3600);
    q.hideIn(100);
    vi.advanceTimersByTime(3599);
    expect(shown).toEqual(["stay"]);
    vi.advanceTimersByTime(1);
    expect(shown).toEqual(["stay", "HIDE"]);
    q.dispose();
  });

  it("lets a queued switch beat a pending hide", () => {
    vi.useFakeTimers();
    const shown: string[] = [];
    const q = createQuipQueue({
      show: (t) => shown.push(t),
      hide: () => shown.push("HIDE"),
    });
    q.push("clicker", 2000);
    q.hideIn(400);
    q.push("oh you found the hold", 3600);
    vi.advanceTimersByTime(2000);
    expect(shown).toEqual(["clicker", "oh you found the hold"]);
    vi.advanceTimersByTime(3600);
    expect(shown).not.toContain("HIDE");
    q.hideIn(0);
    vi.advanceTimersByTime(0);
    expect(shown.at(-1)).toBe("HIDE");
    q.dispose();
  });

  it("caps the waiting list so fidgets do not stack forever", () => {
    vi.useFakeTimers();
    const shown: string[] = [];
    const q = createQuipQueue({
      show: (t) => shown.push(t),
      hide: () => shown.push("HIDE"),
    });
    q.push("a", 1000);
    q.push("b", 1000);
    q.push("c", 1000);
    q.push("d", 1000);
    expect(q.pendingCount()).toBe(2);
    vi.advanceTimersByTime(1000);
    expect(shown).toEqual(["a", "c"]);
    vi.advanceTimersByTime(1000);
    expect(shown).toEqual(["a", "c", "d"]);
    q.dispose();
  });
});
