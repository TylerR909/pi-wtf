import { describe, expect, it } from "vitest";
import {
  addDigitToScore,
  isNewHighScore,
  nextTaint,
  pickTaintQuip,
  shouldCelebrateScore,
  shuffleScoreFrames,
  TAB_TAINT_QUIPS,
  TAINT_QUIPS,
} from "./trainer-score";

describe("trainer taint + high score", () => {
  it("sums entered digits and skips the leading 3", () => {
    let n = 0;
    for (const d of "1415") n = addDigitToScore(n, d);
    expect(n).toBe(11);
    expect(addDigitToScore(0, "3")).toBe(3);
    expect(addDigitToScore(11, ".")).toBe(11);
  });

  it("only taints on an Endless miss", () => {
    expect(nextTaint(false, true, false)).toBe(true);
    expect(nextTaint(false, true, true)).toBe(false);
    expect(nextTaint(false, false, false)).toBe(false);
    expect(nextTaint(true, false, true)).toBe(true);
  });

  it("refuses trophies on a tainted run", () => {
    expect(isNewHighScore(80, 10, true)).toBe(false);
    expect(shouldCelebrateScore(80, true)).toBe(false);
    expect(isNewHighScore(80, 10, false)).toBe(true);
    expect(shouldCelebrateScore(51, false)).toBe(true);
    expect(shouldCelebrateScore(50, false)).toBe(false);
    expect(isNewHighScore(10, 10, false)).toBe(false);
  });

  it("has a pile of cheat-callout quips", () => {
    expect(TAINT_QUIPS.length).toBeGreaterThanOrEqual(10);
    expect(TAINT_QUIPS).toContain(`Nice "score" you dirty cheater.`);
    expect(TAINT_QUIPS).toContain("Didn't count. I saw what you did.");
    expect(TAINT_QUIPS).toContain(pickTaintQuip("endless", () => 0));
    expect(TAB_TAINT_QUIPS).toContain("You thought we wouldn't notice?");
    expect(TAB_TAINT_QUIPS).toContain(pickTaintQuip("tabs", () => 0));
  });

  it("shuffles then lands on the real score, same digit count the whole way", () => {
    const frames = shuffleScoreFrames(314, () => 0.5);
    expect(frames.at(-1)).toBe(314);
    expect(frames.length).toBeGreaterThan(8);
    expect(frames.some((n) => n !== 314)).toBe(true);
    for (const n of frames) expect(String(n).length).toBe(3);

    const two = shuffleScoreFrames(47, () => 0.1);
    expect(two.at(-1)).toBe(47);
    for (const n of two) expect(String(n).length).toBe(2);
  });
});
