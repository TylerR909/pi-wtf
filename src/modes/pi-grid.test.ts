import { describe, expect, it } from "vitest";
import { buildPiBody, growShownChars, piDisplayBudget } from "./pi-grid";

describe("piDisplayBudget", () => {
  it("is 3. plus the remaining digits", () => {
    expect(piDisplayBudget(5000)).toBe(5001);
    expect(piDisplayBudget(0)).toBe(0);
  });
});

describe("buildPiBody", () => {
  const digits = "314159265358979";
  const slice = (a: number, b: number) => digits.slice(a, b);

  it("starts 3. and does not wrap", () => {
    expect(buildPiBody(8, 10, slice)).toBe("3.141592\n65");
    expect(buildPiBody(80, 200, slice)).not.toMatch(/3141592653589793/);
  });

  it("stops at the requested unique chars", () => {
    const body = buildPiBody(5, 7, slice);
    expect(body.replace(/\n/g, "")).toBe("3.14159");
  });
});

describe("growShownChars", () => {
  it("adds screens of unique chars without passing the cap", () => {
    expect(growShownChars(100, 10, 4, 1000, 2)).toBe(180);
    expect(growShownChars(990, 10, 4, 1000, 2)).toBe(1000);
  });
});
