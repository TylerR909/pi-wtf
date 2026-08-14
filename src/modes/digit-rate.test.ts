import { describe, expect, it } from "vitest";
import { pruneRateStamps, RATE_WINDOW_MS, stampRatePerMin } from "./digit-rate";

function fill(start: number, end: number, gap: number): number[] {
  const out: number[] = [];
  for (let t = start; t < end; t += gap) out.push(t);
  return out;
}

describe("stampRatePerMin", () => {
  it("is zero with no stamps", () => {
    expect(stampRatePerMin([], 1000)).toBe(0);
  });

  it("treats a full 16ms hold window as a few thousand /min", () => {
    const end = 20_000;
    const stamps = fill(end - RATE_WINDOW_MS, end, 16);
    expect(stampRatePerMin(stamps, end)).toBeGreaterThan(3000);
  });

  it("tapers as old hold stamps leave the window", () => {
    const end = 20_000;
    const stamps = fill(end - RATE_WINDOW_MS, end, 16);
    const hi = stampRatePerMin(stamps, end);
    const mid = stampRatePerMin(stamps, end + RATE_WINDOW_MS / 2);
    const lo = stampRatePerMin(stamps, end + RATE_WINDOW_MS);
    expect(mid).toBeGreaterThan(1000);
    expect(mid).toBeLessThan(hi);
    expect(lo).toBe(0);
  });
});

describe("pruneRateStamps", () => {
  it("drops stamps that aged out", () => {
    const stamps = [0, 1000, 4000, 5000];
    expect(pruneRateStamps(stamps, 5500)).toEqual([1000, 4000, 5000]);
    expect(pruneRateStamps(stamps, 10_000)).toEqual([]);
  });
});
