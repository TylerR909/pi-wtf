import { Trans } from "@lingui/react/macro";
import type { ModeId, ModeMeta } from "../modes/types";

export const MODES: readonly ModeMeta[] = [
  { id: "print", label: "Print", hint: "Wall of digits", immersive: true },
  { id: "digit", label: "Digit", hint: "Spacebar one-at-a-time", immersive: true },
  { id: "trainer", label: "Trainer", hint: "Left / right next digit", immersive: true },
  { id: "screensaver", label: "Screensaver", hint: "Slow scroll + tape", immersive: true },
  { id: "hacker", label: "Hacker", hint: "Mash keys like hackertyper", immersive: true },
  { id: "quiz", label: "Quiz", hint: "Nth digit?", immersive: true },
  { id: "base", label: "Base", hint: "π in binary, hex, …", immersive: true },
  { id: "chaos", label: "Rain", hint: "Matrix but π", immersive: true },
] as const;

interface Props {
  mode: ModeId;
  onChange: (id: ModeId) => void;
  visible: boolean;
}

export function ModeSelector({ mode, onChange, visible }: Props) {
  return (
    <nav
      className={`mode-selector ${visible ? "is-visible" : "is-hidden"}`}
      aria-label="Modes"
      aria-hidden={!visible}
    >
      <div className="mode-selector-inner">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={mode === m.id ? "active" : ""}
            onClick={() => onChange(m.id)}
            title={m.hint}
            tabIndex={visible ? 0 : -1}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="mode-selector-tagline">
        <Trans>Pi Trainer — a serious tool for unserious people</Trans>
      </p>
    </nav>
  );
}
