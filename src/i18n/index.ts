import { i18n } from "@lingui/core";

export const defaultLocale = "en";

const PROD_LOCALES = [
  { id: "en", label: "English", native: "EN" },
  { id: "es", label: "Español", native: "ES" },
] as const;

/**
 * Lingui pseudolocale (https://lingui.dev/guides/pseudolocalization).
 * Accented/padded English so hard-coded strings stick out.
 * Dev/QA only — omitted from `LOCALES` and the catalog graph in production.
 */
const QA_LOCALES = [{ id: "pseudo-en", label: "Pseudo (i18n QA)", native: "pseudo-en" }] as const;

export const LOCALES = import.meta.env.DEV ? [...PROD_LOCALES, ...QA_LOCALES] : [...PROD_LOCALES];

export type LocaleId = (typeof PROD_LOCALES)[number]["id"] | (typeof QA_LOCALES)[number]["id"];

export const LOCALE_STORAGE_KEY = "pi-wtf-locale";

type CatalogLoader = () => Promise<{ messages: Parameters<typeof i18n.load>[1] }>;

const catalogLoaders: Partial<Record<LocaleId, CatalogLoader>> = {
  en: () => import("../../locales/en/messages.po"),
  es: () => import("../../locales/es/messages.po"),
  // Vite DCE: this import is absent from production bundles.
  ...(import.meta.env.DEV
    ? { "pseudo-en": () => import("../../locales/pseudo-en/messages.po") }
    : {}),
};

export function isLocaleId(v: string | null | undefined): v is LocaleId {
  return LOCALES.some((l) => l.id === v);
}

export function loadStoredLocale(): LocaleId {
  try {
    const raw =
      localStorage.getItem(LOCALE_STORAGE_KEY) ?? localStorage.getItem("pi-trainer-locale");
    // migrate old "pseudo" key if anyone still has it (dev only)
    const migrated = raw === "pseudo" ? "pseudo-en" : raw;
    if (isLocaleId(migrated)) return migrated;
  } catch {
    /* private mode */
  }
  if (typeof navigator !== "undefined") {
    const nav = navigator.language?.slice(0, 2).toLowerCase();
    if (nav === "es") return "es";
    if (nav === "en") return "en";
  }
  return defaultLocale;
}

export function storeLocale(id: LocaleId): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}

export async function activateLocale(locale: LocaleId): Promise<void> {
  const resolved = catalogLoaders[locale] ? locale : defaultLocale;
  const loader = catalogLoaders[resolved] ?? catalogLoaders[defaultLocale]!;
  const { messages } = await loader();
  i18n.load(resolved, messages);
  i18n.activate(resolved);
  if (typeof document !== "undefined") {
    // pseudo-en isn't for a11y tools as a real language tag
    document.documentElement.lang = resolved === "pseudo-en" ? "en" : resolved;
  }
}

export { i18n };
