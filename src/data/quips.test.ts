import { describe, expect, it } from "vitest";
import {
  CLICKER_QUIPS,
  COMEBACK_QUIPS,
  clickerDwellMs,
  isKeyboardQuip,
  nextClickerQuip,
  nextQuip,
  pickQuip,
  quipMisfits,
  SPACEBAR_QUIPS,
  takeComebacks,
} from "./quips";

describe("SPACEBAR_QUIPS", () => {
  it("has a healthy supply of jokes", () => {
    expect(SPACEBAR_QUIPS.length).toBeGreaterThan(200);
  });

  it("starts mild and ends unhinged / clinical", () => {
    expect(SPACEBAR_QUIPS[0]).toMatch(/ok/i);
    expect(SPACEBAR_QUIPS.at(-1)).toMatch(/holding|diagnos/i);
  });

  it("pickQuip returns a string from the list", () => {
    const q = pickQuip(0.5, () => 0.5);
    expect(SPACEBAR_QUIPS).toContain(q);
  });

  it("higher intensity biases later entries", () => {
    const early = pickQuip(0, () => 0.5);
    const late = pickQuip(1, () => 0.5);
    const earlyIdx = SPACEBAR_QUIPS.indexOf(early);
    const lateIdx = SPACEBAR_QUIPS.indexOf(late);
    expect(lateIdx).toBeGreaterThan(earlyIdx);
  });

  it("nextQuip walks the list in order", () => {
    const a = nextQuip(0);
    const b = nextQuip(a.next);
    expect(a.text).toBe(SPACEBAR_QUIPS[0]);
    expect(b.text).toBe(SPACEBAR_QUIPS[1]);
    expect(b.next).toBe(2);
  });

  it("skips spacebar-only jokes for pointer holds", () => {
    const line = "Look at me I can hold SPACEBAR!!!11!1!elevn!one!!1!";
    expect(isKeyboardQuip(line)).toBe(true);
    const idx = SPACEBAR_QUIPS.indexOf(line);
    const q = nextQuip(idx, "pointer-hold");
    expect(q.text).not.toMatch(/spacebar/i);
    expect(isKeyboardQuip(q.text)).toBe(false);
  });

  it("keeps drum-pad jokes for mash, not for a hold", () => {
    const line = "You're playing this like a drum pad.";
    expect(quipMisfits(line, "space-hold")).toBe(true);
    expect(quipMisfits(line, "pointer-hold")).toBe(true);
    expect(quipMisfits(line, "spam")).toBe(false);
    expect(quipMisfits(line, "click")).toBe(false);
    expect(quipMisfits(line, "tap")).toBe(false);
    expect(nextQuip(SPACEBAR_QUIPS.indexOf(line), "space-hold").text).not.toBe(line);
    expect(nextClickerQuip(CLICKER_QUIPS.indexOf(line), "click").text).toBe(line);
  });

  it("skips hold jokes when they are just mashing space", () => {
    const line = "Look at me I can hold SPACEBAR!!!11!1!elevn!one!!1!";
    const idx = SPACEBAR_QUIPS.indexOf(line);
    const q = nextQuip(idx, "spam");
    expect(q.text).not.toBe(line);
    expect(quipMisfits(q.text, "spam")).toBe(false);
  });
});

describe("comeback + clicker quips", () => {
  it("has a decent comeback pool and picks seven unique", () => {
    expect(COMEBACK_QUIPS.length).toBeGreaterThanOrEqual(20);
    const picks = takeComebacks(7, () => 0.3);
    expect(picks).toHaveLength(7);
    expect(new Set(picks).size).toBe(7);
    for (const p of picks) expect(COMEBACK_QUIPS).toContain(p);
  });

  it("skips spacebar clicker lines on pointer taps", () => {
    const line = "That's a spacebar, not a woodpecker.";
    expect(CLICKER_QUIPS).toContain(line);
    const idx = CLICKER_QUIPS.indexOf(line);
    const q = nextClickerQuip(idx, "click");
    expect(q.text).not.toMatch(/spacebar/i);
  });

  it("skips hold and tap jokes when they are clicking", () => {
    const hold = "There is a hold function. Just saying.";
    const tap = "One digit per tap. Bold strategy.";
    expect(nextClickerQuip(CLICKER_QUIPS.indexOf(hold), "click").text).not.toBe(hold);
    expect(nextClickerQuip(CLICKER_QUIPS.indexOf(tap), "click").text).not.toBe(tap);
    expect(quipMisfits("Click. Click. Click.", "click")).toBe(false);
  });

  it("skips click and hold jokes when they are tapping", () => {
    const click = "Click. Click. Click.";
    const hold = "You could hold. You won't. I know.";
    expect(nextClickerQuip(CLICKER_QUIPS.indexOf(click), "tap").text).not.toBe(click);
    expect(nextClickerQuip(CLICKER_QUIPS.indexOf(hold), "tap").text).not.toBe(hold);
    expect(quipMisfits("One digit per tap. Bold strategy.", "tap")).toBe(false);
  });

  it("skips finger-on-screen clicker lines on keyboard taps", () => {
    const line = "You can just keep your finger on the screen. That's a feature.";
    const idx = CLICKER_QUIPS.indexOf(line);
    const q = nextClickerQuip(idx, "spam");
    expect(q.text).not.toBe(line);
  });

  it("each input still has a usable pile of jokes", () => {
    const usable = (list: readonly string[], behavior: Parameters<typeof quipMisfits>[1]) =>
      list.filter((s) => !quipMisfits(s, behavior)).length;
    expect(usable(SPACEBAR_QUIPS, "spam")).toBeGreaterThan(80);
    expect(usable(SPACEBAR_QUIPS, "pointer-hold")).toBeGreaterThan(80);
    expect(usable(CLICKER_QUIPS, "click")).toBeGreaterThan(8);
    expect(usable(CLICKER_QUIPS, "tap")).toBeGreaterThan(8);
    expect(usable(COMEBACK_QUIPS, "spam")).toBeGreaterThan(10);
  });

  it("dwells longer for longer clicker lines", () => {
    const short = clickerDwellMs("Click. Click. Click.", () => 0.5);
    const long = clickerDwellMs("A".repeat(80), () => 0.5);
    expect(long).toBeGreaterThan(short);
    expect(short).toBeGreaterThanOrEqual(2800);
    expect(short).toBeLessThanOrEqual(3200);
  });
});
