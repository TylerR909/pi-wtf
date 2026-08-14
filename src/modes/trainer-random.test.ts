import { describe, expect, it } from "vitest";
import { pickRandomGag, randomTrainerSide } from "./trainer-random";

describe("trainer random", () => {
  it("defaults to Quiz's 25% hit rate", () => {
    let hit = 0;
    for (let i = 0; i < 400; i++) {
      if (randomTrainerSide("left", () => (i % 4) / 4) === "left") hit += 1;
    }
    expect(hit).toBe(100);
  });

  it("can be tuned to Trainer's 60% hit rate", () => {
    let hit = 0;
    for (let i = 0; i < 500; i++) {
      if (randomTrainerSide("left", () => (i % 5) / 5, 0.6) === "left") hit += 1;
    }
    expect(hit).toBe(300);
  });

  it("has an immediate oops / gaslight line", () => {
    expect(pickRandomGag(1, () => 0)).toMatch(/Oops|Sorry|thought|bad|Oh no|Wait|not it/i);
    expect(pickRandomGag(1, () => 0.9)).toMatch(
      /YOU|obviously|knew|Don't look|button|Interesting/i,
    );
  });
});
