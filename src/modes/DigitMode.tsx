import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useEffect, useRef } from "react";
import { PI_DIGIT_COUNT, PI_DIGITS } from "../data/pi-digits";
import {
  clickerDwellMs,
  type DigitQuipBehavior,
  nextClickerQuip,
  nextQuip,
  takeComebacks,
} from "../data/quips";
import { useHotkey } from "../hotkeys/HotkeyContext";
import { beginMode, getDigitQuips, getProgress, reportProgress, saveDigitQuips } from "../progress";
import { isTypingTarget } from "../utils/keys";
import {
  createDigitPlay,
  type DigitStep,
  HOLD_ARM_MS,
  HOLD_MAX_INTERVAL,
  HOLD_QUIP_GAP_MS,
  holdInterval,
} from "./digit-play";
import { createQuipQueue, mockDwellMs } from "./digit-quips";
import { pruneRateStamps, RATE_TICK_MS, stampRatePerMin, ZOOM_SHOW_MS } from "./digit-rate";
import { createSwitchTracker, switchCandidate } from "./digit-switch";

/**
 * Giant one-digit-at-a-time.
 * Click/tap = Cookie Clicker. Space (mash or hold) or a real hold = the roast.
 */
export function DigitMode() {
  useLingui();
  useHotkey({ key: "Space", label: t`Next digit` });
  const rootRef = useRef<HTMLDivElement>(null);
  const digitRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const rateRef = useRef<HTMLDivElement>(null);
  const quipRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    beginMode("digit");
    const saved = getDigitQuips();
    const play = createDigitPlay({ holdQuipsEmitted: saved.holdQuipsEmitted });
    let index = getProgress();
    let raf = 0;
    let holdCursor = saved.holdCursor;
    let clickerCursor = saved.clickerCursor;
    let comebackQueue: string[] = [];
    const switcher = createSwitchTracker();
    let advances = 0;
    let pointerId: number | null = null;
    let pointerKind: "mouse" | "touch" | null = null;
    let pressAt = 0;
    let pressing = false;
    let lastDiscreteAt = 0;
    let zoomedThisHold = false;
    let zoomFade: ReturnType<typeof setTimeout> | null = null;
    let rateStamps: number[] = [];
    let rateClock: ReturnType<typeof setInterval> | null = null;

    const paint = () => {
      const el = digitRef.current;
      if (el) {
        const next = index === 0 ? "3." : (PI_DIGITS[index] ?? "?");
        const sameGlyph = el.textContent === next;
        el.textContent = next;
        el.dataset.kind = index === 0 ? "start" : "digit";
        // Same digit twice looks like a hitch; flip a tick so CSS can nudge it.
        if (sameGlyph) el.dataset.tick = el.dataset.tick === "a" ? "b" : "a";
      }
      if (metaRef.current) {
        // 1-indexed: 3 is the 1st digit, 1 is the 2nd, 4 is the 3rd…
        metaRef.current.textContent = t`π · digit #${index + 1}`;
      }
      reportProgress(index);
    };

    const advanceOnce = () => {
      if (index + 1 >= PI_DIGIT_COUNT) {
        index = 1;
      } else {
        index += 1;
      }
      advances += 1;
      if (hintRef.current && advances >= 3) hintRef.current.dataset.hide = "1";
      paint();
    };

    const quips = createQuipQueue({
      show: (text) => {
        const el = quipRef.current;
        if (!el) return;
        el.textContent = text;
        el.dataset.show = "1";
      },
      hide: () => {
        if (quipRef.current) quipRef.current.dataset.show = "0";
      },
    });

    const stopRateClock = () => {
      if (rateClock == null) return;
      clearInterval(rateClock);
      rateClock = null;
    };

    const ensureRateClock = () => {
      if (rateClock != null) return;
      rateClock = setInterval(() => paintRate(performance.now()), RATE_TICK_MS);
    };

    const paintRate = (now: number) => {
      const el = rateRef.current;
      if (!el) return;
      rateStamps = pruneRateStamps(rateStamps, now);
      const tapping = now - lastDiscreteAt < 800;
      const holdIv = pressing && !tapping ? holdInterval(now - pressAt) : null;
      if (holdIv != null && holdIv <= HOLD_MAX_INTERVAL) {
        if (!zoomedThisHold) {
          zoomedThisHold = true;
          el.textContent = "zoooom";
          el.dataset.show = "1";
          if (zoomFade) clearTimeout(zoomFade);
          zoomFade = setTimeout(() => {
            if (rateRef.current?.textContent === "zoooom") rateRef.current.dataset.show = "0";
          }, ZOOM_SHOW_MS);
        }
        ensureRateClock();
        return;
      }
      zoomedThisHold = false;
      if (zoomFade) {
        clearTimeout(zoomFade);
        zoomFade = null;
      }
      if (holdIv != null) {
        el.textContent = `${Math.round(60_000 / holdIv)}/min`;
        el.dataset.show = "1";
        ensureRateClock();
        return;
      }
      const perMin = stampRatePerMin(rateStamps, now);
      if (perMin === 0) {
        el.dataset.show = "0";
        stopRateClock();
        return;
      }
      el.textContent = `${perMin}/min`;
      el.dataset.show = "1";
      ensureRateClock();
    };

    const behaviorAt = (now: number): DigitQuipBehavior => {
      const holding = pressing && now - pressAt >= HOLD_ARM_MS;
      if (pointerKind === "touch") return holding ? "pointer-hold" : "tap";
      if (pointerKind === "mouse") return holding ? "pointer-hold" : "click";
      return holding ? "space-hold" : "spam";
    };

    const apply = (s: DigitStep, now: number, kind: "down" | "tick" | "up") => {
      if (s.advance) {
        advanceOnce();
        rateStamps.push(now);
        if (kind === "down") lastDiscreteAt = now;
        paintRate(now);
      }
      const mock = switcher.observe({
        behavior: switchCandidate({
          kind,
          now,
          pressAt,
          pressing,
          pointerKind,
        }),
        now,
        pressAt,
        pressing,
      });
      let lockMs = 0;
      if (mock) {
        const dwell = mockDwellMs(mock);
        quips.push(mock, dwell);
        lockMs = dwell;
      }
      if (s.quip === "clicker") {
        const { text, next } = nextClickerQuip(clickerCursor, behaviorAt(now));
        clickerCursor = next;
        const dwell = clickerDwellMs(text);
        quips.push(text, dwell);
        lockMs = Math.max(lockMs, dwell);
      } else if (s.quip === "hold") {
        const behavior = behaviorAt(now);
        if (s.comeback) comebackQueue = takeComebacks(7, Math.random, behavior);
        const welcome = comebackQueue.shift();
        if (welcome) {
          quips.push(welcome, HOLD_QUIP_GAP_MS);
        } else {
          const { text, next } = nextQuip(holdCursor, behavior);
          holdCursor = next;
          quips.push(text, HOLD_QUIP_GAP_MS);
        }
        lockMs = Math.max(lockMs, HOLD_QUIP_GAP_MS);
      }
      if (lockMs > 0) play.ack(now, lockMs);
      // Hide is a suggestion. The queue will not cut a live line short.
      if (s.hideMs === null) quips.cancelHide();
      else if (s.hideMs != null) quips.hideIn(s.hideMs);
    };

    const loop = (now: number) => {
      const s = play.tick(now);
      apply(s, now, "tick");
      if (!s.advance && pressing && holdInterval(now - pressAt) != null) paintRate(now);
      raf = s.running ? requestAnimationFrame(loop) : 0;
    };

    const kick = (s: DigitStep, now: number, kind: "down" | "up") => {
      apply(s, now, kind);
      if (kind === "up") paintRate(now);
      if (s.running && !raf) raf = requestAnimationFrame(loop);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      if (e.target instanceof HTMLSelectElement) {
        e.target.blur();
      } else if (isTypingTarget(e.target)) {
        return;
      }
      e.preventDefault();
      if (e.repeat) return;
      pointerKind = null;
      const now = performance.now();
      pressing = true;
      pressAt = now;
      zoomedThisHold = false;
      kick(play.down("key", now), now, "down");
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const now = performance.now();
      pressing = false;
      kick(play.up("key", now), now, "up");
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      pointerId = e.pointerId;
      pointerKind = e.pointerType === "touch" || e.pointerType === "pen" ? "touch" : "mouse";
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      const now = performance.now();
      pressing = true;
      pressAt = now;
      zoomedThisHold = false;
      kick(play.down("pointer", now), now, "down");
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerId != null && e.pointerId !== pointerId) return;
      pointerId = null;
      const now = performance.now();
      pressing = false;
      kick(play.release(now), now, "up");
    };

    const onBlur = () => {
      pointerId = null;
      const now = performance.now();
      pressing = false;
      kick(play.release(now), now, "up");
    };

    if (index > 0 && hintRef.current) hintRef.current.dataset.hide = "1";
    paint();
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    const root = rootRef.current;
    // Stage, not just the digit cluster — empty space below must tap too (iOS).
    const surface = (root?.closest("#main") as HTMLElement | null) ?? root;
    const killSelect = (e: Event) => e.preventDefault();
    surface?.addEventListener("pointerdown", onPointerDown);
    surface?.addEventListener("pointerup", onPointerUp);
    surface?.addEventListener("pointercancel", onPointerUp);
    surface?.addEventListener("lostpointercapture", onPointerUp);
    root?.addEventListener("selectstart", killSelect);
    root?.addEventListener("contextmenu", killSelect);

    return () => {
      saveDigitQuips({
        holdCursor,
        clickerCursor,
        holdQuipsEmitted: play.holdQuipsEmitted(),
      });
      cancelAnimationFrame(raf);
      quips.dispose();
      if (zoomFade) clearTimeout(zoomFade);
      stopRateClock();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      surface?.removeEventListener("pointerdown", onPointerDown);
      surface?.removeEventListener("pointerup", onPointerUp);
      surface?.removeEventListener("pointercancel", onPointerUp);
      surface?.removeEventListener("lostpointercapture", onPointerUp);
      root?.removeEventListener("selectstart", killSelect);
      root?.removeEventListener("contextmenu", killSelect);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="mode digit-mode"
      aria-label={t`One digit at a time. Press Space to advance.`}
    >
      <div ref={digitRef} className="digit-giant" data-kind="start">
        3.
      </div>
      <div ref={metaRef} className="digit-meta">
        {t`π · digit #${1}`}
      </div>
      <div ref={rateRef} className="digit-rate" data-show="0" />
      <div ref={quipRef} className="digit-quip" data-show="0" aria-live="polite" />
      <p ref={hintRef} className="mode-hint digit-hint" data-hide="0">
        <Trans>Press Spacebar</Trans>
      </p>
    </div>
  );
}
