import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { LOCALES, type LocaleId } from "../i18n";

interface Props {
  locale: LocaleId;
  onChange: (id: LocaleId) => void;
  visible: boolean;
}

const FLAGS: Record<LocaleId, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
  "pseudo-en": "🧪",
};

/** Endonyms — never run through the active catalog. */
const LOCALE_OPTION: Record<LocaleId, string> = {
  en: "EN · English",
  es: "ES · Español",
  "pseudo-en": "pseudo-en · i18n QA",
};

export function LocalePicker({ locale, onChange, visible }: Props) {
  const { _, i18n } = useLingui();
  const active = i18n.locale || locale;

  return (
    <div
      className={`locale-picker ${visible ? "is-visible" : "is-hidden"}`}
      aria-hidden={!visible}
      data-locale={active}
    >
      <label>
        <span className="sr-only">
          <Trans>Language</Trans>
        </span>
        <select
          value={locale}
          tabIndex={visible ? 0 : -1}
          onChange={(e) => {
            onChange(e.target.value as LocaleId);
            e.currentTarget.blur();
          }}
          aria-label={_(msg`Language`)}
          title={_(msg`Language`)}
        >
          {LOCALES.map((l) => (
            <option key={l.id} value={l.id}>
              {FLAGS[l.id]} {LOCALE_OPTION[l.id]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
