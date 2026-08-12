import { describe, expect, it } from "vitest";
import { PI_DIGIT_COUNT, PI_DIGITS } from "./pi-digits";

describe("PI_DIGITS", () => {
  it("starts with the famous prefix", () => {
    expect(PI_DIGITS.startsWith("314159265358979")).toBe(true);
  });

  it("has thousands of digits", () => {
    expect(PI_DIGIT_COUNT).toBeGreaterThanOrEqual(5000);
    expect(PI_DIGITS.length).toBe(PI_DIGIT_COUNT);
  });

  it("contains only digit characters", () => {
    expect(/^\d+$/.test(PI_DIGITS)).toBe(true);
  });
});
