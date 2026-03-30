import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation, type TranslationKey } from '@/lib/translations';

export function useTranslation() {
  const { language, setLanguage, hasSelectedLanguage } = useLanguage();

  const t = useCallback(
    (key: TranslationKey): string => getTranslation(language, key),
    [language]
  );

  return { t, language, setLanguage, hasSelectedLanguage };
}
