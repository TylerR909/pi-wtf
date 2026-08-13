import type { ModeId } from "./modes/types";

/**
 * Cross-mode progress: whichever play-mode last advanced π, Pi mode can highlight.
 * Pi mode is a peek — it does not steal or reset the cursor (Tape / Digit can resume).
 * Any other mode switch resets the cursor.
 */
const TRACKED: ReadonlySet<ModeId> = new Set(["digit", "trainer", "tape", "hacker"]);

let owner: ModeId | null = null;
let index = 0; // last reached digit number (0 = leading 3)
let digitQuips: DigitQuipSave = emptyDigitQuips();
const listeners = new Set<() => void>();

export type DigitQuipSave = {
  holdCursor: number;
  clickerCursor: number;
  holdQuipsEmitted: boolean;
};

function emptyDigitQuips(): DigitQuipSave {
  return { holdCursor: 0, clickerCursor: 0, holdQuipsEmitted: false };
}

function resetCursor() {
  owner = null;
  index = 0;
  digitQuips = emptyDigitQuips();
}

function notify() {
  for (const fn of listeners) fn();
}

export function beginMode(mode: ModeId): void {
  if (mode === "pi") return;
  if (!TRACKED.has(mode)) {
    if (owner != null) {
      resetCursor();
      notify();
    }
    return;
  }
  if (owner !== mode) {
    owner = mode;
    index = 0;
    digitQuips = emptyDigitQuips();
    notify();
  }
}

export function getDigitQuips(): DigitQuipSave {
  return { ...digitQuips };
}

export function saveDigitQuips(next: DigitQuipSave): void {
  digitQuips = {
    holdCursor: Math.max(0, next.holdCursor),
    clickerCursor: Math.max(0, next.clickerCursor),
    holdQuipsEmitted: Boolean(next.holdQuipsEmitted),
  };
}

export function reportProgress(digitIndex: number): void {
  if (!Number.isFinite(digitIndex)) return;
  const next = Math.max(0, Math.floor(digitIndex));
  if (next > index) {
    index = next;
    notify();
  }
}

export function getProgress(): number {
  return index;
}

export function subscribeProgress(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
