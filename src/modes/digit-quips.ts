/**
 * Digit quip board. Display is a timer, not the play/RAF loop.
 * Incoming lines wait out the current dwell — including switch mocks.
 */

import { clickerDwellMs } from "../data/quips";

export const MOCK_MIN_DWELL_MS = 3600;
const MAX_PENDING = 2;

export function mockDwellMs(text: string, rng = Math.random): number {
  return Math.max(clickerDwellMs(text, rng) + 400, MOCK_MIN_DWELL_MS);
}

export type QuipLine = {
  text: string;
  dwellMs: number;
};

export function createQuipQueue(opts: {
  show: (text: string) => void;
  hide: () => void;
  now?: () => number;
}) {
  const clock = opts.now ?? (() => performance.now());
  let current: QuipLine | null = null;
  let busyUntil = 0;
  let visible = false;
  let pending: QuipLine[] = [];
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const clearShow = () => {
    if (showTimer == null) return;
    clearTimeout(showTimer);
    showTimer = null;
  };

  const clearHide = () => {
    if (hideTimer == null) return;
    clearTimeout(hideTimer);
    hideTimer = null;
  };

  const present = (line: QuipLine) => {
    clearHide();
    current = line;
    visible = true;
    busyUntil = clock() + line.dwellMs;
    opts.show(line.text);
    clearShow();
    showTimer = setTimeout(advance, line.dwellMs);
  };

  const advance = () => {
    showTimer = null;
    current = null;
    const next = pending.shift();
    if (next) present(next);
  };

  return {
    push(text: string, dwellMs: number) {
      const line = { text, dwellMs: Math.max(0, dwellMs) };
      if (visible && clock() < busyUntil) {
        if (pending.length >= MAX_PENDING) pending.shift();
        pending.push(line);
        return "queued" as const;
      }
      present(line);
      return "shown" as const;
    },
    /** Fade only after the live line's dwell (and any queued lines). */
    hideIn(ms: number) {
      clearHide();
      const wait = Math.max(ms, Math.max(0, busyUntil - clock()));
      hideTimer = setTimeout(() => {
        hideTimer = null;
        if (pending.length > 0) return;
        if (current != null && clock() < busyUntil) return;
        current = null;
        busyUntil = 0;
        if (!visible) return;
        visible = false;
        opts.hide();
      }, wait);
    },
    cancelHide() {
      clearHide();
    },
    dispose() {
      clearShow();
      clearHide();
      pending = [];
      current = null;
      visible = false;
      busyUntil = 0;
    },
    pendingCount: () => pending.length,
    isBusy: () => visible && clock() < busyUntil,
  };
}
