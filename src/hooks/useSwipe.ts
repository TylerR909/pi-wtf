import { type RefObject, useEffect, useRef } from "react";

/**
 * Horizontal swipe. Pointer capture + stable callbacks so iOS doesn't
 * drop the gesture on a child <button> or a React re-render.
 *
 * Swipe left  → onLeft
 * Swipe right → onRight
 */
export function readSwipe(dx: number, dy: number, min = 48): "left" | "right" | null {
  if (Math.abs(dx) < min) return null;
  if (Math.abs(dx) < Math.abs(dy) * 1.2) return null;
  return dx < 0 ? "left" : "right";
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

    const start = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pid = e.pointerId;
      x0 = e.clientX;
      y0 = e.clientY;
      live = true;
      swiped = false;
      el.setPointerCapture?.(e.pointerId);
    };

    const move = (e: PointerEvent) => {
      if (!live || e.pointerId !== pid) return;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        e.preventDefault();
      }
    };

    const end = (e: PointerEvent) => {
      if (!live || e.pointerId !== pid) return;
      live = false;
      pid = null;
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
