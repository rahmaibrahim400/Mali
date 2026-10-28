import { useTranslation } from "react-i18next";
import { formatPercent } from "../../../utils/formatAmount";
import { categoryLabel } from "../../categories/components/mandatoryCategories";
import { ReportSkeleton } from "../../../components/common/Skeleton";
import Money from "../../../components/common/Money";

function CategoriesSection({ data, loading }) {
  const { t } = useTranslation();
  if (loading) return <ReportSkeleton label={t("reports.loading")} />;
  if (!data) return null;

  const { categories = [], totalExpenses = 0 } = data;

  if (categories.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80">
        <p className="text-sm text-slate-500">{t("reports.empty")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">{t("reports.categories.title")}</h3>
        <span className="text-sm font-semibold text-slate-900">
          <Money value={totalExpenses} />
        </span>
      </div>

      <ul className="mt-5 space-y-4">
        {categories.map((cat) => (
          <li key={cat.categoryId}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="truncate font-medium text-slate-700">{categoryLabel(cat.name)}</span>
              <span className="flex shrink-0 items-baseline gap-3">
                <span className="font-semibold text-slate-900">
                  <Money value={cat.total} />
                </span>
                {/* Fixed width so the percentages line up down the list. */}
                <span className="tabular-amount w-12 text-end text-xs text-slate-400">{formatPercent(cat.pct, 1)}</span>
              </span>
            </div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CategoriesSection;
