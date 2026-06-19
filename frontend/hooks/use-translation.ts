'use client';

import { useLanguageStore } from '@/store/language-store';
import { translations, TranslationKey } from '@/lib/translations';

export function useTranslation() {
  const { language, setLanguage, toggleLanguage } = useLanguageStore();

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return { t, language, setLanguage, toggleLanguage };
}
