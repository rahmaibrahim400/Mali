import { useTranslation } from "react-i18next";

const PERIODS = [
  { key: "1y", months: 12 },
  { key: "6m", months: 6 },
  { key: "3m", months: 3 },
  { key: "1m", months: 1 },
];

function ReportPeriodSelector({ months, onChange }) {
  const { t } = useTranslation();
  return (
    // Segmented control: the chosen period is a raised white pill on a soft track.
    <div role="group" className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">
      {PERIODS.map(({ key, months: value }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={months === value}
          className={`min-h-9 rounded-lg px-3.5 text-xs font-semibold transition ${
            months === value
              ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/70"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {t(`reports.period.${key}`)}
        </button>
      ))}
    </div>
  );
}

export default ReportPeriodSelector;
