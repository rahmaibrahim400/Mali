import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import { toIntlLocale } from "./locale";

export const LANGUAGE_STORAGE_KEY = "appLanguage";

const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
const initialLanguage = savedLanguage === "en" ? "en" : "ar";

function applyDirection(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.title = i18n.t("common.appName");
}

// Every raw number interpolated into a translation ({{count}}, {{days}}, …) is rendered
// with the active language's digits, so Arabic strings never mix in Western numerals.
const numberFormatter = {
  type: "formatter",
  init() {},
  add() {},
  addCached() {},
  format(value, _format, lng) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return new Intl.NumberFormat(toIntlLocale(lng), { maximumFractionDigits: 2 }).format(value);
    }
    return value;
  },
};

i18n.use(numberFormatter).use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: "ar",
  interpolation: {
    escapeValue: false,
    alwaysFormat: true,
  },
});

applyDirection(initialLanguage);

i18n.on("languageChanged", (lang) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  applyDirection(lang);
});

export default i18n;
