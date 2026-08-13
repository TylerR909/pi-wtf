import { useEffect } from "react";
import { releaseWakeLock, requestScreenWakeLock } from "../utils/wake-lock";

/**
 * Ask the OS to keep the screen on while `enabled`.
 * Released on hide / disable. Retries after a tap if the first request was denied
 * (iOS often wants a user gesture). Silent no-op when the API is missing.
 */
export function useWakeLock(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (cancelled || (sentinel && !sentinel.released)) return;
      sentinel = await requestScreenWakeLock();
    };

    const onVis = () => {
      if (document.visibilityState === "visible") void acquire();
      else {
        void releaseWakeLock(sentinel);
        sentinel = null;
      }
    };

    void acquire();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointerdown", acquire, { passive: true });

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointerdown", acquire);
      void releaseWakeLock(sentinel);
    };
  }, [enabled]);
}
