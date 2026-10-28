import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Select from "./Select";
import { toIntlLocale } from "../../i18n/locale";

// Month + year chooser with names and digits in the UI language (the native
// <input type="month"> renders in the browser's language instead). Value: "YYYY-MM".
function MonthYearPicker({ id, value, onChange, className, yearsBack = 5, yearsForward = 1 }) {
  const { i18n } = useTranslation();
  const locale = toIntlLocale(i18n.language);
  const [year, month] = (value || "").split("-");
  const currentYear = new Date().getFullYear();

  const months = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
    return Array.from({ length: 12 }, (_, index) => ({
      value: String(index + 1).padStart(2, "0"),
      label: formatter.format(new Date(2024, index, 1)),
    }));
  }, [locale]);

  const years = useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, { useGrouping: false });
    const selectedYear = Number(year);
    const start = Math.min(currentYear - yearsBack, selectedYear || currentYear);
    const end = Math.max(currentYear + yearsForward, selectedYear || currentYear);
    return Array.from({ length: end - start + 1 }, (_, index) => {
      const y = end - index;
      return { value: String(y), label: formatter.format(y) };
    });
  }, [locale, year, currentYear, yearsBack, yearsForward]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <Select
        id={id}
        value={month || ""}
        onChange={(event) => onChange(`${year || currentYear}-${event.target.value}`)}
        className={className}
      >
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </Select>
      <Select
        value={year || ""}
        onChange={(event) => onChange(`${event.target.value}-${month || "01"}`)}
        className={className}
      >
        {years.map((y) => (
          <option key={y.value} value={y.value}>
            {y.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export default MonthYearPicker;
