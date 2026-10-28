// Full Intl locale per UI language. Arabic explicitly requests Arabic-Indic digits (٠١٢…),
// since a bare "ar" resolves to Western digits in some browsers/regions.
const INTL_LOCALES = {
  ar: "ar-EG-u-nu-arab",
  en: "en-US",
};

export function toIntlLocale(language) {
  return language?.startsWith("en") ? INTL_LOCALES.en : INTL_LOCALES.ar;
}
