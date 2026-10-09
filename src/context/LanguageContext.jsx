import React, { createContext, useContext, useEffect } from 'react';
import koTranslations from '../locales/ko.json';
import { formatKRW } from '../utils/formatters.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const lang = 'ko';

  useEffect(() => {
    localStorage.setItem('noeul_lang', 'ko');
    document.documentElement.lang = 'ko';
  }, []);

  const setLang = () => {
    // Korean-only: language is permanently locked to 'ko'
  };

  /**
   * Translate key with optional parameter substitution from Korean dictionary
   * Example: t('nav.shop') or t('home.hero_title')
   */
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let current = koTranslations;

    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        return key;
      }
    }

    if (typeof current === 'string') {
      let result = current;
      for (const [pKey, pVal] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
      }
      return result;
    }

    return current || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, formatKRW }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
