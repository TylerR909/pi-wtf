import { describe, expect, it } from "vitest";
import { pickQuip, SPACEBAR_QUIPS } from "./quips";

describe("SPACEBAR_QUIPS", () => {
  it("has a healthy supply of jokes", () => {
    expect(SPACEBAR_QUIPS.length).toBeGreaterThan(200);
  });

  it("pickQuip returns a string from the list", () => {
    const q = pickQuip(0.5, () => 0.5);
    expect(SPACEBAR_QUIPS).toContain(q);
  });

  it("higher intensity biases later entries", () => {
    const early = pickQuip(0, () => 0);
    const late = pickQuip(1, () => 0.99);
    const earlyIdx = SPACEBAR_QUIPS.indexOf(early);
    const lateIdx = SPACEBAR_QUIPS.indexOf(late);
    expect(lateIdx).toBeGreaterThan(earlyIdx);
  });
});
