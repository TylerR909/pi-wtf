import { describe, expect, it } from "vitest";
import { PI_CHUNK, PI_DIGIT_COUNT, PI_DIGITS, piAt, piLength, piSlice } from "./pi";
import { PI_SEED, PI_SEED_COUNT } from "./pi-seed";

describe("chunked π table", () => {
  it("ships a 5k seed immediately", () => {
    expect(PI_SEED_COUNT).toBe(5000);
    expect(piLength()).toBeGreaterThanOrEqual(5000);
    expect(PI_DIGIT_COUNT).toBe(piLength());
    expect(PI_DIGITS.startsWith("314159265358979")).toBe(true);
  });

  it("indexes across chunk boundaries", () => {
    const i = PI_CHUNK - 2;
    const window = PI_SEED.slice(i, i + 6);
    expect(piSlice(i, i + 6)).toBe(window);
    expect(piAt(i) + piAt(i + 1) + piAt(i + 2)).toBe(window.slice(0, 3));
    expect(PI_DIGITS[i]).toBe(window[0]);
  });

  it("slice matches the seed prefix", () => {
    expect(piSlice(0, 20)).toBe(PI_SEED.slice(0, 20));
    expect(PI_DIGITS.slice(0, 20)).toBe(PI_SEED.slice(0, 20));
  });
});
