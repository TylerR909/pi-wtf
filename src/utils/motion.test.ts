import { describe, expect, it } from "vitest";
import { motionDelta } from "./motion";

describe("motionDelta", () => {
  it("is ~0 when the phone is still", () => {
    expect(motionDelta({ x: 0, y: 0, z: 9.8 }, { x: 0.1, y: -0.1, z: 9.7 })).toBeCloseTo(0.3);
  });

  it("is large on a shake", () => {
    expect(motionDelta({ x: 0, y: 0, z: 9.8 }, { x: 18, y: -12, z: 2 })).toBeGreaterThan(22);
  });
});
