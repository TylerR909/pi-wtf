import { describe, expect, it } from "vitest";
import { readSwipe } from "./useSwipe";

describe("readSwipe", () => {
  it("needs a real horizontal flick", () => {
    expect(readSwipe(20, 0)).toBeNull();
    expect(readSwipe(20, 40)).toBeNull();
    expect(readSwipe(-80, 70)).toBeNull();
  });

  it("maps left / right", () => {
    expect(readSwipe(-80, 10)).toBe("left");
    expect(readSwipe(80, -8)).toBe("right");
  });
});
