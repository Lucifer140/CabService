import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TranslationDictionary } from './types';
import { en } from './translations/en';
import { mr } from './translations/mr';
import { hi } from './translations/hi';

const dictionaries: Record<Language, TranslationDictionary> = {
  en,
  mr,
  hi,
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof TranslationDictionary, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => en[key] || '',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('sangita_lang') as Language;
      if (saved && (saved === 'en' || saved === 'mr' || saved === 'hi')) {
        return saved;
      }
    } catch {
      // localStorage unavailable in some private browsing modes
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('sangita_lang', lang);
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: keyof TranslationDictionary, fallback?: string): string => {
    const currentDict = dictionaries[language] || en;
    const value = currentDict[key] || en[key];
    if (value) return value;
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
