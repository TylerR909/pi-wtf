import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

interface Props {
  on: boolean;
  onChange: (on: boolean) => void;
}

/** Header toggle — same chrome as fullscreen. */
export function ProToggle({ on, onChange }: Props) {
  const { _ } = useLingui();
  return (
    <button
      type="button"
      className={`fullscreen-btn pro-btn ${on ? "is-on" : ""}`}
      aria-pressed={on}
      title={on ? _(msg`Show every digit`) : _(msg`Pro: type to reveal`)}
      aria-label={on ? _(msg`Show every digit`) : _(msg`Pro: type to reveal`)}
      onClick={(e) => {
        onChange(!on);
        e.currentTarget.blur();
      }}
    >
      <span className="fs-label">Pro</span>
    </button>
  );
}
