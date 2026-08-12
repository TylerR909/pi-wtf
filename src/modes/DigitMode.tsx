import { useEffect, useRef } from "react";
import { PI_DIGIT_COUNT, PI_DIGITS } from "../data/pi-digits";
import { pickQuip } from "../data/quips";

/**
 * Giant one-digit-at-a-time mode.
 * Space advances. Hold space → accelerating auto-advance.
 * High-frequency digit updates go through DOM refs (no React re-render).
 * Quips update on a throttled path.
 */
export function DigitMode() {
  const digitRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  const quipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let index = 0; // 0 = show "3."
    let holding = false;
    let holdStart = 0;
    let lastAdvance = 0;
    let lastQuipAt = 0;
    let raf = 0;
    let advances = 0;

    const renderDigit = () => {
      const el = digitRef.current;
      if (!el) return;
      if (index === 0) {
        el.textContent = "3.";
        el.dataset.kind = "start";
      } else {
        el.textContent = PI_DIGITS[index] ?? "?";
        el.dataset.kind = "digit";
      }
      if (metaRef.current) {
        const pos = index === 0 ? 0 : index;
        metaRef.current.textContent =
          index === 0 ? "π · position 0 (integer)" : `π · digit #${pos}`;
      }
    };

    const maybeQuip = (now: number) => {
      // Start quipping after a bit of holding / many advances
      const holdMs = holding ? now - holdStart : 0;
      if (holdMs < 4000 && advances < 40) return;
      if (now - lastQuipAt < 2200) return;
      lastQuipAt = now;
      const intensity = Math.min(1, holdMs / 45000 + advances / 3000);
      if (quipRef.current) {
        quipRef.current.textContent = pickQuip(intensity);
        quipRef.current.dataset.show = "1";
      }
    };

    const advance = (now: number) => {
      if (index + 1 >= PI_DIGIT_COUNT) {
        // Loop fractional part after exhausting table
        index = 1;
      } else {
        index += 1;
      }
      advances += 1;
      lastAdvance = now;
      renderDigit();
      maybeQuip(now);
    };

    const tick = (now: number) => {
      if (holding) {
        const held = now - holdStart;
        // Delay before auto-repeat, then accelerate
        if (held > 350) {
          // interval from ~120ms → ~16ms (≈60fps) → ~8ms push toward 120hz feel
          const t = Math.min(1, (held - 350) / 12000);
          const interval = 120 - t * 112; // 120 → 8ms
          if (now - lastAdvance >= interval) {
            // When very fast, advance multiple digits per frame
            const burst = held > 20000 ? 3 : held > 10000 ? 2 : 1;
            for (let i = 0; i < burst; i++) advance(now);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      // Don't steal space from buttons/inputs
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      e.preventDefault();
      if (e.repeat) return; // we handle hold ourselves
      if (!holding) {
        holding = true;
        holdStart = performance.now();
        advance(holdStart);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      holding = false;
    };

    const onBlur = () => {
      holding = false;
    };

    renderDigit();
    raf = requestAnimationFrame(tick);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <div className="mode digit-mode" aria-label="One digit at a time. Press Space to advance.">
      <div ref={digitRef} className="digit-giant" data-kind="start">
        3.
      </div>
      <div ref={metaRef} className="digit-meta">
        π · position 0 (integer)
      </div>
      <div ref={quipRef} className="digit-quip" data-show="0" aria-live="polite" />
      <p className="mode-hint">Space · hold to accelerate</p>
    </div>
  );
}
