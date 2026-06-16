/**
 * LanguageSwitcher Component
 * Allows users to change the application language
 */

import React, { useCallback } from "react";
import { useLanguage, useLanguageName, useTranslate } from "../hooks/useI18n";

export function LanguageSwitcher({ variant = "dropdown" }) {
  const { changeLanguage, currentLanguage, allLanguages } = useLanguage();
  const getLanguageName = useLanguageName();
  const t = useTranslate();

  const handleLanguageChange = useCallback(
    (e) => {
      changeLanguage(e.target.value);
    },
    [changeLanguage]
  );

  if (variant === "buttons") {
    return (
      <div className="flex gap-2">
        {allLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => changeLanguage(lang)}
            className={`px-3 py-1 rounded transition ${
              currentLanguage === lang
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
            aria-label={`Switch to ${getLanguageName(lang)}`}
          >
            {getLanguageName(lang)}
          </button>
        ))}
      </div>
    );
  }

  // Default: dropdown
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="text-sm font-medium">
        {t("common.language")}:
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={handleLanguageChange}
        className="px-3 py-1 border border-gray-300 rounded bg-white cursor-pointer"
        aria-label={t("common.language")}
      >
        {allLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {getLanguageName(lang)}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Language Switcher for Header/Navbar
 * Compact version for navigation bars
 */
export function LanguageSwitcherCompact() {
  const { changeLanguage, currentLanguage, allLanguages } = useLanguage();
  const t = useTranslate();

  return (
    <div className="flex items-center gap-1">
      {allLanguages.map((lang, idx) => (
        <React.Fragment key={lang}>
          {idx > 0 && <span className="text-gray-400">|</span>}
          <button
            onClick={() => changeLanguage(lang)}
            className={`text-sm transition ${
              currentLanguage === lang
                ? "font-bold text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
            aria-label={`Switch to language: ${lang}`}
            aria-current={currentLanguage === lang ? "true" : "false"}
          >
            {lang.toUpperCase()}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
