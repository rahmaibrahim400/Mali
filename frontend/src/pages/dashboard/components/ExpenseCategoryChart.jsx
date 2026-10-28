import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart as PieChartIcon } from "lucide-react";
import { formatAmount, formatMoney, formatNumber, formatPercent, currencyLabel } from "../../../utils/formatAmount";
import { categoryLabel } from "../../categories/components/mandatoryCategories";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import ChartTooltip from "../../../components/charts/ChartTooltip";
import { useChartLayout } from "../../../components/charts/chartTheme";
import { useScrollRevealed } from "../../../components/common/scrollRevealContext";

const FALLBACK_PALETTE = [
  "#ff9b51",
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#ec4899",
  "#0ea5e9",
  "#f59e0b",
  "#14b8a6",
  "#ef4444",
  "#84cc16",
];
const NEUTRAL_GRAY = "#6b7280";

const SIZE = 200;
const OUTER_R = 90;
const INNER_R = 58;

function ExpenseCategoryChart({ categories, loading, currency = "EGP", t }) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);
  const { animate, donutTooltipProps } = useChartLayout();
  const revealed = useScrollRevealed();

  const coloredCategories = categories.reduce((acc, cat, index) => {
    const used = new Set(acc.map((item) => item.color));
    const own = cat.color && cat.color !== NEUTRAL_GRAY && !used.has(cat.color) ? cat.color : null;
    const fallback = FALLBACK_PALETTE.find((color) => !used.has(color)) || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
    acc.push({ ...cat, color: own || fallback });
    return acc;
  }, []);

  const total = coloredCategories.reduce((sum, cat) => sum + Number(cat.total || 0), 0);
  const topThree = [...coloredCategories].sort((a, b) => b.total - a.total).slice(0, 3);

  const goToCategory = (name) => {
    navigate(`/expenses?category=${encodeURIComponent(name)}`);
  };

  // label / fill ride on each slice for the tooltip (its name and color key).
  const slices = coloredCategories.map((cat) => ({
    ...cat,
    total: Number(cat.total || 0),
    label: categoryLabel(cat.name),
    fill: cat.color,
    fraction: total > 0 ? Number(cat.total || 0) / total : 0,
  }));

  return (
    <section className="@container h-full rounded-2xl bg-white p-5 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80 sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
        <PieChartIcon size={18} className="text-brand-600" />
        {t("dashboard.chart.title")}
      </h2>

      {loading ? (
        <div role="status" aria-live="polite" className="mt-5 flex flex-col items-center gap-6 @2xl:flex-row @2xl:items-start">
          <span className="sr-only">{t("common.loading")}</span>
          <span aria-hidden="true" className="skeleton block h-[200px] w-[200px] shrink-0 rounded-full" />
          <div aria-hidden="true" className="w-full flex-1 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="skeleton block h-8 rounded-lg" />
            ))}
          </div>
        </div>
      ) : categories.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{t("dashboard.chart.empty")}</p>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-6 @2xl:flex-row @2xl:items-start">
          <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
            <PieChart width={SIZE} height={SIZE} accessibilityLayer>
              {/* Re-mounted when the section scrolls into view, so the slices sweep in then. */}
              <Pie
                key={revealed ? "shown" : "waiting"}
                data={slices}
                dataKey="total"
                nameKey="label"
                innerRadius={INNER_R}
                outerRadius={OUTER_R}
                startAngle={90}
                endAngle={-270}
                paddingAngle={slices.length > 1 ? 1.5 : 0}
                stroke="none"
                isAnimationActive={animate && revealed}
                animationDuration={1100}
                onMouseEnter={(_, index) => setHoveredId(slices[index]?.categoryId ?? null)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={(_, index) => slices[index] && goToCategory(slices[index].name)}
              >
                {slices.map((slice) => (
                  <Cell
                    key={slice.categoryId}
                    fill={slice.fill}
                    className="cursor-pointer outline-none transition-opacity"
                    fillOpacity={hoveredId && hoveredId !== slice.categoryId ? 0.45 : 1}
                  />
                ))}
              </Pie>
              <Tooltip
                {...donutTooltipProps}
                content={
                  <ChartTooltip
                    formatValue={(value) => formatMoney(value, currency)}
                    footer={(payload) => formatPercent((payload[0]?.payload?.fraction ?? 0) * 100)}
                  />
                }
              />
            </PieChart>

            {/* The total sits in the donut's center; the hovered category shows in the tooltip. */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-medium text-slate-500">{t("expenses.totalLabel")}</span>
              <strong className="tabular-amount text-lg font-extrabold text-slate-900">
                {formatAmount(total)}
              </strong>
              <span className="text-xs text-slate-400">{currencyLabel(currency)}</span>
            </div>
          </div>

          <div className="w-full flex-1">
            {/* أعلى 3 تصنيفات */}
            <div data-reveal-stagger className="grid grid-cols-1 gap-2 @md:grid-cols-3">
              {topThree.map((cat, index) => (
                <button
                  key={cat.categoryId}
                  type="button"
                  onClick={() => goToCategory(cat.name)}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2 text-start transition hover:border-brand-200 hover:bg-brand-50"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {formatNumber(index + 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-slate-700">{categoryLabel(cat.name)}</span>
                    <span className="tabular-amount block text-sm font-bold text-slate-900">
                      {formatAmount(cat.total)}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {/* الليجند الكامل */}
            <div data-reveal-stagger className="mt-4 flex flex-col gap-2">
              {slices.map((slice) => (
                <button
                  key={slice.categoryId}
                  type="button"
                  onMouseEnter={() => setHoveredId(slice.categoryId)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => goToCategory(slice.name)}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-start text-sm transition hover:bg-slate-100"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="truncate font-medium text-slate-700">{categoryLabel(slice.name)}</span>
                  </span>
                  <span className="tabular-amount shrink-0 font-semibold text-slate-900">
                    {formatAmount(slice.total)} · {formatPercent(slice.fraction * 100)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ExpenseCategoryChart;
