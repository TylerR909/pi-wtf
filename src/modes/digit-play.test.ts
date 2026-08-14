import { describe, expect, it } from "vitest";
import {
  CLICKER_ENTER_HZ,
  CLICKER_GRACE_MS,
  CLICKER_IDLE_MS,
  createDigitPlay,
  HOLD_ARM_MS,
  HOLD_MAX_AT_MS,
  HOLD_QUIP_WARMUP_MS,
  holdInterval,
  isHoldMaxSpeed,
  tapRate,
} from "./digit-play";

function taps(
  play: ReturnType<typeof createDigitPlay>,
  source: "pointer" | "key",
  count: number,
  start: number,
  gap: number,
  press = 80,
) {
  const steps = [];
  for (let i = 0; i < count; i++) {
    const t0 = start + i * gap;
    play.down(source, t0);
    steps.push(play.up(source, t0 + press));
  }
  return steps;
}

describe("holdInterval", () => {
  it("does not auto-repeat until the press is a real hold", () => {
    expect(holdInterval(HOLD_ARM_MS - 1)).toBeNull();
    expect(holdInterval(HOLD_ARM_MS)).toBe(170);
  });

  it("floors at max turbo after about 2.5s", () => {
    expect(isHoldMaxSpeed(HOLD_ARM_MS)).toBe(false);
    expect(isHoldMaxSpeed(HOLD_MAX_AT_MS - 1)).toBe(false);
    expect(holdInterval(HOLD_MAX_AT_MS)).toBe(16);
    expect(isHoldMaxSpeed(HOLD_MAX_AT_MS)).toBe(true);
  });
});

describe("tapRate", () => {
  it("needs a handful of taps in the window", () => {
    expect(tapRate([0, 400, 800], 800).rate).toBeNull();
    const { rate } = tapRate([0, 400, 800, 1200], 1200);
    expect(rate).toBeCloseTo(2.5);
    expect(rate!).toBeGreaterThan(CLICKER_ENTER_HZ);
  });
});

describe("createDigitPlay lanes", () => {
  it("rapid pointer taps enter clicker, not hold", () => {
    const play = createDigitPlay();
    const steps = taps(play, "pointer", 4, 0, 400);
    expect(play.lane()).toBe("clicker");
    expect(steps.at(-1)?.quip).toBe("clicker");
  });

  it("rapid space taps enter hold/spam, not clicker", () => {
    const play = createDigitPlay();
    const steps = taps(play, "key", 4, 0, 400);
    expect(play.lane()).toBe("hold");
    expect(steps.at(-1)?.quip).toBe("hold");
    expect(steps.some((s) => s.quip === "clicker")).toBe(false);
  });

  it("a slightly long click is still a tap (no auto-repeat, no hold)", () => {
    const play = createDigitPlay();
    expect(play.down("pointer", 0).advance).toBe(true);
    expect(play.tick(400).advance).toBeFalsy();
    const up = play.up("pointer", 420);
    expect(up.quip).toBeUndefined();
    expect(play.lane()).toBe("none");
  });

  it("auto-repeat only after the hold arm", () => {
    const play = createDigitPlay();
    play.down("key", 0);
    expect(play.tick(HOLD_ARM_MS - 10).advance).toBeFalsy();
    expect(play.tick(HOLD_ARM_MS).advance).toBe(true);
  });

  it("a pointer hold during clicker stays clicker and keeps roasting", () => {
    const play = createDigitPlay();
    taps(play, "pointer", 4, 0, 400);
    play.ack(1280, 1500);
    expect(play.lane()).toBe("clicker");

    play.down("pointer", 2000);
    expect(play.tick(2000 + HOLD_ARM_MS).advance).toBe(true);
    expect(play.lane()).toBe("clicker");
    expect(play.tick(2780).quip).toBe("clicker");

    play.up("pointer", 4000);
    taps(play, "pointer", 2, 4100, 400);
    expect(play.lane()).toBe("clicker");
    const after = play.tick(5000);
    expect(after.quip).not.toBe("hold");
    expect(after.comeback).toBeFalsy();
  });

  it("space hold during clicker switches to the hold roast", () => {
    const play = createDigitPlay();
    taps(play, "pointer", 4, 0, 400);
    play.down("key", 2000);
    play.tick(2000 + HOLD_ARM_MS);
    expect(play.lane()).toBe("hold");
    expect(play.tick(2000 + HOLD_QUIP_WARMUP_MS).quip).toBe("hold");
  });

  it("space spam then trackpad clicks then a hold stays clicker", () => {
    const play = createDigitPlay();
    taps(play, "key", 4, 0, 400);
    expect(play.lane()).toBe("hold");
    taps(play, "pointer", 4, 2000, 400);
    expect(play.lane()).toBe("clicker");
    play.ack(3280, 800);
    play.down("pointer", 4000);
    play.tick(4000 + HOLD_ARM_MS);
    expect(play.lane()).toBe("clicker");
    play.up("pointer", 5500);
    taps(play, "pointer", 3, 5600, 400);
    expect(play.lane()).toBe("clicker");
    expect(play.tick(7000).comeback).toBeFalsy();
  });

  it("a short press during clicker stays clicker", () => {
    const play = createDigitPlay();
    taps(play, "pointer", 4, 0, 400);
    play.down("pointer", 2000);
    expect(play.tick(2200).quip).not.toBe("hold");
    play.up("pointer", 2280);
    expect(play.lane()).toBe("clicker");
  });

  it("restored holdQuipsEmitted asks for a comeback on the next hold", () => {
    const play = createDigitPlay({ holdQuipsEmitted: true });
    play.down("key", 0);
    const first = play.tick(HOLD_QUIP_WARMUP_MS);
    expect(first.quip).toBe("hold");
    expect(first.comeback).toBe(true);
  });

  it("hold quips wait out the warmup on a cold hold", () => {
    const play = createDigitPlay();
    play.down("key", 0);
    expect(play.tick(HOLD_QUIP_WARMUP_MS - 1).quip).toBeUndefined();
    expect(play.tick(HOLD_QUIP_WARMUP_MS).quip).toBe("hold");
    expect(play.tick(HOLD_QUIP_WARMUP_MS).comeback).toBeFalsy();
  });

  it("returning to a hold asks for comebacks", () => {
    const play = createDigitPlay();
    play.down("key", 0);
    const first = play.tick(HOLD_QUIP_WARMUP_MS);
    expect(first.quip).toBe("hold");
    play.ack(HOLD_QUIP_WARMUP_MS, 2800);
    play.up("key", HOLD_QUIP_WARMUP_MS + 100);

    play.down("key", 20_000);
    const again = play.tick(20_000 + HOLD_QUIP_WARMUP_MS);
    expect(again.quip).toBe("hold");
    expect(again.comeback).toBe(true);
  });

  it("clicker idles, then exits after the grace period", () => {
    const play = createDigitPlay();
    taps(play, "pointer", 4, 0, 400);
    const lastTap = 3 * 400 + 80;
    play.tick(lastTap + CLICKER_IDLE_MS + 10);
    expect(play.lane()).toBe("clicker");
    const gone = play.tick(lastTap + CLICKER_IDLE_MS + CLICKER_GRACE_MS);
    expect(play.lane()).toBe("none");
    expect(gone.hideMs).toBe(900);
  });

  it("does not emit another clicker line until ack", () => {
    const play = createDigitPlay();
    taps(play, "pointer", 4, 0, 400);
    play.ack(1280, 1000);
    play.down("pointer", 1600);
    play.up("pointer", 1680);
    expect(play.tick(2000).quip).toBeUndefined();
    expect(play.tick(2280).quip).toBe("clicker");
  });
});
