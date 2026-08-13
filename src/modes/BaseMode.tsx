import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useMemo, useState } from "react";
import { PI_DIGITS } from "../data/pi-digits";
import { useOptions } from "../options/OptionsContext";
import { BASE_PRESETS, piInBase } from "../utils/base";
import { shuffleInPlace } from "../utils/random";

const FRAC = 2400;

/** Dingbats pretending to be a numeral system. Not a real base. */
const WING = ["☞", "☺", "☼", "♦", "♣", "♠", "♥", "•", "○", "●"] as const;

const BASE_LABELS: Record<number, ReturnType<typeof msg>> = {
  2: msg`Binary`,
  3: msg`Ternary`,
  8: msg`Octal`,
  10: msg`Decimal`,
  12: msg`Dozenal`,
  16: msg`Hex`,
  36: msg`Base36`,
};

function piWingdings(fracDigits: number, glyphs: readonly string[]): string {
  const frac = PI_DIGITS.slice(1, 1 + fracDigits);
  let out = `${glyphs[3] ?? "?"}.`;
  for (const ch of frac) {
    const d = ch.charCodeAt(0) - 48;
    out += glyphs[d] ?? "?";
  }
  return out;
}

export function BaseMode() {
  useOptions({ idle: false });
  const { _ } = useLingui();
  const [base, setBase] = useState(16);
  const [custom, setCustom] = useState("16");
  const [wing, setWing] = useState(false);
  const [glyphs, setGlyphs] = useState<readonly string[]>(() => [...WING]);

  const expansion = useMemo(() => {
    if (wing) return piWingdings(FRAC, glyphs);
    try {
      return piInBase(base, FRAC);
    } catch {
      return "???";
    }
  }, [base, wing, glyphs]);

  const applyCustom = (raw: string) => {
    setCustom(raw);
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 2 && n <= 36) {
      setBase(n);
      setWing(false);
    }
  };

  const step = (dir: -1 | 1) => {
    const next = Math.min(36, Math.max(2, base + dir));
    setBase(next);
    setCustom(String(next));
    setWing(false);
  };

  return (
    <div className="mode base-mode" aria-label={_(msg`Pi in other bases`)}>
      <div className="base-toolbar">
        {BASE_PRESETS.map((p) => (
          <button
            key={p.base}
            type="button"
            className={!wing && base === p.base ? "active" : ""}
            onClick={() => {
              setBase(p.base);
              setCustom(String(p.base));
              setWing(false);
            }}
          >
            {_(BASE_LABELS[p.base] ?? msg`Base ${p.base}`)}
          </button>
        ))}
        <button
          type="button"
          className={wing ? "active" : ""}
          onClick={() => {
            setWing(true);
            setGlyphs(shuffleInPlace([...WING]));
          }}
        >
          <Trans>Wingdings</Trans>
        </button>
        <div className="stepper base-stepper">
          <button
            type="button"
            className="stepper-btn"
            aria-label={_(msg`Previous base`)}
            disabled={!wing && base <= 2}
            onClick={() => step(-1)}
          >
            ←
          </button>
          <input
            className="stepper-mid"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={custom}
            aria-label={_(msg`Base`)}
            onChange={(e) => applyCustom(e.target.value.replace(/\D/g, "").slice(0, 2))}
            onBlur={() => {
              const n = Number.parseInt(custom, 10);
              if (!Number.isFinite(n) || n < 2 || n > 36) setCustom(String(base));
            }}
          />
          <button
            type="button"
            className="stepper-btn"
            aria-label={_(msg`Next base`)}
            disabled={!wing && base >= 36}
            onClick={() => step(1)}
          >
            →
          </button>
        </div>
      </div>

      <p className="base-label">
        {wing ? <Trans>π in Wingdings (not a real base)</Trans> : <Trans>π in base {base}</Trans>}
      </p>
      <p className="base-quip">
        <Trans>Why? Idk buddy, you clicked the button, not me.</Trans>
      </p>

      <pre className={`base-stream ${wing ? "is-wing" : ""}`}>{expansion}</pre>
    </div>
  );
}
