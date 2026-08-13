import { type RefObject, useCallback, useEffect, useState } from "react";

export function useFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => {
      const el = targetRef.current;
      setOn(
        Boolean(el && document.fullscreenElement === el) || Boolean(document.fullscreenElement),
      );
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [targetRef]);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        const el = targetRef.current ?? document.documentElement;
        await el.requestFullscreen();
      }
    } catch {
      /* denied */
    }
  }, [targetRef]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "f" && e.key !== "F") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT"))
        return;
      e.preventDefault();
      void toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return { fullscreen: on, toggleFullscreen: toggle };
}
