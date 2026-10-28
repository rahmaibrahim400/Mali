import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { toIntlLocale } from "../../i18n/locale";

function toDateOnly(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function DatePicker({ value, onChange, min, max, placeholder, className, id, required }) {
  const { t, i18n } = useTranslation();
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => toDateOnly(value), [value]);
  const minDate = useMemo(() => toDateOnly(min), [min]);
  const maxDate = useMemo(() => toDateOnly(max), [max]);

  const [viewDate, setViewDate] = useState(selectedDate || new Date());

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) setViewDate(selectedDate || new Date());
      return next;
    });
  }

  useEffect(() => {
    if (!open) return undefined;
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    }
    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const locale = toIntlLocale(i18n.language);
  const monthLabel = viewDate.toLocaleDateString(locale, { month: "long", year: "numeric" });
  const dayFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const weekdayFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "narrow" }), [locale]);
  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 7); // a Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return weekdayFormatter.format(d);
    });
  }, [weekdayFormatter]);

  const gridDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [viewDate]);

  function isDisabled(date) {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }

  function selectDate(date) {
    if (isDisabled(date)) return;
    onChange(toISODate(date));
    setOpen(false);
  }

  function changeMonth(delta) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={toggleOpen}
        className={`min-h-11 ${
          className ||
          "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        }`}
      >
        <span className="flex w-full items-center justify-between gap-2">
          <span className={displayValue ? "text-slate-700" : "text-slate-400"}>
            {displayValue || placeholder || t("common.datePicker.placeholder")}
          </span>
          <Calendar size={16} className="shrink-0 text-slate-400" />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute z-40 mt-2 w-72 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl inset-s-0"
        >
          <div className="flex items-center justify-between px-1 pb-2">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              aria-label={t("common.datePicker.prevMonth")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
            >
              <ChevronLeft size={16} className="rtl:rotate-180" />
            </button>
            <span className="text-sm font-bold capitalize text-slate-900">{monthLabel}</span>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              aria-label={t("common.datePicker.nextMonth")}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
            >
              <ChevronRight size={16} className="rtl:rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 px-1 text-center text-xs font-semibold text-slate-400">
            {weekdayLabels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1 px-1">
            {gridDays.map((date, i) => {
              const inMonth = date.getMonth() === viewDate.getMonth();
              const selected = isSameDay(date, selectedDate);
              const today = isSameDay(date, new Date());
              const disabled = isDisabled(date);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDate(date)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium tabular-nums transition ${
                    selected
                      ? "bg-brand-600 font-bold text-white"
                      : today
                        ? "font-bold text-brand-600 hover:bg-brand-50"
                        : inMonth
                          ? "text-slate-700 hover:bg-slate-100"
                          : "text-slate-300 hover:bg-slate-100"
                  } ${disabled ? "cursor-not-allowed opacity-30 hover:bg-transparent" : ""}`}
                >
                  {dayFormatter.format(date.getDate())}
                </button>
              );
            })}
          </div>

          <div className={`mt-2 flex items-center border-t border-slate-100 px-1 pt-2 ${required ? "justify-end" : "justify-between"}`}>
            {!required && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-slate-400 transition hover:text-slate-600"
              >
                <X size={13} />
                {t("common.datePicker.clear")}
              </button>
            )}
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              {t("common.datePicker.today")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
