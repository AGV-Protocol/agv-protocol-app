// hooks/useTranslations.ts
'use client';

import { useParams } from 'next/navigation';
import { getTranslation, hasTranslation } from '@/lib/translations';
import { Locale } from '@/lib/i18n';

export function useTranslations() {
  const params = useParams();
  const locale = (params?.locale as Locale) || 'en';

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
