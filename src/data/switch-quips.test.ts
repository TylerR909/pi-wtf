import { describe, expect, it } from "vitest";
import type { DigitQuipBehavior } from "./quips";
import {
  createSwitchMockPicker,
  isSamePressEscalation,
  shouldMockSwitch,
  switchMockLines,
} from "./switch-quips";

const BEHAVIORS: DigitQuipBehavior[] = ["space-hold", "pointer-hold", "spam", "click", "tap"];

describe("switch mocks", () => {
  it("has a line for every real switch", () => {
    for (const from of BEHAVIORS) {
      for (const to of BEHAVIORS) {
        if (from === to) {
          expect(switchMockLines(from, to)).toHaveLength(0);
          continue;
        }
        expect(switchMockLines(from, to).length, `${from} > ${to}`).toBeGreaterThan(2);
      }
    }
  });

  it("uses the spacebar-to-click bit", () => {
    expect(
      switchMockLines("space-hold", "click").some((s) => /spacebar/i.test(s) && /click/i.test(s)),
    ).toBe(true);
  });

  it("asks if they broke the mouse when they leave clicking", () => {
    for (const to of ["space-hold", "pointer-hold", "spam", "tap"] as const) {
      expect(switchMockLines("click", to)).toContain("Oh no did you break your mouse?");
    }
  });

  it("uses the finger-to-spam bit", () => {
    expect(switchMockLines("pointer-hold", "spam").some((s) => /spam/i.test(s))).toBe(true);
  });

  it("does not mock same-press peck into hold", () => {
    expect(isSamePressEscalation("spam", "space-hold")).toBe(true);
    expect(shouldMockSwitch("spam", "space-hold", 5000, true)).toBe(false);
    expect(shouldMockSwitch("spam", "space-hold", 5000, false)).toBe(true);
  });

  it("waits until they actually lived in the old style", () => {
    expect(shouldMockSwitch("space-hold", "click", 400, false)).toBe(false);
    expect(shouldMockSwitch("space-hold", "click", 1800, false)).toBe(true);
    expect(shouldMockSwitch("click", "spam", 400, false)).toBe(false);
    expect(shouldMockSwitch("click", "spam", 800, false)).toBe(true);
  });

  it("shuffles a pair without repeating until the bag is empty", () => {
    const picker = createSwitchMockPicker();
    const pool = switchMockLines("space-hold", "click");
    const seen = new Set<string>();
    for (let i = 0; i < pool.length; i++) {
      const line = picker.pick("space-hold", "click", () => 0.25);
      expect(line).toBeTruthy();
      expect(seen.has(line!)).toBe(false);
      seen.add(line!);
    }
    expect(seen.size).toBe(pool.length);
    const again = picker.pick("space-hold", "click", () => 0.25);
    expect(pool).toContain(again);
  });
});
