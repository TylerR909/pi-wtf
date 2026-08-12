import { Trans } from "@lingui/react/macro";
import { applyTheme, getTheme, storeThemeId, THEMES, type ThemeId } from "../themes/themes";

interface Props {
  themeId: ThemeId;
  onChange: (id: ThemeId) => void;
  visible: boolean;
}

export function ThemePicker({ themeId, onChange, visible }: Props) {
  return (
    <div className={`theme-picker ${visible ? "is-visible" : "is-hidden"}`} aria-hidden={!visible}>
      <label>
        <span className="sr-only">
          <Trans>Theme</Trans>
        </span>
        <select
          value={themeId}
          tabIndex={visible ? 0 : -1}
          onChange={(e) => {
            const id = e.target.value as ThemeId;
            applyTheme(getTheme(id));
            storeThemeId(id);
            onChange(id);
          }}
          aria-label="Color theme"
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
