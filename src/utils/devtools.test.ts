import { describe, expect, it } from "vitest";
import { DEVTOOLS_QUIPS, dockedDevtools, PI_ASCII } from "./devtools";

describe("devtools detect", () => {
  it("treats a fat chrome gap as a docked panel", () => {
    expect(dockedDevtools(1280, 1280, 800, 780)).toBe(false);
    expect(dockedDevtools(1280, 1280, 900, 500)).toBe(true);
    expect(dockedDevtools(1400, 900, 800, 800)).toBe(true);
  });

  it("keeps the signature ask", () => {
    expect(DEVTOOLS_QUIPS[0]).toBe("What are you hoping to gain in here?");
  });

  it("draws a bar-and-two-legs π out of digits, no box", () => {
    const lines = PI_ASCII.split("\n");
    expect(lines[0]).toMatch(/3\.14159/);
    expect(lines.length).toBeGreaterThanOrEqual(5);
    expect(lines[3]).toMatch(/\d+.+\d+/);
    expect(PI_ASCII).not.toMatch(/[|/\\]/);
    expect(lines[1]).toContain("\u00A0");
  });
});
