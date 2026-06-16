/**
 * i18n Usage Examples
 * Demonstrates how to use i18n hooks in components
 */

import React from "react";
import {
  useTranslate,
  useCurrency,
  usePercentage,
  useNumberFormat,
  useDateFormat,
  useNestedTranslate,
  useLanguage,
} from "../hooks/useI18n";

/**
 * Example 1: Basic Translation
 */
export function BasicTranslationExample() {
  const t = useTranslate();

  return (
    <div className="p-4 bg-blue-50 rounded">
      <h3 className="font-bold mb-2">Basic Translation</h3>
      <p>{t("common.loading")}</p>
      <p>{t("auth.welcome")}</p>
      <button className="px-4 py-2 bg-blue-500 text-white rounded">
        {t("common.submit")}
      </button>
    </div>
  );
}

/**
 * Example 2: Currency Formatting
 */
export function CurrencyFormattingExample() {
  const t = useTranslate();
  const formatCurrency = useCurrency();

  return (
    <div className="p-4 bg-green-50 rounded">
      <h3 className="font-bold mb-2">Currency Formatting</h3>
      <div className="space-y-2">
        <p>
          {t("banking.balance")}: {formatCurrency(50000)}
        </p>
        <p>
          {t("banking.available")}: {formatCurrency(35000)}
        </p>
        <p>
          Loan Amount: {formatCurrency(100000)}
        </p>
      </div>
    </div>
  );
}

/**
 * Example 3: Percentage Formatting
 */
export function PercentageFormattingExample() {
  const t = useTranslate();
  const formatPercent = usePercentage();

  return (
    <div className="p-4 bg-yellow-50 rounded">
      <h3 className="font-bold mb-2">Percentage Formatting</h3>
      <div className="space-y-2">
        <p>
          Savings Rate: {formatPercent(15.75)}
        </p>
        <p>
          Debt Ratio: {formatPercent(32.5)}
        </p>
        <p>
          {t("prediction.bestCase")}: {formatPercent(92.3)}
        </p>
      </div>
    </div>
  );
}

/**
 * Example 4: Nested Translations (Banking)
 */
export function NestedTranslationExample() {
  const getBankingText = useNestedTranslate("banking");

  return (
    <div className="p-4 bg-purple-50 rounded">
      <h3 className="font-bold mb-2">Nested Translation (Banking)</h3>
      <div className="space-y-2">
        <p>
          <strong>{getBankingText("accounts")}:</strong> View your linked accounts
        </p>
        <p>
          <strong>{getBankingText("transactionHistory")}:</strong> Recent transactions
        </p>
        <p>
          <strong>{getBankingText("creditScore")}:</strong> Your credit information
        </p>
      </div>
    </div>
  );
}

/**
 * Example 5: Date Formatting
 */
export function DateFormattingExample() {
  const formatDate = useDateFormat();
  const formatDateTime = useDateFormat();

  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  return (
    <div className="p-4 bg-pink-50 rounded">
      <h3 className="font-bold mb-2">Date Formatting</h3>
      <div className="space-y-2">
        <p>Today: {formatDate(today)}</p>
        <p>Last Month: {formatDate(lastMonth)}</p>
        <p>
          Last Sync:{" "}
          {formatDateTime(today, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

/**
 * Example 6: Language Switcher Integration
 */
export function LanguageSwitcherIntegration() {
  const { currentLanguage, allLanguages, changeLanguage } = useLanguage();
  const t = useTranslate();

  return (
    <div className="p-4 bg-gray-50 rounded">
      <h3 className="font-bold mb-2">Language Switcher</h3>
      <p className="text-sm mb-3">Current Language: {currentLanguage}</p>
      <div className="flex gap-2">
        {allLanguages.map((lang) => (
          <button
            key={lang}
            onClick={() => changeLanguage(lang)}
            className={`px-3 py-1 rounded text-sm transition ${
              currentLanguage === lang
                ? "bg-blue-500 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {lang.toUpperCase()}
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-600 mt-3">
        {t("common.loading")}
      </p>
    </div>
  );
}

/**
 * Example 7: Error Messages with i18n
 */
export function ErrorMessageExample() {
  const t = useTranslate();

  return (
    <div className="p-4 bg-red-50 rounded border border-red-200">
      <h3 className="font-bold mb-2 text-red-700">{t("errors.somethingWentWrong")}</h3>
      <p className="text-sm text-red-600 mb-3">
        {t("errors.tryAgainLater")}
      </p>
      <div className="flex gap-2">
        <button className="px-3 py-1 bg-red-500 text-white rounded text-sm">
          {t("messages.pleaseTryAgain")}
        </button>
        <button className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm">
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

/**
 * Example 8: Dynamic Content with Formatting
 */
export function DynamicContentExample() {
  const t = useTranslate();
  const formatCurrency = useCurrency();
  const formatPercent = usePercentage();
  const formatDate = useDateFormat();

  const mockData = {
    balance: 125000,
    monthlySpent: 35000,
    savingsRate: 28.5,
    lastUpdated: new Date(),
  };

  return (
    <div className="p-4 bg-indigo-50 rounded">
      <h3 className="font-bold mb-3">Monthly Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>{t("banking.balance")}:</span>
          <strong>{formatCurrency(mockData.balance)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Monthly Spent:</span>
          <strong>{formatCurrency(mockData.monthlySpent)}</strong>
        </div>
        <div className="flex justify-between">
          <span>Savings Rate:</span>
          <strong>{formatPercent(mockData.savingsRate)}</strong>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>{t("banking.lastSync")}:</span>
          <span>{formatDate(mockData.lastUpdated)}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Combined Example Component
 */
export function I18nExamplesShowcase() {
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">i18n Usage Examples</h2>

      <BasicTranslationExample />
      <CurrencyFormattingExample />
      <PercentageFormattingExample />
      <NestedTranslationExample />
      <DateFormattingExample />
      <LanguageSwitcherIntegration />
      <ErrorMessageExample />
      <DynamicContentExample />
    </div>
  );
}

export default I18nExamplesShowcase;
