/**
 * Digit mode input lanes.
 *
 * Cookie Clicker — pointer click / tap at a decent clip.
 * Hold / space spam — Space (mash or hold) or a real press-and-hold.
 *
 * A slightly long click is still a click. Auto-repeat and the hold roast
 * only start after the press has been down long enough to mean it.
 */

export type DigitSource = "pointer" | "key";
export type DigitLane = "none" | "clicker" | "hold";

export const HOLD_ARM_MS = 500;
export const CLICKER_ENTER_HZ = 1.7;
export const CLICKER_WINDOW_MS = 3200;
export const CLICKER_MIN_TAPS = 4;
export const CLICKER_IDLE_MS = 800;
export const CLICKER_GRACE_MS = 5000;
export const HOLD_QUIP_WARMUP_MS = 10_000;
export const HOLD_QUIP_GAP_MS = 2800;
export const SPAM_IDLE_MS = 800;
export const SPAM_GRACE_MS = 5000;

export type DigitStep = {
  advance?: boolean;
  /** Hold roast. `comeback` is set on the first line of a returning session. */
  quip?: "clicker" | "hold";
  comeback?: boolean;
  /** Fade the current line after this many ms. `null` cancels a pending fade. */
  hideMs?: number | null;
  running: boolean;
};

/** Floor of the hold ramp — ~3750/min. */
export const HOLD_MAX_INTERVAL = 16;
/** Space hold hits that floor here, then Digit can zoooom. */
export const HOLD_MAX_AT_MS = 2500;

export function holdInterval(held: number): number | null {
  if (held < HOLD_ARM_MS) return null;
  const t = Math.min(1, (held - HOLD_ARM_MS) / (HOLD_MAX_AT_MS - HOLD_ARM_MS));
  return 170 - t * (170 - HOLD_MAX_INTERVAL);
}

export function isHoldMaxSpeed(heldMs: number): boolean {
  const iv = holdInterval(heldMs);
  return iv != null && iv <= HOLD_MAX_INTERVAL;
}

export function tapRate(
  stamps: readonly number[],
  now: number,
  windowMs = CLICKER_WINDOW_MS,
  minTaps = CLICKER_MIN_TAPS,
): { rate: number | null; kept: number[] } {
  const kept = stamps.filter((t) => now - t < windowMs);
  if (kept.length < minTaps) return { rate: null, kept };
  const first = kept[0]!;
  const last = kept[kept.length - 1]!;
  const dt = (last - first) / 1000;
  if (dt <= 0.05) return { rate: null, kept };
  return { rate: (kept.length - 1) / dt, kept };
}

export function createDigitPlay(opts?: { holdQuipsEmitted?: boolean }) {
  let source: DigitSource | null = null;
  let downAt = 0;
  let lastAdvance = 0;
  let armedThisPress = false;
  let lane: DigitLane = "none";
  let clickerStamps: number[] = [];
  let keyStamps: number[] = [];
  let lastRelease = 0;
  let clickerNextAt = Number.POSITIVE_INFINITY;
  let holdNextAt = Number.POSITIVE_INFINITY;
  let holdQuipsEmitted = Boolean(opts?.holdQuipsEmitted);
  let wantComeback = false;

  const running = () => source != null || lane !== "none";

  const step = (partial: Omit<DigitStep, "running"> = {}): DigitStep => ({
    ...partial,
    running: running(),
  });

  const lockQuip = (which: "clicker" | "hold") => {
    if (which === "clicker") clickerNextAt = Number.POSITIVE_INFINITY;
    else holdNextAt = Number.POSITIVE_INFINITY;
  };

  const enterClicker = (): DigitStep => {
    lane = "clicker";
    lockQuip("clicker");
    return step({ quip: "clicker", hideMs: null });
  };

  const enterHoldSpam = (): DigitStep => {
    if (lane !== "hold" && holdQuipsEmitted) wantComeback = true;
    lane = "hold";
    lockQuip("hold");
    const comeback = wantComeback;
    wantComeback = false;
    holdQuipsEmitted = true;
    return step({ quip: "hold", comeback, hideMs: null });
  };

  const emitHold = (): DigitStep => {
    lockQuip("hold");
    const comeback = wantComeback;
    wantComeback = false;
    holdQuipsEmitted = true;
    return step({ quip: "hold", comeback, hideMs: null });
  };

  const emitClicker = (): DigitStep => {
    lockQuip("clicker");
    return step({ quip: "clicker", hideMs: null });
  };

  function down(src: DigitSource, now: number): DigitStep {
    if (source != null) return step();
    source = src;
    downAt = now;
    lastAdvance = now;
    armedThisPress = false;
    return step({ advance: true });
  }

  function up(src: DigitSource, now: number): DigitStep {
    if (source !== src) return step();
    const dur = now - downAt;
    source = null;
    lastRelease = now;
    if (dur >= HOLD_ARM_MS) {
      if (lane === "clicker" && src === "pointer") {
        clickerStamps.push(now);
        return step();
      }
      if (lane === "hold") return step({ hideMs: 2500 });
      return step();
    }

    if (src === "pointer") {
      clickerStamps.push(now);
      const { rate, kept } = tapRate(clickerStamps, now);
      clickerStamps = kept;
      if (rate != null && rate >= CLICKER_ENTER_HZ) {
        if (lane === "clicker") return step();
        return enterClicker();
      }
      if (lane === "hold") return step({ hideMs: 1800 });
      return step();
    }

    keyStamps.push(now);
    const { rate, kept } = tapRate(keyStamps, now);
    keyStamps = kept;
    if (rate != null && rate >= CLICKER_ENTER_HZ) {
      if (lane === "hold") return step();
      return enterHoldSpam();
    }
    if (lane === "clicker") return step({ hideMs: 1800 });
    return step();
  }

  function release(now: number): DigitStep {
    if (source == null) return step();
    return up(source, now);
  }

  function tick(now: number): DigitStep {
    let advance = false;
    let follow: DigitStep | null = null;

    if (source != null && !armedThisPress && now - downAt >= HOLD_ARM_MS) {
      armedThisPress = true;
      // Cookie Clicker dared them to hold — stay on that bit. Digits may turbo;
      // the clicker line keeps moving. Space hold still switches to the roast.
      const stayClicker = lane === "clicker" && source === "pointer";
      const lastKey = keyStamps[keyStamps.length - 1] ?? 0;
      const mashIntoHold = lane === "hold" && now - lastKey < SPAM_IDLE_MS;
      if (!stayClicker && !mashIntoHold) {
        if (holdQuipsEmitted) wantComeback = true;
        lane = "hold";
        holdNextAt = downAt + HOLD_QUIP_WARMUP_MS;
      }
    }

    if (source != null) {
      const interval = holdInterval(now - downAt);
      if (interval != null && now - lastAdvance >= interval) {
        lastAdvance = now;
        advance = true;
      }
    }

    if (lane === "clicker") {
      const lastTap = clickerStamps[clickerStamps.length - 1] ?? 0;
      const idleMs = source == null ? now - lastTap : 0;
      if (idleMs >= CLICKER_IDLE_MS) {
        if (idleMs >= CLICKER_IDLE_MS + CLICKER_GRACE_MS) {
          lane = "none";
          follow = step({ hideMs: 900 });
        }
      } else if (now >= clickerNextAt) {
        follow = emitClicker();
      }
    } else if (lane === "hold") {
      const holdingNow = source != null && now - downAt >= HOLD_ARM_MS;
      const lastKey = keyStamps[keyStamps.length - 1] ?? 0;
      const spamActive = now - lastKey < SPAM_IDLE_MS;

      if (holdingNow || spamActive) {
        if (now >= holdNextAt) follow = emitHold();
      } else if (source == null && now - Math.max(lastKey, lastRelease) >= SPAM_GRACE_MS) {
        lane = "none";
        follow = step({ hideMs: 900 });
      }
    }

    if (follow) return { ...follow, advance: advance || follow.advance };
    return step({ advance: advance || undefined });
  }

  /** After a quip is shown — next one waits this long. */
  function ack(now: number, dwellMs: number) {
    if (lane === "clicker") clickerNextAt = now + dwellMs;
    else if (lane === "hold") holdNextAt = now + dwellMs;
  }

  return {
    down,
    up,
    release,
    tick,
    ack,
    lane: () => lane,
    holdQuipsEmitted: () => holdQuipsEmitted,
  };
}
