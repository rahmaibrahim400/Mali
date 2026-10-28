import i18n from "../../../i18n/i18n";

// التصنيفات الإلزامية التي لا يمكن حذفها أبداً
// (names are stored in Arabic by the backend; they're the identifiers, never translate the stored value)
const DEFAULT_CATEGORY_KEYS = {
  "أكل": "food",
  "مواصلات": "transport",
  "إيجار": "rent",
  "فواتير": "bills",
  "صحة": "health",
  "تعليم": "education",
  "تسلية": "entertainment",
  "غيره": "other",
};

export const MANDATORY_CATEGORIES = Object.keys(DEFAULT_CATEGORY_KEYS);

// Display name for a category in the active UI language (default categories are translated,
// user-created ones are shown exactly as the user typed them).
export function categoryLabel(name) {
  const key = DEFAULT_CATEGORY_KEYS[name];
  return key ? i18n.t(`defaultCategories.${key}`) : name;
}
