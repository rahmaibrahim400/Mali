import { formatDate } from "../../utils/formatAmount";

// The reports API sends English labels ("Jan 26", "Sun", "Sep 2026"). These helpers turn them
// back into dates and re-render them in the UI language; unknown formats are returned as-is.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Jan 26" (month + 2-digit year) → "يناير ٢٦" / "Jan 26"
export function monthLabel(label) {
  const match = /^([A-Za-z]{3})\s+(\d{2})$/.exec(label || "");
  const monthIndex = match ? MONTHS.indexOf(match[1]) : -1;
  if (monthIndex < 0) return label;
  return formatDate(new Date(2000 + Number(match[2]), monthIndex, 1), { month: "short", year: "2-digit" });
}

// "Sep 2026" (month + 4-digit year) → "سبتمبر ٢٠٢٦" / "Sep 2026"
export function monthYearLabel(label) {
  const match = /^([A-Za-z]{3,4})\s+(\d{4})$/.exec(label || "");
  const monthIndex = match ? MONTHS.indexOf(match[1].slice(0, 3)) : -1;
  if (monthIndex < 0) return label;
  return formatDate(new Date(Number(match[2]), monthIndex, 1), { month: "long", year: "numeric" });
}

// "Sun" → "الأحد" / "Sun"
export function weekdayLabel(label) {
  const dayIndex = WEEKDAYS.indexOf(label);
  if (dayIndex < 0) return label;
  // 2024-01-07 was a Sunday.
  return formatDate(new Date(2024, 0, 7 + dayIndex), { weekday: "short" });
}
