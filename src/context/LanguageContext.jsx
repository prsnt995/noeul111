import React, { createContext, useContext, useState, useEffect } from 'react';
import koTranslations from '../locales/ko.json';
import enTranslations from '../locales/en.json';
import { formatKRW } from '../utils/formatters.js';

const LanguageContext = createContext();

const translations = {
  ko: koTranslations,
  en: enTranslations,
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('noeul_lang') || 'ko';
  });

  useEffect(() => {
    localStorage.setItem('noeul_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (newLang) => {
    if (newLang === 'ko' || newLang === 'en') {
      setLangState(newLang);
    }
  };

  /**
   * Translate key with optional parameter substitution
   * Example: t('nav.shop') or t('home.hero_title')
   */
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let current = translations[lang];

    for (const k of keys) {
      if (current && current[k] !== undefined) {
        current = current[k];
      } else {
        // Fallback to Korean if key missing
        let fallback = translations['ko'];
        for (const fbKey of keys) {
          if (fallback && fallback[fbKey] !== undefined) {
            fallback = fallback[fbKey];
          } else {
            return key;
          }
        }
        current = fallback;
        break;
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
