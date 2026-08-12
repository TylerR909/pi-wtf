import { describe, expect, it } from "vitest";
import { piInBase } from "./base";

describe("piInBase", () => {
  it("returns decimal-ish for base 10", () => {
    const s = piInBase(10, 20);
    expect(s.startsWith("3.14159265358979323846")).toBe(true);
  });

  it("converts to binary with known prefix", () => {
    // π ≈ 11.00100100001111110110…₂
    const s = piInBase(2, 20);
    expect(s.startsWith("11.00100100001111110110")).toBe(true);
  });

  it("converts to hex with known prefix", () => {
    // π ≈ 3.243F6A8885A3…₁₆
    const s = piInBase(16, 12).toLowerCase();
    expect(s.startsWith("3.243f6a8885a3")).toBe(true);
  });

  it("rejects invalid bases", () => {
    expect(() => piInBase(1, 10)).toThrow();
    expect(() => piInBase(37, 10)).toThrow();
  });
});
