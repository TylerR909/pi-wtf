import { useEffect, useRef } from "react";
import { PI_DIGITS } from "../data/pi-digits";

const MARK_EVERY = [25, 50, 100] as const;

/**
 * Slow horizontal scroll of π with measuring-tape marks.
 * Arrow keys nudge; auto-resume after idle pause.
 * Driven by rAF + transform — no React re-renders while scrolling.
 */
export function ScreensaverMode() {
  const trackRef = useRef<HTMLDivElement>(null);
  const tapeRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const tape = tapeRef.current;
    if (!track || !tape) return;

    // Build a long strip once
    const frac = PI_DIGITS.slice(1);
    const repeat = 8;
    let body = "3.";
    for (let r = 0; r < repeat; r++) body += frac;

    // Measuring tape: mark every 25/50/100 *characters of the full string*
    // Position 0 is '3', 1 is '.', then fractional digits.
    // We'll mark based on fractional digit index for comedy "tape measure"
    const marks: { at: number; kind: 25 | 50 | 100; label: string }[] = [];
    // char index: 0='3', 1='.', 2=first frac digit (digit #1)
    const totalChars = body.length;
    for (let charIdx = 2; charIdx < totalChars; charIdx++) {
      const digitNum = charIdx - 1; // digit number of π (1-based fractional… actually digit index in PI_DIGITS)
      // digitNum here is index into "3" + frac for the first cycle only
      const inFirstCycle = charIdx < 2 + frac.length;
      if (!inFirstCycle) continue;
      for (const m of MARK_EVERY) {
        if (digitNum > 0 && digitNum % m === 0) {
          marks.push({
            at: charIdx,
            kind: m,
            label: `${digitNum}`,
          });
          break; // prefer largest? actually we want all; 100 is also 50 and 25
        }
      }
    }
    // Prefer showing the most significant mark at each position
    const markAt = new Map<number, { kind: 25 | 50 | 100; label: string }>();
    for (const m of marks) {
      const prev = markAt.get(m.at);
      if (!prev || m.kind > prev.kind) markAt.set(m.at, m);
    }

    // Render characters with optional tape ticks above
    const frag = document.createDocumentFragment();
    const tapeFrag = document.createDocumentFragment();
    for (let i = 0; i < body.length; i++) {
      const span = document.createElement("span");
      span.className = "ss-char";
      span.textContent = body[i]!;
      span.dataset.i = String(i);
      frag.appendChild(span);

      const tick = document.createElement("span");
      tick.className = "ss-tick";
      const mk = markAt.get(i);
      if (mk) {
        tick.dataset.mark = String(mk.kind);
        tick.innerHTML = `<i></i><em>${mk.label}</em>`;
      }
      tapeFrag.appendChild(tick);
    }
    track.replaceChildren(frag);
    tape.replaceChildren(tapeFrag);

    let x = 40; // px offset
    let vel = -28; // px/s baseline scroll left
    let pausedUntil = 0;
    let last = performance.now();
    let raf = 0;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;

    const apply = () => {
      const t = `translate3d(${x}px,0,0)`;
      track.style.transform = t;
      tape.style.transform = t;
      if (posRef.current) {
        // Approximate digit under left third of screen
        const charW = (track.firstElementChild as HTMLElement | null)?.offsetWidth || 14;
        const approx = Math.max(0, Math.floor((-x + window.innerWidth * 0.15) / charW));
        posRef.current.textContent = `≈ char ${approx}`;
      }
    };

    const scheduleResume = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      const pause = 10000 + Math.random() * 20000; // 10–30s
      pausedUntil = performance.now() + pause;
      resumeTimer = setTimeout(() => {
        pausedUntil = 0;
      }, pause);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        x += 80;
        vel = -Math.abs(vel);
        scheduleResume();
        apply();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        x -= 80;
        vel = -Math.abs(vel);
        scheduleResume();
        apply();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (pausedUntil > performance.now()) {
          pausedUntil = 0;
          if (resumeTimer) clearTimeout(resumeTimer);
        } else {
          scheduleResume();
        }
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (now >= pausedUntil) {
        x += vel * dt;
        // wrap softly: when we've scrolled far, jump back
        const width = track.scrollWidth / 2;
        if (x < -width) x += width;
        if (x > 40) x = 40;
        apply();
      }
      raf = requestAnimationFrame(loop);
    };

    apply();
    raf = requestAnimationFrame(loop);
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      if (resumeTimer) clearTimeout(resumeTimer);
    };
  }, []);

  return (
    <div className="mode screensaver-mode" aria-label="Screensaver scroll of pi">
      <div className="ss-stage">
        <div ref={tapeRef} className="ss-tape" />
        <div ref={trackRef} className="ss-track" />
      </div>
      <div ref={posRef} className="digit-meta ss-pos" />
      <p className="mode-hint">← → scroll · Space pause/resume · auto-pauses 10–30s</p>
      <div className="ss-legend">
        <span data-mark="25">| 25</span>
        <span data-mark="50">| 50</span>
        <span data-mark="100">| 100</span>
      </div>
    </div>
  );
}
