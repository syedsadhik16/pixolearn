import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const LANGUAGE_KEY = 'selectedLanguage';
const FIRST_LAUNCH_KEY = 'pixo-language-selected';

export type LangCode = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml';

interface LanguageContextType {
  language: LangCode;
  setLanguage: (code: LangCode) => void;
  hasSelectedLanguage: boolean;
  markLanguageSelected: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getStoredLanguage(): LangCode {
  const stored = localStorage.getItem(LANGUAGE_KEY);
  if (stored && ['en', 'hi', 'ta', 'te', 'kn', 'ml'].includes(stored)) {
    return stored as LangCode;
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState<LangCode>(getStoredLanguage);
  const [hasSelected, setHasSelected] = useState(() => localStorage.getItem(FIRST_LAUNCH_KEY) === 'true');

  const setLanguage = useCallback((code: LangCode) => {
    setLangState(code);
    localStorage.setItem(LANGUAGE_KEY, code);
    localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    setHasSelected(true);
  }, []);

  const markLanguageSelected = useCallback(() => {
    localStorage.setItem(FIRST_LAUNCH_KEY, 'true');
    setHasSelected(true);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, hasSelectedLanguage: hasSelected, markLanguageSelected }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
