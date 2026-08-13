import type { MessageDescriptor } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useNarrow } from "../hooks/useNarrow";
import type { LocaleId } from "../i18n";
import type { ModeId } from "../modes/types";

interface ModeDef {
  id: ModeId;
  label: MessageDescriptor;
  hint: MessageDescriptor;
  immersive?: boolean;
}

export const MODES: readonly ModeDef[] = [
  {
    id: "pi",
    label: msg`Pi`,
    hint: msg`Wall of digits`,
  },
  {
    id: "digit",
    label: msg`Digit`,
    hint: msg`Spacebar one-at-a-time`,
    immersive: true,
  },
  {
    id: "trainer",
    label: msg`Trainer`,
    hint: msg`Left / right next digit`,
    immersive: true,
  },
  {
    id: "quiz",
    label: msg`Quiz`,
    hint: msg`Nth digit?`,
    immersive: true,
  },
  {
    id: "tape",
    label: msg`Tape`,
    hint: msg`Slow scroll + measuring tape`,
    immersive: true,
  },
  {
    id: "hacker",
    label: msg`Hacker`,
    hint: msg`Mash keys like hackertyper`,
    immersive: true,
  },
  {
    id: "base",
    label: msg`Base`,
    hint: msg`π in binary, hex, …`,
  },
  {
    id: "chaos",
    label: msg`Rain`,
    hint: msg`Matrix but π`,
    immersive: true,
  },
];

interface Props {
  mode: ModeId;
  onChange: (id: ModeId) => void;
  visible: boolean;
  /** Force re-render when language changes (React Compiler won't track i18n alone). */
  locale: LocaleId;
}

export function ModeSelector({ mode, onChange, visible, locale }: Props) {
  const { _, i18n } = useLingui();
  // Tie render output to active locale so labels recompute after activate()
  const active = i18n.locale || locale;
  const narrow = useNarrow();

  if (narrow) {
    const i = Math.max(
      0,
      MODES.findIndex((m) => m.id === mode),
    );
    const prev = MODES[(i - 1 + MODES.length) % MODES.length]!;
    const next = MODES[(i + 1) % MODES.length]!;
    return (
      <nav
        className={`mode-selector is-compact ${visible ? "is-visible" : "is-hidden"}`}
        aria-label={_(msg`Modes`)}
        aria-hidden={!visible}
        data-locale={active}
      >
        <div className="stepper mode-stepper">
          <button
            type="button"
            className="stepper-btn"
            tabIndex={visible ? 0 : -1}
            aria-label={_(msg`Previous mode`)}
            title={_(prev.label)}
            onClick={(e) => {
              onChange(prev.id);
              e.currentTarget.blur();
            }}
          >
            ←
          </button>
          <label>
            <span className="sr-only">
              <Trans>Modes</Trans>
            </span>
            <select
              value={mode}
              tabIndex={visible ? 0 : -1}
              aria-label={_(msg`Modes`)}
              onChange={(e) => {
                onChange(e.target.value as ModeId);
                e.currentTarget.blur();
              }}
            >
              {MODES.map((m) => (
                <option key={`${active}:${m.id}`} value={m.id} title={_(m.hint)}>
                  {_(m.label)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="stepper-btn"
            tabIndex={visible ? 0 : -1}
            aria-label={_(msg`Next mode`)}
            title={_(next.label)}
            onClick={(e) => {
              onChange(next.id);
              e.currentTarget.blur();
            }}
          >
            →
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`mode-selector ${visible ? "is-visible" : "is-hidden"}`}
      aria-label={_(msg`Modes`)}
      aria-hidden={!visible}
      data-locale={active}
    >
      <div className="mode-selector-inner">
        {MODES.map((m) => (
          <button
            key={`${active}:${m.id}`}
            type="button"
            data-mode={m.id}
            className={mode === m.id ? "active" : ""}
            onClick={(e) => {
              onChange(m.id);
              // Blur this button only — a delayed blurActive() also kills
              // the next mode's autofocus (Quiz input).
              e.currentTarget.blur();
            }}
            title={_(m.hint)}
            tabIndex={visible ? 0 : -1}
          >
            {_(m.label)}
          </button>
        ))}
      </div>
      <p className="mode-selector-tagline">
        <Trans>a serious tool for unserious people</Trans>
      </p>
    </nav>
  );
}
