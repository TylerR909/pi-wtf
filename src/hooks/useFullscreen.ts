import { type RefObject, useCallback, useEffect, useState } from "react";
import { isFullscreenNow, subscribeFullscreen, toggleFullscreen } from "../utils/fullscreen";

export function useFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [on, setOn] = useState(() => isFullscreenNow());

  useEffect(() => subscribeFullscreen(() => setOn(isFullscreenNow())), []);

  const toggle = useCallback(() => {
    void toggleFullscreen(targetRef.current);
  }, [targetRef]);

  return { fullscreen: on, toggleFullscreen: toggle };
}
