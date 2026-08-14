/** Sliding window for the Digit /min readout. */
export const RATE_WINDOW_MS = 5000;
/** Autonomous refresh — not tied to taps or hold auto-repeat. */
export const RATE_TICK_MS = 333;
/** How long "zoooom" stays up before fading. */
export const ZOOM_SHOW_MS = 1800;

export function pruneRateStamps(
  stamps: number[],
  now: number,
  windowMs = RATE_WINDOW_MS,
): number[] {
  const first = stamps.findIndex((t) => now - t < windowMs);
  if (first <= 0) return first === 0 ? stamps : [];
  return stamps.slice(first);
}

/** Advances still in the window, as a /min. Empty → 0. */
export function stampRatePerMin(
  stamps: readonly number[],
  now: number,
  windowMs = RATE_WINDOW_MS,
): number {
  let n = 0;
  for (const t of stamps) if (now - t < windowMs) n += 1;
  if (n === 0) return 0;
  return Math.round((n / windowMs) * 60_000);
}
