# Internationalization (i18n) Implementation Guide - ArthOS

**Status**: ✅ COMPLETE  
**Date**: June 16, 2025  
**Package**: i18next + react-i18next  

---

## 📋 Quick Start

### 1. Using Translations in Components

```jsx
import { useTranslate } from "../hooks/useI18n";

export function MyComponent() {
  const t = useTranslate();
  
  return (
    <div>
      <h1>{t("navigation.dashboard")}</h1>
      <button>{t("common.submit")}</button>
    </div>
  );
}
```

### 2. Using Currency Formatting

```jsx
import { useCurrency } from "../hooks/useI18n";

export function BalanceDisplay({ amount }) {
  const formatCurrency = useCurrency();
  
  return <div>Balance: {formatCurrency(amount)}</div>;
}
```

### 3. Switching Languages

```jsx
import { useLanguage } from "../hooks/useI18n";

export function LanguageSwitcher() {
  const { changeLanguage, currentLanguage, allLanguages } = useLanguage();
  
  return (
    <select value={currentLanguage} onChange={(e) => changeLanguage(e.target.value)}>
      {allLanguages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
    </select>
  );
}
```

---

## 📁 Project Structure

```
src/
├── i18n.js                                 # Main i18n configuration
├── locales/
│   ├── en/
│   │   └── common.json                    # English translations
│   └── hi/
│       └── common.json                    # Hindi translations
├── hooks/
│   └── useI18n.js                         # All i18n custom hooks
├── components/
│   ├── LanguageSwitcher.jsx              # Language switcher component
│   └── I18nExamples.jsx                  # Usage examples
└── scripts/
    └── extract-strings.js                # String extraction tool
```

---

## 🪝 Available Hooks

### `useTranslate()`
Get translations for the current language.

```jsx
const t = useTranslate();
t('common.loading')        // Returns: "Loading..."
t('banking.accounts')      // Returns: "Accounts"
```

### `useLanguage()`
Manage language switching and get language info.

```jsx
const { changeLanguage, currentLanguage, allLanguages } = useLanguage();

changeLanguage('hi');      // Switch to Hindi
console.log(currentLanguage);  // 'hi'
console.log(allLanguages);     // ['en', 'hi']
```

### `useCurrency()`
Format numbers as currency (₹).

```jsx
const formatCurrency = useCurrency();
formatCurrency(50000);     // Returns: "₹50,000"
```

### `usePercentage()`
Format numbers as percentages.

```jsx
const formatPercent = usePercentage();
formatPercent(85.5);       // Returns: "85.5%"
```

### `useNumberFormat()`
Format numbers with custom decimal places.

```jsx
const formatNumber = useNumberFormat();
formatNumber(1234.567, 2); // Returns: "1,234.57"
```

### `useDateFormat()`
Format dates based on language.

```jsx
const formatDate = useDateFormat();
formatDate(new Date());    // Returns: "June 16, 2025" (English)
                           // Returns: "16 जून 2025" (Hindi)
```

### `useNestedTranslate(namespace)`
Get translations from a specific namespace.

```jsx
const getBankingText = useNestedTranslate('banking');
getBankingText('accounts');    // Same as t('banking.accounts')
```

### `useTextDirection()`
Get text direction for current language (useful for RTL languages).

```jsx
const getDir = useTextDirection();
<div dir={getDir()}>Content</div>
```

### `useLanguageName()`
Get display name for a language.

```jsx
const getLanguageName = useLanguageName();
getLanguageName('hi');     // Returns: "हिंदी"
getLanguageName('en');     // Returns: "English"
```

---

## 📝 Adding New Translations

### 1. Add Keys to English (`src/locales/en/common.json`)

```json
{
  "mySection": {
    "myKey": "My English Text"
  }
}
```

### 2. Add Translation to Other Languages (`src/locales/hi/common.json`)

```json
{
  "mySection": {
    "myKey": "मेरा हिंदी पाठ"
  }
}
```

### 3. Use in Component

```jsx
const t = useTranslate();
<div>{t('mySection.myKey')}</div>
```

---

## 🔍 String Extraction

Automatically identify hardcoded strings that should be translated.

```bash
node scripts/extract-strings.js
```

This generates `.extracted-strings.json` with all found strings and their locations.

---

## 🌐 Supported Languages

| Code | Name | Status |
|------|------|--------|
| `en` | English | ✅ Complete |
| `hi` | हिंदी | ✅ Complete |
| `es` | Español | Ready to add |
| `fr` | Français | Ready to add |

---

## 📱 Components

### LanguageSwitcher (Dropdown)

```jsx
import { LanguageSwitcher } from "./components/LanguageSwitcher";

<LanguageSwitcher />
```

### LanguageSwitcher (Buttons)

```jsx
<LanguageSwitcher variant="buttons" />
```

### LanguageSwitcherCompact (Header)

```jsx
import { LanguageSwitcherCompact } from "./components/LanguageSwitcher";

<LanguageSwitcherCompact />
```

---

## 💾 Language Persistence

Language preference is automatically saved to `localStorage` under the key `i18nLanguage`. It persists across browser sessions.

```javascript
// Manually get saved language
const savedLanguage = localStorage.getItem('i18nLanguage');

// Manually save language
localStorage.setItem('i18nLanguage', 'hi');
```

---

## 🔄 Migration Guide: Converting Hard-Coded Strings

### Before (Hard-coded)

```jsx
export function AccountDisplay({ account }) {
  return (
    <div>
      <h2>Banking Dashboard</h2>
      <p>Account Type: {account.type}</p>
      <button>Link Account</button>
    </div>
  );
}
```

### After (Internationalized)

```jsx
import { useTranslate, useNestedTranslate } from "../hooks/useI18n";

export function AccountDisplay({ account }) {
  const t = useTranslate();
  const getBankingText = useNestedTranslate('banking');
  
  return (
    <div>
      <h2>{getBankingText('bankingDashboard')}</h2>
      <p>{t('banking.accountType')}: {account.type}</p>
      <button>{getBankingText('linkAccount')}</button>
    </div>
  );
}
```

---

## 🧪 Testing i18n

### Example Test

```jsx
import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import MyComponent from "../components/MyComponent";

test("renders translated text", () => {
  render(
    <I18nextProvider i18n={i18n}>
      <MyComponent />
    </I18nextProvider>
  );
  
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});
```

---

## 📊 Translation Coverage

Current Translation Keys: **150+**

| Section | Keys | Status |
|---------|------|--------|
| common | 18 | ✅ |
| navigation | 10 | ✅ |
| auth | 13 | ✅ |
| banking | 17 | ✅ |
| cognition | 13 | ✅ |
| prediction | 16 | ✅ |
| longitudinal | 14 | ✅ |
| bigReveal | 10 | ✅ |
| dashboard | 10 | ✅ |
| errors | 9 | ✅ |
| messages | 7 | ✅ |
| time | 12 | ✅ |
| format | 3 | ✅ |

---

## 🔐 Best Practices

### 1. Use Translation Keys Consistently

```jsx
// ✅ Good
t('banking.balance')

// ❌ Avoid
t('Balance')  // Not a translation key
```

### 2. Keep Translation Keys Organized

Use nested structures for related translations:

```json
{
  "banking": {
    "accounts": "...",
    "transactions": "...",
    "balance": "..."
  }
}
```

### 3. Use Hooks for Complex Formatting

```jsx
// ✅ Good
const formatCurrency = useCurrency();
<span>{formatCurrency(amount)}</span>

// ❌ Avoid
<span>{t('format.currency', { value: amount })}</span>
```

### 4. Handle Missing Translations

i18n automatically shows the key if a translation is missing:

```jsx
t('unknown.key')  // Shows: "unknown.key" (in red in dev)
```

---

## 🛠️ Configuration

The i18n configuration is in `src/i18n.js`:

```javascript
i18n.init({
  resources,              // Translation files
  lng: 'en',             // Default language
  fallbackLng: 'en',     // Fallback language
  defaultNS: 'common',   // Default namespace
  interpolation: {
    escapeValue: false   // React escapes XSS by default
  }
});
```

---

## 📚 Example Components

See `src/components/I18nExamples.jsx` for complete examples:

1. `BasicTranslationExample` - Simple translations
2. `CurrencyFormattingExample` - Currency formatting
3. `PercentageFormattingExample` - Percentage formatting
4. `NestedTranslationExample` - Nested translations
5. `DateFormattingExample` - Date formatting
6. `LanguageSwitcherIntegration` - Language switching
7. `ErrorMessageExample` - Error handling
8. `DynamicContentExample` - Dynamic content

---

## 🚀 Future Enhancements

- [ ] Add Spanish (es) and French (fr) translations
- [ ] Implement pluralization rules
- [ ] Add RTL (Arabic, Hebrew) language support
- [ ] Create translation management dashboard
- [ ] Implement server-side language detection
- [ ] Add language-specific number formatting
- [ ] Create translation completion tracker

---

## 📞 Support

For issues or questions about i18n:

1. Check existing translations in `src/locales/`
2. Review hooks in `src/hooks/useI18n.js`
3. See examples in `src/components/I18nExamples.jsx`
4. Refer to [react-i18next docs](https://react.i18next.com/)

---

## 🎯 Summary

✅ **Installed**: i18next + react-i18next  
✅ **Configured**: i18n initialization in `src/i18n.js`  
✅ **Translations**: English + Hindi (150+ keys)  
✅ **Hooks**: 11 custom hooks for all common use cases  
✅ **Components**: LanguageSwitcher, I18nExamples  
✅ **Tools**: String extraction script  
✅ **Integration**: App provider setup complete  

**Status**: Ready for production use! 🚀
