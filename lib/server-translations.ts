// lib/server-translations.ts
import { getTranslation, hasTranslation } from './translations';
import { Locale } from './i18n';

export function getServerTranslation(locale: Locale) {
  const t = (key: string): string => {
    return getTranslation(locale, key);
  };

  const hasT = (key: string): boolean => {
    return hasTranslation(locale, key);
  };

  return {
    t,
    hasT,
    locale,
  };
}
