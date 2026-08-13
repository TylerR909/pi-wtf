import { describe, expect, it } from "vitest";
import {
  allUselessFacts,
  digitIndexHas67,
  digitNumFromDisplayIndex,
  digitRangeFromDisplay,
  formatPiSelRange,
  formatPiSelTip,
  SIXTY_SEVEN_LINE,
  yn,
} from "./pi-selection";

describe("digitNumFromDisplayIndex", () => {
  it("counts 3 as #1; 3.14 are the first three digits", () => {
    expect(digitNumFromDisplayIndex(0)).toBe(1);
    expect(digitNumFromDisplayIndex(1)).toBeNull();
    expect(digitNumFromDisplayIndex(2)).toBe(2);
    expect(digitNumFromDisplayIndex(3)).toBe(3);
    expect(digitNumFromDisplayIndex(3468)).toBe(3468);
  });
});

describe("digitRangeFromDisplay", () => {
  it("skips the decimal point", () => {
    expect(digitRangeFromDisplay(0, 4)).toEqual([1, 4]);
    expect(digitRangeFromDisplay(1, 1)).toBeNull();
    expect(digitRangeFromDisplay(2, 2)).toEqual([2, 2]);
  });

  it("returns a closed range of 1-indexed digits", () => {
    expect(digitRangeFromDisplay(3468, 3784)).toEqual([3468, 3784]);
  });
});

describe("formatPiSelRange", () => {
  it("formats a single index and a span", () => {
    expect(formatPiSelRange(3467, 3467, "en-US")).toBe("#3,467");
    expect(formatPiSelRange(3467, 3783, "en-US")).toBe("#3,467 - #3,783");
  });
});

describe("useless facts", () => {
  const rng = () => 0.5;

  it("knows sum, pairs, and three-peats", () => {
    const facts = allUselessFacts("3344888", rng);
    expect(facts).toContain("sum: 38");
    expect(facts).toContain("pairs: 3");
    expect(facts).toContain("three-peats?: yes");
    expect(facts.some((f) => /^any \ds: /.test(f))).toBe(true);
    expect(facts.some((f) => /^has a \d\?: /.test(f))).toBe(true);
    expect(facts.some((f) => /^checksum mod \d+: \d+$/.test(f))).toBe(true);
    expect(facts.some((f) => f.startsWith("checksum mod 9:"))).toBe(false);

    const other = allUselessFacts("3344888", () => 0.1);
    const digitOf = (rows: string[], re: RegExp) => rows.find((f) => re.test(f))?.match(re)?.[1];
    expect(digitOf(facts, /^any (\d)s:/)).not.toBe(digitOf(other, /^any (\d)s:/));
  });

  it("sometimes answers yes/no with extra personality", () => {
    expect(yn(true, () => 0.5)).toBe("yes");
    expect(yn(false, () => 0.5)).toBe("no");
    expect(yn(true, () => 0.05)).toBe("you betcha");
    expect(yn(true, () => 0.15)).toBe("sure thing");
    expect(yn(false, () => 0.05)).toBe("wouldn't count on it");
  });

  it("is stable for the same selection and caps extra lines", () => {
    const a = formatPiSelTip(10, 16, "3344888", "en-US");
    const b = formatPiSelTip(10, 16, "3344888", "en-US");
    expect(a).toEqual(b);
    expect(a.range).toBe("#10 - #16");
    expect(a.facts.length).toBeGreaterThan(0);
    expect(a.facts.length).toBeLessThanOrEqual(5);
  });

  it("chants 67 when either endpoint's digit # contains 67", () => {
    expect(digitIndexHas67(2367, 6783)).toBe(true);
    expect(digitIndexHas67(1677)).toBe(true);
    expect(digitIndexHas67(10, 16)).toBe(false);
    const hit = formatPiSelTip(2367, 6783, "14159", "en-US");
    expect(hit.facts[0]).toBe(SIXTY_SEVEN_LINE);
    const mid = formatPiSelTip(1677, 1677, "9", "en-US");
    expect(mid.facts[0]).toBe(SIXTY_SEVEN_LINE);
    const miss = formatPiSelTip(10, 16, "3344888", "en-US");
    expect(miss.facts).not.toContain(SIXTY_SEVEN_LINE);
  });
});
