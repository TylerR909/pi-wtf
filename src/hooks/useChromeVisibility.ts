import { useCallback, useEffect, useRef, useState } from "react";

const IDLE_MS = 2800;

/**
 * Fade chrome (mode selector, etc.) after inactivity or when a mode requests
 * immersion. Reveal on mouse move, tab focus / keyboard navigation.
 */
export function useChromeVisibility(immersive: boolean) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forceShow = useRef(false);

  const bump = useCallback(() => {
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    if (forceShow.current) return;
    timer.current = setTimeout(() => {
      setVisible(false);
    }, IDLE_MS);
  }, []);

  useEffect(() => {
    const onMove = () => bump();
    const onKey = (e: KeyboardEvent) => {
      // Tab / focus navigation or modifier combos should always reveal chrome
      if (e.key === "Tab" || e.altKey || e.metaKey) {
        forceShow.current = true;
        setVisible(true);
        if (timer.current) clearTimeout(timer.current);
        // release force after a beat if they stop tabbing
        timer.current = setTimeout(() => {
          forceShow.current = false;
          bump();
        }, 4000);
        return;
      }
      bump();
    };
    const onFocusIn = () => {
      forceShow.current = true;
      setVisible(true);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onMove, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("focusin", onFocusIn);

    // start idle clock
    bump();

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("focusin", onFocusIn);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [bump]);

  // When immersive mode activates, hide sooner
  useEffect(() => {
    if (immersive && !forceShow.current) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), 900);
    } else {
      bump();
    }
  }, [immersive, bump]);

  return { chromeVisible: visible, revealChrome: bump };
}
