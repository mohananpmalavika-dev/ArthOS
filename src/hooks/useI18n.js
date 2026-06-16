/**
 * i18n Custom Hooks
 * Provides convenient hooks for accessing translations and language functionality
 */

import { useTranslation } from "react-i18next";
import { useCallback } from "react";

/**
 * Hook to get translations for a specific namespace
 * Usage: const t = useTranslate();
 *        <div>{t('common.loading')}</div>
 */
export function useTranslate() {
  const { t } = useTranslation("common");
  return t;
}

/**
 * Hook to change the current language
 * Usage: const { changeLanguage, currentLanguage } = useLanguage();
 *        <button onClick={() => changeLanguage('hi')}>हिंदी</button>
 */
export function useLanguage() {
  const { i18n } = useTranslation();

  const changeLanguage = useCallback(
    (lang) => {
      i18n.changeLanguage(lang);
      localStorage.setItem("i18nLanguage", lang);
    },
    [i18n]
  );

  const currentLanguage = i18n.language;
  const allLanguages = Object.keys(i18n.store.data);

  return {
    changeLanguage,
    currentLanguage,
    allLanguages,
    isLoading: i18n.language !== i18n.resolvedLanguage,
  };
}

/**
 * Hook for formatted currency
 * Usage: const formatCurrency = useCurrency();
 *        <span>{formatCurrency(1000)}</span> -> ₹1000
 */
export function useCurrency() {
  const t = useTranslate();

  return useCallback(
    (value) => {
      if (typeof value !== "number") return t("common.loading");
      return t("format.currency", { value: value.toLocaleString() });
    },
    [t]
  );
}

/**
 * Hook for formatted percentage
 * Usage: const formatPercent = usePercentage();
 *        <span>{formatPercent(85.5)}</span> -> 85.5%
 */
export function usePercentage() {
  const t = useTranslate();

  return useCallback(
    (value) => {
      if (typeof value !== "number") return t("common.loading");
      return t("format.percentage", {
        value: value.toFixed(1),
      });
    },
    [t]
  );
}

/**
 * Hook for formatted number with decimals
 * Usage: const formatNumber = useNumberFormat();
 *        <span>{formatNumber(1234.567)}</span> -> 1234.57
 */
export function useNumberFormat() {
  const t = useTranslate();

  return useCallback(
    (value, decimals = 2) => {
      if (typeof value !== "number") return t("common.loading");
      return value.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    },
    [t]
  );
}

/**
 * Hook for date formatting based on language
 * Usage: const formatDate = useDateFormat();
 *        <span>{formatDate(new Date())}</span>
 */
export function useDateFormat() {
  const { i18n } = useTranslation();

  return useCallback(
    (date, options = {}) => {
      if (!date) return "";
      const defaultOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        ...options,
      };
      return new Date(date).toLocaleDateString(i18n.language, defaultOptions);
    },
    [i18n.language]
  );
}

/**
 * Hook for pluralization
 * Usage: const t = useTranslate();
 *        const count = 5;
 *        <span>{usePlural(count, 'day')}</span> -> 5 Days
 */
export function usePlural() {
  const t = useTranslate();

  return useCallback(
    (count, key) => {
      const word = t(`time.${key}s`) || t(`time.${key}`);
      return `${count} ${word}`;
    },
    [t]
  );
}

/**
 * Hook for getting all translations for a namespace
 * Usage: const translations = useAllTranslations();
 */
export function useAllTranslations() {
  const { i18n } = useTranslation("common");

  return useCallback(() => {
    return i18n.store.data[i18n.language]?.common || {};
  }, [i18n]);
}

/**
 * Hook for language-specific text directions
 * Usage: const getDir = useTextDirection();
 *        <div dir={getDir()}>Content</div>
 */
export function useTextDirection() {
  const { i18n } = useTranslation();

  return useCallback(() => {
    // RTL languages: ar, he, fa, ur, etc.
    const rtlLanguages = ["ar", "he", "fa", "ur", "yi"];
    return rtlLanguages.includes(i18n.language) ? "rtl" : "ltr";
  }, [i18n.language]);
}

/**
 * Hook to get language name for display
 * Usage: const getLanguageName = useLanguageName();
 *        <div>{getLanguageName('hi')}</div> -> हिंदी
 */
export function useLanguageName() {
  return useCallback((langCode) => {
    const names = {
      en: "English",
      hi: "हिंदी",
      es: "Español",
      fr: "Français",
      de: "Deutsch",
      zh: "中文",
      ja: "日本語",
    };
    return names[langCode] || langCode;
  }, []);
}

/**
 * Hook for nested translation keys
 * Usage: const getBankingText = useNestedTranslate('banking');
 *        <span>{getBankingText('accounts')}</span> -> Accounts
 */
export function useNestedTranslate(namespace) {
  const { t } = useTranslation("common");

  return useCallback(
    (key) => {
      return t(`${namespace}.${key}`);
    },
    [t, namespace]
  );
}

export default {
  useTranslate,
  useLanguage,
  useCurrency,
  usePercentage,
  useNumberFormat,
  useDateFormat,
  usePlural,
  useAllTranslations,
  useTextDirection,
  useLanguageName,
  useNestedTranslate,
};
