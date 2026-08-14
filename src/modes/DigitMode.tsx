import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useEffect, useRef } from "react";
import { PI_DIGIT_COUNT, PI_DIGITS } from "../data/pi-digits";
import { clickerDwellMs, nextClickerQuip, nextQuip, takeComebacks } from "../data/quips";
import { beginMode, getDigitQuips, getProgress, reportProgress, saveDigitQuips } from "../progress";
import { isTypingTarget } from "../utils/keys";
import { createDigitPlay, type DigitStep, HOLD_QUIP_GAP_MS } from "./digit-play";

/**
 * Giant one-digit-at-a-time.
 * Click/tap = Cookie Clicker. Space (mash or hold) or a real hold = the roast.
 */
export function DigitMode() {
  useLingui();
  const rootRef = useRef<HTMLDivElement>(null);
  const digitRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
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
    let advances = 0;
    let pointerId: number | null = null;
    let pointerHold = false;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

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

    const showQuip = (text: string) => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      const el = quipRef.current;
      if (!el) return;
      el.textContent = text;
      el.dataset.show = "1";
    };

    const hideQuip = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      if (quipRef.current) quipRef.current.dataset.show = "0";
    };

    const scheduleHide = (ms: number) => {
      if (quipRef.current?.dataset.show !== "1") return;
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(hideQuip, ms);
    };

    const apply = (s: DigitStep, now: number) => {
      if (s.advance) advanceOnce();
      if (s.quip === "clicker") {
        const { text, next } = nextClickerQuip(clickerCursor, pointerHold);
        clickerCursor = next;
        showQuip(text);
        play.ack(now, clickerDwellMs(text));
      } else if (s.quip === "hold") {
        if (s.comeback) comebackQueue = takeComebacks(7);
        const welcome = comebackQueue.shift();
        if (welcome) {
          showQuip(welcome);
        } else {
          const { text, next } = nextQuip(holdCursor, pointerHold);
          holdCursor = next;
          showQuip(text);
        }
        play.ack(now, HOLD_QUIP_GAP_MS);
      }
      if (s.hideMs != null) scheduleHide(s.hideMs);
    };

    const loop = (now: number) => {
      const s = play.tick(now);
      apply(s, now);
      raf = s.running ? requestAnimationFrame(loop) : 0;
    };

    const kick = (s: DigitStep, now: number) => {
      apply(s, now);
      if (s.running && !raf) raf = requestAnimationFrame(loop);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      if (e.repeat) return;
      pointerHold = false;
      const now = performance.now();
      kick(play.down("key", now), now);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const now = performance.now();
      kick(play.up("key", now), now);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      pointerId = e.pointerId;
      pointerHold = true;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      const now = performance.now();
      kick(play.down("pointer", now), now);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerId != null && e.pointerId !== pointerId) return;
      pointerId = null;
      const now = performance.now();
      kick(play.release(now), now);
    };

    const onBlur = () => {
      pointerId = null;
      const now = performance.now();
      kick(play.release(now), now);
    };

    if (index > 0 && hintRef.current) hintRef.current.dataset.hide = "1";
    paint();
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    const root = rootRef.current;
    const killSelect = (e: Event) => e.preventDefault();
    root?.addEventListener("pointerdown", onPointerDown);
    root?.addEventListener("pointerup", onPointerUp);
    root?.addEventListener("pointercancel", onPointerUp);
    root?.addEventListener("lostpointercapture", onPointerUp);
    root?.addEventListener("selectstart", killSelect);
    root?.addEventListener("contextmenu", killSelect);

    return () => {
      saveDigitQuips({
        holdCursor,
        clickerCursor,
        holdQuipsEmitted: play.holdQuipsEmitted(),
      });
      cancelAnimationFrame(raf);
      if (hideTimer) clearTimeout(hideTimer);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      root?.removeEventListener("pointerdown", onPointerDown);
      root?.removeEventListener("pointerup", onPointerUp);
      root?.removeEventListener("pointercancel", onPointerUp);
      root?.removeEventListener("lostpointercapture", onPointerUp);
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
      <div ref={quipRef} className="digit-quip" data-show="0" aria-live="polite" />
      <p ref={hintRef} className="mode-hint digit-hint" data-hide="0">
        <Trans>Press Spacebar</Trans>
      </p>
    </div>
  );
}
