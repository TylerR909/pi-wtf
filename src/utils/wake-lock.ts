import type { ModeId } from "../modes/types";

/** Watch-only modes: keep the display up even without fullscreen. */
const WATCH_MODES: ReadonlySet<ModeId> = new Set(["chaos", "tape"]);

/**
 * Screen Wake Lock only — a PWA cannot run in the background.
 * iOS Safari 16.4+; installed Home Screen PWAs were broken until 18.4.
 */
export function canRequestWakeLock(): boolean {
  return typeof navigator !== "undefined" && Boolean(navigator.wakeLock);
}

/** Fullscreen anywhere, or Rain / Tape even windowed. Never otherwise. */
export function shouldHoldWakeLock(mode: ModeId, fullscreen: boolean): boolean {
  return fullscreen || WATCH_MODES.has(mode);
}

export async function requestScreenWakeLock(): Promise<WakeLockSentinel | null> {
  if (!canRequestWakeLock()) return null;
  if (typeof document !== "undefined" && document.visibilityState !== "visible") return null;
  try {
    return await navigator.wakeLock.request("screen");
  } catch {
    // Denied (battery saver, no gesture yet, hidden tab). Caller may retry.
    return null;
  }
}

export async function releaseWakeLock(sentinel: WakeLockSentinel | null): Promise<null> {
  if (!sentinel || sentinel.released) return null;
  try {
    await sentinel.release();
  } catch {
    /* already gone */
  }
  return null;
}
