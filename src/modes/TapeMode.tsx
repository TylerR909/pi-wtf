/**
 * Tape: a single row of π with measuring-tape ticks, slow scroll.
 */
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useCallback, useEffect, useRef, useState } from "react";
import { PI_DIGITS } from "../data/pi-digits";
import { useHotkey } from "../hotkeys/HotkeyContext";
import { useOptions } from "../options/OptionsContext";
import { beginMode, getProgress, reportProgress } from "../progress";
import { isTypingTarget } from "../utils/keys";

export function TapeMode() {
  useLingui();
  useHotkey({ key: "←", label: t`Slower / rewind` });
  useHotkey({ key: "→", label: t`Faster` });
  useHotkey({ key: "Space", label: t`Pause` });
  const { isFullscreen, fontPx } = useOptions({
    fullscreen: true,
    fontSize: true,
    defaultFontSize: "l",
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tapeRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const velRef = useRef(-32);
  const pausedRef = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [speedLabel, setSpeedLabel] = useState("1×");
  const [chromeOn, setChromeOn] = useState(true);

  const pokeChrome = useCallback(() => {
    setChromeOn(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setChromeOn(false), 7000);
  }, []);

  const syncSpeedLabel = useCallback(() => {
    if (pausedRef.current) {
      setSpeedLabel(t`paused`);
      return;
    }
    const v = velRef.current;
    const mag = Math.abs(v) / 32;
    setSpeedLabel(`${v > 0 ? "rewind " : ""}${mag.toFixed(1)}×`);
  }, []);

  /** Left = slower / rewind; right = faster — same as the arrow keys. */
  const nudgeSpeed = useCallback(
    (dir: "left" | "right") => {
      if (dir === "left") velRef.current = Math.min(240, velRef.current + 24);
      else velRef.current = Math.max(-240, velRef.current - 24);
      syncSpeedLabel();
      pokeChrome();
    },
    [pokeChrome, syncSpeedLabel],
  );

  useEffect(() => {
    beginMode("tape");
    const track = trackRef.current;
    const tape = tapeRef.current;
    const probe = probeRef.current;
    if (!track || !tape || !probe) return;

    const frac = PI_DIGITS;

    const charAt = (globalIdx: number): string => {
      if (globalIdx === 0) return "3";
      if (globalIdx === 1) return ".";
      const fi = ((globalIdx - 2) % (frac.length - 1)) + 1;
      return frac[fi] ?? "0";
    };

    /** 0-based index into 31415… (point is not a digit). */
    const piIndexAt = (globalIdx: number): number | null => {
      if (globalIdx === 0) return 0;
      if (globalIdx === 1) return null;
      return globalIdx - 1;
    };

    /** Human digit number: #1 is 3, #2 is 1, #3 is 4. */
    const digitNumAt = (globalIdx: number): number | null => {
      const i = piIndexAt(globalIdx);
      return i == null ? null : i + 1;
    };

    const markKind = (digitNum: number): 25 | 50 | 100 | null => {
      if (digitNum > 0 && digitNum % 100 === 0) return 100;
      if (digitNum > 0 && digitNum % 50 === 0) return 50;
      if (digitNum > 0 && digitNum % 25 === 0) return 25;
      return null;
    };

    let charW = 14;
    let windowChars = 200;
    let startIdx = 0;
    let x = 40;
    /** Intro: midpoint of “3.14”. */
    const introX = () => window.innerWidth / 2 - 2 * charW;
    /** Rewind stop: digit #1 (the 3) on the midline — not stuck on #2. */
    const maxX = () => window.innerWidth / 2 - charW / 2;
    let pausedUntil = 0;
    let last = performance.now();
    let raf = 0;
    let lastPosAt = 0;
    let resumeTimer: ReturnType<typeof setTimeout> | null = null;
    let scrubVel = 0;
    let pid: number | null = null;
    let lastPx = 0;
    let lastPy = 0;
    let panT0 = 0;
    let panX0 = 0;
    let panY0 = 0;
    let scrubbed = false;

    const measure = () => {
      probe.style.fontSize = `${fontPx}px`;
      probe.textContent = "0000000000";
      const sample = probe.getBoundingClientRect().width;
      charW = sample > 0 ? sample / 10 : 14;
      const need = Math.ceil(window.innerWidth / charW) * 3 + 32;
      windowChars = Math.min(4000, Math.max(120, need));
    };

    const rebuild = () => {
      let body = "";
      for (let i = 0; i < windowChars; i++) body += charAt(startIdx + i);
      track.textContent = body;
      tape.replaceChildren();
      tape.style.width = `${windowChars * charW}px`;
      for (let i = 0; i < windowChars; i++) {
        const g = startIdx + i;
        const dn = digitNumAt(g);
        if (dn == null) continue;
        const kind = markKind(dn);
        if (!kind) continue;
        const tick = document.createElement("span");
        tick.className = "ss-mark";
        tick.dataset.mark = String(kind);
        tick.style.left = `${i * charW}px`;
        tick.innerHTML = `<em>${dn}</em><i></i>`;
        tape.appendChild(tick);
      }
    };

    const centerDigit = (): number | null => {
      const mid = (-x + window.innerWidth / 2) / charW + startIdx;
      return digitNumAt(Math.max(0, Math.floor(mid)));
    };

    const applyTransform = () => {
      const xf = `translate3d(${x}px,0,0)`;
      track.style.transform = xf;
      tape.style.transform = xf;
      const now = performance.now();
      if (posRef.current && now - lastPosAt > 80) {
        lastPosAt = now;
        const dn = centerDigit();
        posRef.current.textContent =
          dn == null ? t`decimal point` : t`digit #${dn.toLocaleString()}`;
        if (dn != null) reportProgress(dn - 1);
      }
    };

    const maybeVirtualize = () => {
      const oneScreen = Math.ceil(window.innerWidth / charW);
      const scrolledChars = Math.floor(-x / charW);
      if (scrolledChars > oneScreen) {
        const shift = scrolledChars;
        startIdx += shift;
        x += shift * charW;
        rebuild();
      } else if (x > maxX() && startIdx > 0) {
        const shift = Math.min(startIdx, Math.ceil((x - maxX()) / charW) + oneScreen);
        startIdx = Math.max(0, startIdx - shift);
        x -= shift * charW;
        rebuild();
      }
    };

    const clampStart = () => {
      const cap = maxX();
      if (startIdx <= 0 && x > cap) {
        x = cap;
        if (scrubVel > 0) scrubVel = 0;
      }
    };

    /** Positive scroll (down / right) = later digits = x decreases. */
    const applyScrub = (scrollPx: number) => {
      if (scrollPx === 0) return;
      const gain = 1.85;
      const dx = scrollPx * gain;
      x -= dx;
      // Brief coast so a wheel/trackpad burst eases back into cruise.
      scrubVel = -dx * 10;
      clampStart();
      maybeVirtualize();
      applyTransform();
      pokeChrome();
    };

    const wheelPx = (e: WheelEvent): number => {
      let sx = e.deltaX;
      let sy = e.deltaY;
      if (e.deltaMode === 1) {
        sx *= 16;
        sy *= 16;
      } else if (e.deltaMode === 2) {
        sx *= window.innerWidth;
        sy *= window.innerHeight;
      }
      return sx + sy;
    };

    const showPauseLabel = (on: boolean) => {
      pausedRef.current = on;
      syncSpeedLabel();
    };

    const scheduleResume = () => {
      if (resumeTimer) clearTimeout(resumeTimer);
      const pause = 10_000 + Math.random() * 20_000;
      pausedUntil = performance.now() + pause;
      showPauseLabel(true);
      resumeTimer = setTimeout(() => {
        pausedUntil = 0;
        showPauseLabel(false);
      }, pause);
    };

    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        nudgeSpeed("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nudgeSpeed("right");
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        if (pausedUntil > performance.now()) {
          pausedUntil = 0;
          if (resumeTimer) clearTimeout(resumeTimer);
          showPauseLabel(false);
        } else {
          scheduleResume();
        }
        pokeChrome();
      }
    };

    const onResize = () => {
      measure();
      rebuild();
      clampStart();
      applyTransform();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyScrub(wheelPx(e));
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pid = e.pointerId;
      lastPx = e.clientX;
      lastPy = e.clientY;
      panX0 = e.clientX;
      panY0 = e.clientY;
      panT0 = performance.now();
      scrubbed = false;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pid == null || e.pointerId !== pid) return;
      const dx = e.clientX - lastPx;
      const dy = e.clientY - lastPy;
      lastPx = e.clientX;
      lastPy = e.clientY;
      // Finger up / left = scroll down / right = later digits.
      const scroll = -dx - dy;
      if (Math.abs(e.clientX - panX0) + Math.abs(e.clientY - panY0) > 12) {
        applyScrub(scroll);
        if (Math.abs(e.clientX - panX0) + Math.abs(e.clientY - panY0) > 56) {
          scrubbed = true;
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pid == null || e.pointerId !== pid) return;
      const dt = performance.now() - panT0;
      const dx = e.clientX - panX0;
      const dy = e.clientY - panY0;
      pid = null;
      // Short horizontal flick still nudges cruise speed (same as ←/→).
      if (!scrubbed && dt < 420 && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        nudgeSpeed(dx < 0 ? "left" : "right");
      }
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const cruising = now >= pausedUntil;
      if (cruising) {
        x += velRef.current * dt;
        if (startIdx <= 0 && x > maxX()) {
          x = maxX();
          if (velRef.current > 0) {
            velRef.current = 0;
            syncSpeedLabel();
          }
        }
      }
      if (scrubVel !== 0) {
        x += scrubVel * dt;
        scrubVel *= Math.exp(-dt / 0.14);
        if (Math.abs(scrubVel) < 4) scrubVel = 0;
        clampStart();
      }
      if (cruising || scrubVel !== 0) {
        maybeVirtualize();
        applyTransform();
      }
      raf = requestAnimationFrame(loop);
    };

    const restoreFromProgress = (): boolean => {
      const saved = getProgress();
      if (saved <= 0) return false;
      // saved is 0-based into 31415… → display index (0=3, 1=., 2=1, …)
      const target = saved + 1;
      const lead = Math.ceil(window.innerWidth / charW);
      startIdx = Math.max(0, target - lead);
      x = -(target - startIdx) * charW + window.innerWidth / 2;
      return true;
    };

    pokeChrome();
    measure();
    if (!restoreFromProgress()) x = introX();
    rebuild();
    applyTransform();
    pausedUntil = performance.now() + 2200;
    raf = requestAnimationFrame(loop);
    const root = rootRef.current;
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", pokeChrome, { passive: true });
    root?.addEventListener("wheel", onWheel, { passive: false });
    root?.addEventListener("pointerdown", onPointerDown);
    root?.addEventListener("pointermove", onPointerMove);
    root?.addEventListener("pointerup", onPointerUp);
    root?.addEventListener("pointercancel", onPointerUp);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", pokeChrome);
      root?.removeEventListener("wheel", onWheel);
      root?.removeEventListener("pointerdown", onPointerDown);
      root?.removeEventListener("pointermove", onPointerMove);
      root?.removeEventListener("pointerup", onPointerUp);
      root?.removeEventListener("pointercancel", onPointerUp);
      if (resumeTimer) clearTimeout(resumeTimer);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [fontPx, nudgeSpeed, pokeChrome, syncSpeedLabel]);

  return (
    <div
      ref={rootRef}
      className={`mode tape-mode ${isFullscreen ? "is-fs" : ""} ${chromeOn ? "chrome-on" : "chrome-off"}`}
      style={{ ["--ss-fs" as string]: `${fontPx}px`, background: "var(--bg)" }}
      aria-label={t`Tape scroll of pi`}
    >
      <span ref={probeRef} className="ss-probe" aria-hidden>
        0000000000
      </span>
      <div className="ss-stage">
        <div ref={tapeRef} className="ss-tape" />
        <div ref={trackRef} className="ss-track" />
      </div>
      <div ref={posRef} className="digit-meta ss-pos" />
      <span className="ss-speed">{speedLabel}</span>
      <p className={`mode-hint ${isFullscreen ? "is-hidden" : ""}`}>
        <Trans>← slower / rewind · → faster · scroll to scrub · Space pause</Trans>
      </p>
    </div>
  );
}
