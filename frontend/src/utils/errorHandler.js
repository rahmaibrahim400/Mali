import i18n from "../i18n/i18n";
import { formatNumber, currencyLabel } from "./formatAmount";

// The backend replies with fixed messages in either English or Arabic. Known messages are
// mapped to translation keys so the user always sees them in the active UI language.
const SERVER_MESSAGES = {
  "Goal not found": "goalNotFound",
  "Debt not found": "debtNotFound",
  "Account not found": "accountNotFound",
  "Account not found.": "accountNotFound",
  "User not found": "userNotFound",
  "المستخدم غير موجود": "userNotFound",
  "Transaction not found": "transactionNotFound",
  "Income not found": "incomeNotFound",
  "Expense not found": "expenseNotFound",
  "Category not found": "categoryNotFound",
  "Source account not found.": "sourceAccountNotFound",
  "Destination account not found.": "destinationAccountNotFound",
  "Amount must be positive.": "amountPositive",
  "Amount must be greater than zero.": "amountPositive",
  Unauthorized: "unauthorized",
  "Invalid token": "unauthorized",
  Forbidden: "forbidden",
  "Only 1 account is allowed in trial mode.": "trialOneAccount",
  "Invalid category: not found in your categories list": "invalidCategory",
  "Category is required": "categoryRequired",
  "An account with this name already exists.": "accountNameExists",
  "A goal with this name already exists.": "goalNameExists",
  "Insufficient account balance.": "insufficientBalance",
  "receivedDate must be a valid date.": "receivedDateInvalid",
  "newBalance is required.": "newBalanceRequired",
  "fromId and toId are required.": "transferAccountsRequired",
  "Type is required and must be daily, fixed, or emergency": "typeRequired",
  "Type is invalid": "typeInvalid",
  "Too many requests, please try again later.": "tooManyRequests",
  "Target amount cannot be less than the amount already saved.": "targetBelowSaved",
  "Select an account to receive the remaining balance before deleting.": "selectAccountBeforeDelete",
  "Select an account to receive the balance before archiving.": "selectAccountBeforeArchive",
  "Only active goals can be archived.": "onlyActiveGoalsArchive",
  "No balance in this goal.": "noGoalBalance",
  "Name, category, amount, currency, and receivedDate are required.": "incomeFieldsRequired",
  "Name is required": "nameRequired",
  "الاسم مطلوب": "nameRequired",
  "Name cannot be empty": "nameEmpty",
  "Name and target amount are required.": "goalFieldsRequired",
  "Invalid or expired reset link.": "resetLinkInvalid",
  "Invalid locale": "invalidLocale",
  "Invalid income category.": "invalidIncomeCategory",
  "Invalid email or password": "invalidCredentials",
  "Goal is not active.": "goalNotActive",
  "Goal is already completed.": "goalCompleted",
  "Email already in use": "emailInUse",
  "Debt is already fully paid.": "debtFullyPaid",
  "Creditor and totalAmount are required.": "debtFieldsRequired",
  "Cannot withdraw more than the current balance.": "withdrawOverBalance",
  "Cannot rename a default category": "cannotRenameDefault",
  "Cannot edit a completed or archived goal.": "cannotEditGoal",
  "Cannot change the type of a default category": "cannotChangeDefaultType",
  "Account name is required.": "accountNameRequired",
  "لم يتم إرسال صورة": "noImage",
  "كلمة السر لازم تكون 8 حروف على الأقل": ["passwordMinLength", { min: 8 }],
  "كلمة السر لازم تحتوي على رقم": "passwordDigit",
  "كلمة السر لازم تحتوي على حرف كبير": "passwordUppercase",
  "كلمة السر الحالية غير صحيحة": "currentPasswordWrong",
  "كلمة السر الجديدة مش متطابقة": "passwordMismatch",
  "كل الحقول مطلوبة": "allFieldsRequired",
  "صيغة الصورة غير مدعومة (JPG / PNG / WEBP فقط)": "imageFormat",
  "ده نفس إيميلك الحالي": "sameEmail",
  "حجم الصورة كبير، الحد الأقصى 5MB": ["imageTooLarge", { max: 5 }],
  "الكود منتهي أو غير صالح، أعد الإرسال": "codeExpired",
  "الكود غلط": "codeWrong",
  "التصنيفات الافتراضية إلزامية ولا يمكن حذفها نهائياً": "defaultCategoryDelete",
  "الإيميل مطلوب": "emailRequired",
  "الإيميل ده مستخدم بالفعل": "emailTaken",
};

const SERVER_PATTERNS = [
  [/^Trial limit reached: maximum (\d+) entries allowed\.$/, (m) => ["trialLimit", { max: Number(m[1]) }]],
  [/^Account "(.+)" is archived \(frozen\)/, (m) => ["accountArchived", { name: m[1] }]],
  [
    /^الرصيد غير كافٍ — الرصيد الحالي في "(.+)" هو ([\d.-]+) (\w+)\.$/,
    (m) => ["insufficientBalanceIn", { name: m[1], balance: formatNumber(m[2]), currency: currencyLabel(m[3]) }],
  ],
];

const ARABIC_RE = /[؀-ۿ]/;

export function translateServerMessage(message, fallback) {
  if (!message || typeof message !== "string") return fallback;
  const known = SERVER_MESSAGES[message.trim()];
  if (known) {
    const [key, params] = Array.isArray(known) ? known : [known];
    return i18n.t(`errors.server.${key}`, params);
  }
  for (const [pattern, toKey] of SERVER_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      const [key, params] = toKey(match);
      return i18n.t(`errors.server.${key}`, params);
    }
  }
  // Unknown message: only show it if it's already in the UI language.
  const isArabicUi = i18n.language === "ar";
  return ARABIC_RE.test(message) === isArabicUi ? message : fallback;
}

// `fallback` is either a translation key ("errors.debts.load") or already-translated text.
export function extractError(err, fallback = "errors.generic") {
  const fallbackText = i18n.exists(fallback) ? i18n.t(fallback) : fallback;
  const data = err?.response?.data;
  if (data?.code === "SUBSCRIPTION_EXPIRED") return i18n.t("errors.subscriptionExpired");
  if (data?.message) return translateServerMessage(data.message, fallbackText);
  if (typeof err === "string") return translateServerMessage(err, fallbackText);
  return fallbackText;
}
