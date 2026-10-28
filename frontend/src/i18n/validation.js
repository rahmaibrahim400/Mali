import i18n from "./i18n";
import { formatNumber } from "../utils/formatAmount";

// The browser writes native validation bubbles ("Please fill out this field") in the
// browser's own language. This swaps them for messages in the app's active language.
// Fields marked `data-self-validate` (e.g. NumberInput) manage their own custom messages.

function isField(el) {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
}

function messageFor(el) {
  const v = el.validity;
  const t = i18n.t.bind(i18n);
  if (v.valueMissing) {
    return el.dataset.selectProxy !== undefined || el instanceof HTMLSelectElement
      ? t("validation.selectRequired")
      : t("validation.required");
  }
  if (v.typeMismatch) return el.type === "email" ? t("validation.email") : t("validation.invalid");
  if (v.badInput) return t("validation.number");
  if (v.rangeUnderflow) return t("validation.min", { min: formatNumber(el.min) });
  if (v.rangeOverflow) return t("validation.max", { max: formatNumber(el.max) });
  if (v.stepMismatch) return t("validation.step");
  if (v.tooShort) return t("validation.minLength", { count: el.minLength });
  if (v.tooLong) return t("validation.maxLength", { count: el.maxLength });
  if (v.patternMismatch) return el.title || t("validation.pattern");
  return "";
}

function clearCustomValidity(el) {
  if (isField(el) && !("selfValidate" in el.dataset)) el.setCustomValidity("");
}

export function installLocalizedValidation() {
  document.addEventListener(
    "invalid",
    (event) => {
      const el = event.target;
      if (!isField(el)) return;
      if ("selfValidate" in el.dataset && el.validity.customError) return;
      if (!("selfValidate" in el.dataset)) el.setCustomValidity("");
      el.setCustomValidity(messageFor(el));
    },
    true
  );

  document.addEventListener("input", (event) => clearCustomValidity(event.target), true);
  document.addEventListener("change", (event) => clearCustomValidity(event.target), true);

  // Re-check every field from scratch right before a form is submitted, so a message set on
  // an earlier attempt can't block a value that has since become valid programmatically.
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target instanceof Element ? event.target.closest("button, input[type=submit]") : null;
      if (!button || button.type !== "submit" || !button.form) return;
      Array.from(button.form.elements).forEach(clearCustomValidity);
    },
    true
  );
}
