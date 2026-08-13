import { useEffect, useRef } from "react";
import { ensureMotionPermission, motionDelta } from "../utils/motion";

const THRESHOLD_USER = 16;
const THRESHOLD_GRAV = 20;
const COOLDOWN_MS = 1400;

/**
 * `arm`: Rain + phone — listen / request iOS motion on a tap (PWA or Safari).
 * `active`: actually change the theme on shake.
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
      const user = e.acceleration;
      const grav = e.accelerationIncludingGravity;
      const a = user?.x != null && user.y != null && user.z != null ? user : grav;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      const next = { x: a.x, y: a.y, z: a.z };
      if (!prev) {
        prev = next;
        return;
      }
      const d = motionDelta(prev, next);
      prev = next;
      const need = user?.x != null ? THRESHOLD_USER : THRESHOLD_GRAV;
      if (d < need) return;
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

    // Attach now (Android / already-granted iOS). First-time iOS still needs
    // requestPermission() inside the pointerdown below.
    start();
    window.addEventListener("pointerdown", onGesture, true);

    return () => {
      window.removeEventListener("pointerdown", onGesture, true);
      window.removeEventListener("devicemotion", onMotion);
    };
  }, [arm]);
}
