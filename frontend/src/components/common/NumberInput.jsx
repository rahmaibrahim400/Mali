import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { formatNumber, normalizeDigits } from "../../utils/formatAmount";

function toArabicDigits(str) {
  return str.replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d))).replace(/\./g, "٫");
}

function decimalsFromStep(step) {
  if (step === undefined || step === null || step === "any") return null;
  const [, fraction = ""] = String(step).split(".");
  return fraction.length;
}

// Text-based numeric field: shows the value in the UI language's digits (and accepts both Arabic
// and Western digits while typing) but always reports Western digits ("1234.5") to `onChange`,
// so form state and API payloads stay plain numbers. min/max/step are validated with localized
// messages instead of the browser's native (browser-language) ones.
function NumberInput({ value, onChange, name, min, max, step, placeholder, ...rest }) {
  const { t, i18n } = useTranslation();
  const inputRef = useRef(null);
  const isArabic = i18n.language === "ar";
  const maxDecimals = decimalsFromStep(step);
  const allowNegative = min === undefined || min === null || Number(min) < 0;

  const raw = value === null || value === undefined ? "" : String(value);
  const displayValue = isArabic ? toArabicDigits(raw) : raw;
  const displayPlaceholder = placeholder && isArabic ? toArabicDigits(placeholder) : placeholder;

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    let message = "";
    if (raw !== "" && raw !== "-" && raw !== ".") {
      const number = Number(raw);
      if (!Number.isFinite(number)) message = t("validation.number");
      else if (min !== undefined && min !== null && min !== "" && number < Number(min)) {
        message = t("validation.min", { min: formatNumber(min) });
      } else if (max !== undefined && max !== null && max !== "" && number > Number(max)) {
        message = t("validation.max", { max: formatNumber(max) });
      }
    } else if (raw === "-" || raw === ".") {
      message = t("validation.number");
    }
    input.setCustomValidity(message);
  }, [raw, min, max, t]);

  function handleChange(event) {
    const next = normalizeDigits(event.target.value).replace(/,/g, "");
    const pattern = new RegExp(
      `^${allowNegative ? "-?" : ""}\\d*${maxDecimals === 0 ? "" : `(\\.\\d${maxDecimals ? `{0,${maxDecimals}}` : "*"})?`}$`
    );
    if (!pattern.test(next)) return;
    onChange?.({ target: { name, value: next }, currentTarget: { name, value: next } });
  }

  return (
    <input
      {...rest}
      ref={inputRef}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      name={name}
      value={displayValue}
      onChange={handleChange}
      placeholder={displayPlaceholder}
      data-self-validate=""
    />
  );
}

export default NumberInput;
