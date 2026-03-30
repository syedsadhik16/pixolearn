import { en, type TranslationKey } from './en';
import { hi } from './hi';
import { ta } from './ta';
import { te } from './te';
import { kn } from './kn';
import { ml } from './ml';
import type { LangCode } from '@/contexts/LanguageContext';

const translations: Record<LangCode, Record<TranslationKey, string>> = {
  en,
  hi,
  ta,
  te,
  kn,
  ml,
};

export function getTranslation(lang: LangCode, key: TranslationKey): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}

export type { TranslationKey };
export { translations };
