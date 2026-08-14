import { useCallback, useEffect, useRef, useState } from "react";

const IDLE_MS = 3900;
const PLAY_HIDE_MS = 2100;

function isChromeNavKey(e: KeyboardEvent): boolean {
  if (e.key === "Tab" || e.altKey || e.metaKey) return true;
  // Theme cycle — show the picker
  if (e.key === "ArrowUp" || e.key === "ArrowDown") return true;
  return false;
}

function isPlaySurface(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("#main, .stage, .mode"));
}

export function isKeepChrome(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("[data-keep-chrome]"));
}

/**
 * Fade chrome after idle, or when the user is actually playing.
 * Reveal on mouse move, tabbing, or clicking the chrome itself.
 * Space / hold / stage clicks are focus — they must not keep the chrome up.
 */
export function useChromeVisibility(immersive: boolean, suppressed = false, pinned = false) {
  const [visible, setVisible] = useState(true);
  const visibleRef = useRef(true);
  visibleRef.current = visible;
  const suppressedRef = useRef(suppressed);
  suppressedRef.current = suppressed;
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const forceShow = useRef(false);
  const hidingForPlay = useRef(false);
  const holdChrome = useRef(false);

  const bump = useCallback(() => {
    if (suppressedRef.current) return;
    hidingForPlay.current = false;
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    if (forceShow.current || pinnedRef.current || holdChrome.current) return;
    timer.current = setTimeout(() => {
      setVisible(false);
    }, IDLE_MS);
  }, []);

  const armFocusHide = useCallback(() => {
    if (suppressedRef.current || pinnedRef.current || holdChrome.current) return;
    if (forceShow.current) return;
    if (!visibleRef.current) return;
    if (hidingForPlay.current) return;
    hidingForPlay.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      hidingForPlay.current = false;
      setVisible(false);
    }, PLAY_HIDE_MS);
  }, []);

  useEffect(() => {
    const pinOnRandom = () => {
      holdChrome.current = true;
      hidingForPlay.current = false;
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
    };

    const onMove = (e: MouseEvent) => {
      if (isKeepChrome(e.target)) {
        pinOnRandom();
        return;
      }
      if (holdChrome.current) holdChrome.current = false;
      bump();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (isKeepChrome(e.target)) {
        pinOnRandom();
        return;
      }
      if (isPlaySurface(e.target)) {
        armFocusHide();
        return;
      }
      bump();
    };
    const onKey = (e: KeyboardEvent) => {
      if (isChromeNavKey(e)) {
        forceShow.current = e.key === "Tab" || e.altKey || e.metaKey;
        setVisible(true);
        hidingForPlay.current = false;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(
          () => {
            forceShow.current = false;
            bump();
          },
          forceShow.current ? 4000 : IDLE_MS,
        );
        return;
      }
      // Gameplay (Space, hold-repeat, arrows, mash keys): enter focus
      armFocusHide();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    window.addEventListener("keydown", onKey);

    bump();

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKey);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [bump, armFocusHide]);

  useEffect(() => {
    if (suppressed) {
      setVisible(false);
      if (timer.current) clearTimeout(timer.current);
      return;
    }
    if (pinned) {
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      return;
    }
    if (immersive && !forceShow.current) {
      if (timer.current) clearTimeout(timer.current);
      hidingForPlay.current = true;
      timer.current = setTimeout(() => {
        hidingForPlay.current = false;
        setVisible(false);
      }, PLAY_HIDE_MS);
    } else {
      bump();
    }
  }, [immersive, suppressed, pinned, bump]);

  return { chromeVisible: visible, revealChrome: bump };
}
