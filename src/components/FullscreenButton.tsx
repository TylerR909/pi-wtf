import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { type RefObject, useCallback, useEffect, useState } from "react";
import { isFullscreenNow, subscribeFullscreen, toggleFullscreen } from "../utils/fullscreen";

interface Props {
  /** Defaults to the document element so the whole app (header included) goes FS. */
  targetRef?: RefObject<HTMLElement | null>;
  className?: string;
  /** Mobile header: icon only. Desktop keeps the “full” / “exit” label. */
  iconOnly?: boolean;
}

export function FullscreenButton({ targetRef, className = "", iconOnly = false }: Props) {
  const { _ } = useLingui();
  const [on, setOn] = useState(false);

  useEffect(() => {
    const sync = () => setOn(isFullscreenNow());
    sync();
    return subscribeFullscreen(sync);
  }, []);

  const toggle = useCallback(() => {
    void toggleFullscreen(targetRef?.current);
  }, [targetRef]);

  return (
    <button
      type="button"
      className={`fullscreen-btn ${className}`}
      onClick={toggle}
      aria-pressed={on}
      title={on ? _(msg`Exit fullscreen`) : _(msg`Fullscreen`)}
      aria-label={on ? _(msg`Exit fullscreen`) : _(msg`Fullscreen`)}
    >
      {on ? "⤢" : "⛶"}
      {!iconOnly && <span className="fs-label">{on ? _(msg`exit`) : _(msg`full`)}</span>}
    </button>
  );
}
