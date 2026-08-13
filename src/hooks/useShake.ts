import { useEffect, useRef } from "react";
import { ensureMotionPermission, motionDelta } from "../utils/motion";

const THRESHOLD = 24;
const COOLDOWN_MS = 1400;

/**
 * `arm`: Rain + phone — request iOS motion permission on the fullscreen tap.
 * `active`: also in fullscreen — actually change the theme on shake.
 */
export function useShake(arm: boolean, active: boolean, onShake: () => void): void {
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!arm) return;

    let lastAt = 0;
    let prev: { x: number; y: number; z: number } | null = null;
    let listening = false;

    const onMotion = (e: DeviceMotionEvent) => {
      if (!activeRef.current) return;
      const a = e.accelerationIncludingGravity ?? e.acceleration;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      const next = { x: a.x, y: a.y, z: a.z };
      if (!prev) {
        prev = next;
        return;
      }
      const d = motionDelta(prev, next);
      prev = next;
      if (d < THRESHOLD) return;
      const now = performance.now();
      if (now - lastAt < COOLDOWN_MS) return;
      lastAt = now;
      onShakeRef.current();
    };

    const start = () => {
      if (listening) return;
      listening = true;
      window.addEventListener("devicemotion", onMotion);
    };

    const onGesture = (e: Event) => {
      if (!(e.target instanceof Element) || !e.target.closest(".fullscreen-btn, .chaos-mode")) {
        return;
      }
      void ensureMotionPermission().then((ok) => {
        if (ok) start();
      });
    };

    // Android: no prompt — start immediately. iOS: wait for FS / canvas tap.
    void ensureMotionPermission().then((ok) => {
      if (ok) start();
    });
    window.addEventListener("click", onGesture, true);

    return () => {
      window.removeEventListener("click", onGesture, true);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [arm]);
}
