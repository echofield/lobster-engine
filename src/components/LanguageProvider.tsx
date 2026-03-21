'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Language, LanguageContextType, I18nStrings, Translatable } from '@/types/studio';
import { strings, defaultLanguage } from '@/data/i18n';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  // Load language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('studio-intelligence-lang');
    if (stored === 'en' || stored === 'fr') {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('studio-intelligence-lang', lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: keyof I18nStrings): string => {
    const entry = strings[key];
    if (!entry) return String(key);
    return entry[language];
  }, [language]);

  const tr = useCallback((obj: Translatable): string => {
    return obj[language];
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
