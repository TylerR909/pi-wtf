import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useState } from "react";
import { useNarrow } from "../hooks/useNarrow";
import type { LocaleId } from "../i18n";
import { OptionsHost } from "../options/OptionsContext";
import type { ThemeId } from "../themes/themes";
import { loadJson, saveJson } from "../utils/storage";
import { Footer } from "./Footer";
import { LocalePicker } from "./LocalePicker";
import { ThemePicker } from "./ThemePicker";

const OPEN_KEY = "chrome-more";

interface Props {
  visible: boolean;
  locale: LocaleId;
  themeId: ThemeId;
  onLocale: (id: LocaleId) => void;
  onTheme: (id: ThemeId) => void;
}

export function ChromeBottom({ visible, locale, themeId, onLocale, onTheme }: Props) {
  const { _ } = useLingui();
  const narrow = useNarrow();
  const [open, setOpen] = useState(() => loadJson(OPEN_KEY, false));

  const dock = (
    <div className={`chrome-dock ${visible ? "is-visible" : "is-hidden"}`}>
      <LocalePicker locale={locale} onChange={onLocale} visible={visible} />
      <ThemePicker themeId={themeId} onChange={onTheme} visible={visible} locale={locale} />
    </div>
  );

  if (!narrow) {
    return (
      <div className="chrome-bottom">
        <Footer visible={visible} />
        {dock}
      </div>
    );
  }

  return (
    <div className={`chrome-bottom is-drawer ${visible ? "is-visible" : "is-hidden"}`}>
      <details
        className="chrome-more"
        open={open}
        onToggle={(e) => {
          const next = e.currentTarget.open;
          setOpen(next);
          saveJson(OPEN_KEY, next);
        }}
      >
        <summary aria-label={open ? _(msg`Hide footer`) : _(msg`Show footer`)}>
          <svg
            className="chrome-more-chevron"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            role="presentation"
            aria-hidden
          >
            <path
              d="M5 15.5 L12 8.5 L19 15.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </summary>
        <div className="chrome-drawer-body">
          <OptionsHost visible={visible} fullscreen={false} />
          {dock}
          <Footer visible={visible} />
        </div>
      </details>
    </div>
  );
}
