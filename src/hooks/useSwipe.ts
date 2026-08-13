import { type RefObject, useEffect } from "react";

/**
 * Horizontal swipe via Pointer Events — works in mobile Safari/Chrome
 * without any native gesture library.
 *
 * Swipe left  → onLeft
 * Swipe right → onRight
 */
export function useSwipe(
  target: RefObject<HTMLElement | null>,
  onLeft: () => void,
  onRight: () => void,
  enabled = true,
) {
  useEffect(() => {
    const el = target.current;
    if (!el || !enabled) return;

    let pid: number | null = null;
    let x0 = 0;
    let y0 = 0;
    let live = false;

    const start = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pid = e.pointerId;
      x0 = e.clientX;
      y0 = e.clientY;
      live = true;
    };

    const move = (e: PointerEvent) => {
      if (!live || e.pointerId !== pid) return;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      // Lock to horizontal once it's clearly a swipe
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        e.preventDefault();
      }
    };

    const end = (e: PointerEvent) => {
      if (!live || e.pointerId !== pid) return;
      live = false;
      pid = null;
      const dx = e.clientX - x0;
      const dy = e.clientY - y0;
      if (Math.abs(dx) < 48) return;
      if (Math.abs(dx) < Math.abs(dy) * 1.2) return; // mostly vertical = scroll
      if (dx < 0) onLeft();
      else onRight();
    };

    el.addEventListener("pointerdown", start);
    el.addEventListener("pointermove", move, { passive: false });
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    return () => {
      el.removeEventListener("pointerdown", start);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
    };
  }, [target, onLeft, onRight, enabled]);
}
