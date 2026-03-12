'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import es from '@/locales/es.json';
import en from '@/locales/en.json';

type Locale = 'es' | 'en';

const dictionaries: Record<Locale, Record<string, Record<string, string>>> = { es, en };

interface I18nContext {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const I18nCtx = createContext<I18nContext>({
  locale: 'es',
  setLocale: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null;
    if (saved && dictionaries[saved]) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem('locale', l);
    document.documentElement.lang = l;
  }

  function t(key: string): string {
    const [section, field] = key.split('.');
    return dictionaries[locale]?.[section]?.[field] ?? key;
  }

  return (
    <I18nCtx.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  return useContext(I18nCtx);
}
