/**
 * i18n Configuration
 * Initializes i18next for multi-language support across ArthOS
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enCommon from "./locales/en/common.json";
import hiCommon from "./locales/hi/common.json";

// Supported languages
const resources = {
  en: {
    common: enCommon,
  },
  hi: {
    common: hiCommon,
  },
};

// Get initial language from browser or localStorage
const getInitialLanguage = () => {
  // Check localStorage for saved preference
  const saved = localStorage.getItem("i18nLanguage");
  if (saved && Object.keys(resources).includes(saved)) {
    return saved;
  }

  // Check browser language
  const browserLang = navigator.language.split("-")[0];
  if (Object.keys(resources).includes(browserLang)) {
    return browserLang;
  }

  // Default to English
  return "en";
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: {
      escapeValue: false, // React already escapes XSS
      formatSeparator: ",",
    },
    ns: ["common"],
    react: {
      useSuspense: false, // Disable suspense for now, can be enabled per component
    },
  });

export default i18n;
