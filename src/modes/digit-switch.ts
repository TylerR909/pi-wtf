import type { DigitQuipBehavior } from "../data/quips";
import { createSwitchMockPicker, shouldMockSwitch } from "../data/switch-quips";
import { HOLD_ARM_MS } from "./digit-play";

/** Only commit a style once we know what this press actually is. */
export function switchCandidate(opts: {
  kind: "down" | "up" | "tick";
  now: number;
  pressAt: number;
  pressing: boolean;
  pointerKind: "mouse" | "touch" | null;
}): DigitQuipBehavior | null {
  const { kind, now, pressAt, pressing, pointerKind } = opts;
  const held = pressing && now - pressAt >= HOLD_ARM_MS;
  if (held) {
    if (pointerKind === "touch" || pointerKind === "mouse") return "pointer-hold";
    return "space-hold";
  }
  // A hold's release is not "now they spam." Wait for the next short press.
  if (kind !== "up") return null;
  if (now - pressAt >= HOLD_ARM_MS) return null;
  if (pointerKind === "touch") return "tap";
  if (pointerKind === "mouse") return "click";
  return "spam";
}

/**
 * Settles a Digit input style once we're sure, then roasts a real switch.
 * First style is free. Same-press peck→hold is free. Fidgets under the dwell
 * just update the label.
 */
export function createSwitchTracker() {
  const picker = createSwitchMockPicker();
  let settled: DigitQuipBehavior | null = null;
  let settledAt = 0;
  let settledPressAt = 0;

  return {
    settled: () => settled,
    observe(opts: {
      behavior: DigitQuipBehavior | null;
      now: number;
      pressAt: number;
      pressing: boolean;
      rng?: () => number;
    }): string | null {
      const { behavior, now, pressAt, pressing, rng = Math.random } = opts;
      if (behavior == null) return null;
      if (settled == null) {
        settled = behavior;
        settledAt = now;
        settledPressAt = pressAt;
        return null;
      }
      if (behavior === settled) return null;
      const samePress = pressing && pressAt === settledPressAt;
      const line = shouldMockSwitch(settled, behavior, now - settledAt, samePress)
        ? picker.pick(settled, behavior, rng)
        : null;
      settled = behavior;
      settledAt = now;
      settledPressAt = pressAt;
      return line;
    },
  };
}
