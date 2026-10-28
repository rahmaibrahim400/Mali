import { currencyName, formatNumber } from "../../../utils/formatAmount";
import IncomeItem, { INCOME_COLUMNS } from "./IncomeItem";
import { ListSkeleton } from "../../../components/common/Skeleton";
import Money from "../../../components/common/Money";

function IncomeList({
  items,
  status,
  error,
  displayCurrency,
  totalAmount,
  totalsByCurrency,
  onEdit,
  onDeleted,
  onToggled,
  t,
}) {
  const calculatedTotal = items.reduce((sum, income) => {
    const currency = income.currency || "EGP";
    sum[currency] = (sum[currency] || 0) + Number(income.monthlyAmount ?? income.amount ?? 0);
    return sum;
  }, {});
  const totals =
    displayCurrency === "ALL"
      ? Object.entries(totalsByCurrency || calculatedTotal)
      : [[displayCurrency, totalAmount ?? Object.values(calculatedTotal).reduce((sum, total) => sum + total, 0)]];
  if (totals.length === 0) totals.push(["EGP", 0]);
  const totalsTitle = t(displayCurrency === "ALL" ? "income.totalByCurrencyLabel" : "income.totalConvertedLabel");

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-slate-900">{t("income.listTitle")}</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {formatNumber(items.length)}
        </span>
      </div>

      {status === "loading" && <ListSkeleton rows={4} className="mt-2" label={t("income.loading")} />}
      {error && (
        <p className="mt-4 rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense">
          {error}
        </p>
      )}
      {status === "succeeded" && items.length === 0 && (
        <p className="mt-4 text-slate-500">{t("income.empty")}</p>
      )}

      {items.length > 0 && (
        // Column headings once, above the rows (md and up; phones show each row as a small card).
        <div
          aria-hidden="true"
          className={`mt-5 hidden rounded-lg bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-slate-500 ${INCOME_COLUMNS}`}
        >
          <span>{t("income.fields.name")}</span>
          <span>{t("income.fields.category")}</span>
          <span>{t(displayCurrency === "ALL" ? "income.fields.amount" : "income.fields.amountConverted")}</span>
          <span>{t("income.fields.date")}</span>
          <span className="w-28" />
        </div>
      )}

      {/* Phones: separate small cards. From md: one table with hairline rows. */}
      <div className="mt-4 flex flex-col gap-3 md:mt-1 md:gap-0 md:divide-y md:divide-slate-100">
        {items.map((income) => (
          <IncomeItem
            key={income._id}
            income={income}
            displayAmount={income.monthlyAmount ?? income.convertedAmount ?? income.amount}
            displayCurrency={displayCurrency === "ALL" ? income.currency || "EGP" : displayCurrency}
            onEdit={onEdit}
            onDeleted={onDeleted}
            onToggled={onToggled}
          />
        ))}
      </div>

      {/* Totals: one strip with a cell per currency — stacked rows on phones, side by side from sm.
          Dividers use logical borders (border-s), so they sit right in both directions. */}
      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-slate-700">{totalsTitle}</h3>
        <dl className="mt-3 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40 sm:flex-row">
          {totals.map(([currency, total]) => (
            <div
              key={currency}
              className="flex min-w-0 flex-1 items-center justify-between gap-3 border-t border-slate-200 px-4 py-3.5 first:border-t-0 sm:block sm:border-t-0 sm:border-s sm:px-5 sm:py-4 sm:first:border-s-0"
            >
              <dt className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
                <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600 ring-1 ring-slate-200">
                  {currency}
                </span>
                {/* The code is in the badge, so drop the "(EGP)" tail from the name. */}
                <span className="truncate">{currencyName(currency).replace(/\s*\([^)]*\)\s*$/, "")}</span>
              </dt>
              <dd className="tabular-amount shrink-0 text-lg font-bold text-income sm:mt-2 sm:text-xl">
                <Money value={total} currency={currency} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export default IncomeList;
