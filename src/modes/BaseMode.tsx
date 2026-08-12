import { Trans } from "@lingui/react/macro";
import { useMemo, useState } from "react";
import { BASE_PRESETS, piInBase } from "../utils/base";

const FRAC = 512;

export function BaseMode() {
  const [base, setBase] = useState(16);
  const [custom, setCustom] = useState("16");

  const expansion = useMemo(() => {
    try {
      const b = base;
      return piInBase(b, FRAC);
    } catch {
      return "???";
    }
  }, [base]);

  const applyCustom = () => {
    const n = Number.parseInt(custom, 10);
    if (Number.isFinite(n) && n >= 2 && n <= 36) setBase(n);
  };

  return (
    <div className="mode base-mode" aria-label="Pi in other bases">
      <div className="base-toolbar">
        {BASE_PRESETS.map((p) => (
          <button
            key={p.base}
            type="button"
            className={base === p.base ? "active" : ""}
            onClick={() => {
              setBase(p.base);
              setCustom(String(p.base));
            }}
          >
            {p.label}
          </button>
        ))}
        <label className="base-custom">
          <span>
            <Trans>Base</Trans>
          </span>
          <input
            type="number"
            min={2}
            max={36}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onBlur={applyCustom}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyCustom();
            }}
          />
        </label>
      </div>

      <p className="base-label">
        <Trans>π in base {base}</Trans>
      </p>

      <pre className="base-stream">{expansion}</pre>

      <p className="mode-hint">
        <Trans>
          Dynamically converted from the decimal expansion. Bases 2–36. Yes, dozenal is real.
        </Trans>
      </p>
    </div>
  );
}
