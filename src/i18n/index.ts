import { i18n } from "@lingui/core";

export const defaultLocale = "en";

export async function loadCatalog(locale: string) {
  const { messages } = await import(`../../locales/${locale}/messages.po`);
  i18n.load(locale, messages);
  i18n.activate(locale);
}

export { i18n };
