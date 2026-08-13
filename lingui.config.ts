import { defineConfig } from "@lingui/cli";
import { formatter } from "@lingui/format-po";

/**
 * Pseudolocale per https://lingui.dev/guides/pseudolocalization
 * — accented/padded source strings for i18n QA. Not a real language.
 */
export default defineConfig({
  sourceLocale: "en",
  locales: ["en", "es", "pseudo-en"],
  pseudoLocale: { locale: "pseudo-en" },
  fallbackLocales: {
    "pseudo-en": "en",
    default: "en",
  },
  catalogs: [
    {
      path: "<rootDir>/locales/{locale}/messages",
      include: ["src"],
    },
  ],
  format: formatter({ lineNumbers: false }),
});
