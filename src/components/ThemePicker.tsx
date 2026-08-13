import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import type { LocaleId } from "../i18n";
import { cycleThemeId, THEMES, type ThemeId } from "../themes/themes";

const THEME_LABELS: Record<Exclude<ThemeId, "america">, ReturnType<typeof msg>> = {
  midnight: msg`🌙 Midnight`,
  terminal: msg`💻 Terminal`,
  paper: msg`📄 Paper`,
  vaporwave: msg`🌴 Vaporwave`,
  chillwave: msg`🌅 Chillwave`,
  celestia: msg`🦄 Princess Celestia`,
  hotdog: msg`🌭 Hotdog Stand`,
  cotton: msg`🍭 Cotton Candy`,
  chalkboard: msg`✏️ Chalkboard`,
  blueprint: msg`📐 Blueprint`,
  amber: msg`📺 Amber CRT`,
  raspberry: msg`🍓 Raspberry`,
  noir: msg`🕶️ Noir`,
  diner: msg`☕ Diner`,
  hazard: msg`⚠️ Caution Tape`,
  pokeball: msg`🔴 Pokéball`,
};

/** Never translate. The joke is the English. */
const AMERICA_LABEL = "🦅 America (hell yeah!)";

interface Props {
  themeId: ThemeId;
  onChange: (id: ThemeId) => void;
  visible: boolean;
  locale: LocaleId;
}

export function ThemePicker({ themeId, onChange, visible, locale }: Props) {
  const { _, i18n } = useLingui();
  const active = i18n.locale || locale;
  const prev = cycleThemeId(themeId, -1);
  const next = cycleThemeId(themeId, 1);
  const nameOf = (id: ThemeId) => (id === "america" ? AMERICA_LABEL : _(THEME_LABELS[id]));

  return (
    <div
      className={`theme-picker ${visible ? "is-visible" : "is-hidden"}`}
      aria-hidden={!visible}
      data-locale={active}
    >
      <div className="stepper theme-stepper">
        <button
          type="button"
          className="stepper-btn"
          tabIndex={visible ? 0 : -1}
          aria-label={_(msg`Previous theme`)}
          title={nameOf(prev)}
          onClick={(e) => {
            onChange(prev);
            e.currentTarget.blur();
          }}
        >
          ←
        </button>
        <label>
          <span className="sr-only">
            <Trans>Theme</Trans>
          </span>
          <select
            key={active}
            value={themeId}
            tabIndex={visible ? 0 : -1}
            onChange={(e) => {
              const id = e.target.value as ThemeId;
              if (id === themeId) return;
              onChange(id);
              e.currentTarget.blur();
            }}
            aria-label={_(msg`Theme`)}
          >
            {THEMES.map((th) => (
              <option key={th.id} value={th.id}>
                {th.id === "america" ? AMERICA_LABEL : _(THEME_LABELS[th.id])}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="stepper-btn"
          tabIndex={visible ? 0 : -1}
          aria-label={_(msg`Next theme`)}
          title={nameOf(next)}
          onClick={(e) => {
            onChange(next);
            e.currentTarget.blur();
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
