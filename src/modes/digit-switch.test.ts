import { describe, expect, it } from "vitest";
import { HOLD_ARM_MS } from "./digit-play";
import { createSwitchTracker, switchCandidate } from "./digit-switch";

describe("switchCandidate", () => {
  it("does not commit on the way down", () => {
    expect(
      switchCandidate({
        kind: "down",
        now: 10,
        pressAt: 10,
        pressing: true,
        pointerKind: null,
      }),
    ).toBeNull();
  });

  it("calls a short space a mash and a long space a hold", () => {
    expect(
      switchCandidate({
        kind: "up",
        now: 120,
        pressAt: 0,
        pressing: false,
        pointerKind: null,
      }),
    ).toBe("spam");
    expect(
      switchCandidate({
        kind: "tick",
        now: HOLD_ARM_MS,
        pressAt: 0,
        pressing: true,
        pointerKind: null,
      }),
    ).toBe("space-hold");
  });

  it("does not treat letting go of a hold as spam", () => {
    expect(
      switchCandidate({
        kind: "up",
        now: 4000,
        pressAt: 0,
        pressing: false,
        pointerKind: null,
      }),
    ).toBeNull();
  });

  it("tells mouse from glass", () => {
    expect(
      switchCandidate({
        kind: "up",
        now: 80,
        pressAt: 0,
        pressing: false,
        pointerKind: "mouse",
      }),
    ).toBe("click");
    expect(
      switchCandidate({
        kind: "up",
        now: 80,
        pressAt: 0,
        pressing: false,
        pointerKind: "touch",
      }),
    ).toBe("tap");
  });
});

describe("createSwitchTracker", () => {
  it("lets the first style land free", () => {
    const t = createSwitchTracker();
    expect(
      t.observe({
        behavior: "space-hold",
        now: 2000,
        pressAt: 0,
        pressing: true,
      }),
    ).toBeNull();
    expect(t.settled()).toBe("space-hold");
  });

  it("roasts hold → click after they actually held", () => {
    const t = createSwitchTracker();
    t.observe({ behavior: "space-hold", now: 0, pressAt: 0, pressing: true, rng: () => 0.2 });
    const line = t.observe({
      behavior: "click",
      now: 2500,
      pressAt: 2400,
      pressing: false,
      rng: () => 0.2,
    });
    expect(line).toMatch(/click|mouse/i);
  });

  it("does not roast a first press that turns into a hold", () => {
    const t = createSwitchTracker();
    t.observe({ behavior: "spam", now: 80, pressAt: 0, pressing: false });
    expect(
      t.observe({
        behavior: "space-hold",
        now: HOLD_ARM_MS,
        pressAt: 0,
        pressing: true,
      }),
    ).toBeNull();
    expect(t.settled()).toBe("space-hold");
  });

  it("does not roast a tiny fidget", () => {
    const t = createSwitchTracker();
    t.observe({ behavior: "click", now: 0, pressAt: 0, pressing: false });
    expect(
      t.observe({
        behavior: "spam",
        now: 200,
        pressAt: 180,
        pressing: false,
      }),
    ).toBeNull();
  });
});
