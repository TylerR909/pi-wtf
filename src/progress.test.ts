import { beforeEach, describe, expect, it } from "vitest";
import { beginMode, getDigitQuips, getProgress, reportProgress, saveDigitQuips } from "./progress";

describe("progress + digit quips", () => {
  beforeEach(() => {
    beginMode("quiz");
  });

  it("Pi is a peek: digit spot and quips survive a detour", () => {
    beginMode("digit");
    reportProgress(40);
    saveDigitQuips({ holdCursor: 12, clickerCursor: 4, holdQuipsEmitted: true });

    beginMode("pi");
    expect(getProgress()).toBe(40);
    expect(getDigitQuips().holdCursor).toBe(12);

    beginMode("digit");
    expect(getProgress()).toBe(40);
    expect(getDigitQuips()).toEqual({
      holdCursor: 12,
      clickerCursor: 4,
      holdQuipsEmitted: true,
    });
  });

  it("leaving for another play mode resets both", () => {
    beginMode("digit");
    reportProgress(20);
    saveDigitQuips({ holdCursor: 8, clickerCursor: 2, holdQuipsEmitted: true });
    beginMode("tape");
    expect(getProgress()).toBe(0);
    expect(getDigitQuips().holdCursor).toBe(0);
    expect(getDigitQuips().holdQuipsEmitted).toBe(false);
  });
});
