import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';
import taTranslation from './locales/ta/translation.json';

const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
  ta: { translation: taTranslation },
};

// Retrieve saved language preference or default to English
const savedLanguage =
  (typeof window !== 'undefined' && localStorage.getItem('food_allergy_language')) || 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: ['en', 'hi', 'ta'].includes(savedLanguage) ? savedLanguage : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
