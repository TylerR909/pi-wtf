import { type RefObject, useEffect, useRef } from "react";

/**
 * Horizontal swipe. Callbacks live in refs so a React re-render mid-gesture
 * doesn't drop the listener. Do not setPointerCapture on pointerdown — that
 * retargets the click away from child 50/50 buttons.
 *
 * Swipe left  → onLeft
 * Swipe right → onRight
 */
export function readSwipe(dx: number, dy: number, min = 48): "left" | "right" | null {
  if (Math.abs(dx) < min) return null;
  if (Math.abs(dx) < Math.abs(dy) * 1.2) return null;
  return dx < 0 ? "left" : "right";
}

/** Far enough sideways to treat as a swipe-in-progress (not a tap). */
export function isSwipeLock(dx: number, dy: number): boolean {
  return Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.15;
}

export function useSwipe(
  target: RefObject<HTMLElement | null>,
  onLeft: () => void,
  onRight: () => void,
  enabled = true,
) {
  const leftRef = useRef(onLeft);
  const rightRef = useRef(onRight);
  leftRef.current = onLeft;
  rightRef.current = onRight;

  useEffect(() => {
    const el = target.current;
    if (!el || !enabled) return;

    let pid: number | null = null;
    let x0 = 0;
    let y0 = 0;
    let live = false;
    let swiped = false;
    let captured = false;

    const start = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pid = e.pointerId;
      x0 = e.clientX;
      y0 = e.clientY;
      live = true;
      swiped = false;
      captured = false;
    };

    const move = (e: PointerEvent) => {
      if (!live || e.pointerId !== pid) return;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (!isSwipeLock(dx, dy)) return;
      e.preventDefault();
      // Capture only after it's clearly a swipe, and only for touch/pen.
      // Mouse already has implicit capture; early capture steals button clicks.
      if (!captured && e.pointerType !== "mouse") {
        el.setPointerCapture?.(e.pointerId);
        captured = true;
      }
    };

    const end = (e: PointerEvent) => {
      if (!live || e.pointerId !== pid) return;
      live = false;
      pid = null;
      if (captured) {
        try {
          el.releasePointerCapture?.(e.pointerId);
        } catch {
          /* already released */
        }
        captured = false;
      }
      const dir = readSwipe(e.clientX - x0, e.clientY - y0);
      if (!dir) return;
      swiped = true;
      if (dir === "left") leftRef.current();
      else rightRef.current();
    };

    const click = (e: Event) => {
      if (!swiped) return;
      e.preventDefault();
      e.stopPropagation();
      swiped = false;
    };

    el.addEventListener("pointerdown", start);
    el.addEventListener("pointermove", move, { passive: false });
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("click", click, true);
    return () => {
      el.removeEventListener("pointerdown", start);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      el.removeEventListener("click", click, true);
    };
  }, [target, enabled]);
}
