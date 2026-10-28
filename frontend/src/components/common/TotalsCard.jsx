import { formatAmount, currencyLabel, currencyName } from "../../utils/formatAmount";

/*
  The dark "total" card shared by Income, Expenses, Cash, Accounts and Savings.
  totals: [[currency, amount], ...]. One currency shows as a single large amount; several show
  as one tile per currency (amounts in different currencies are never added up).
  Colors come from the --color-hero-* tokens, so each theme gives it its own look. Mali keeps the
  shadow soft; emerald keeps its deeper one.
*/
function TotalsCard({ title, totals = [], action, emptyText, className = "mt-6", children }) {
  return (
    <section className={`rounded-2xl bg-linear-to-br from-hero-start to-hero-end p-6 text-white shadow-(--hero-shadow) ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-hero-muted">{title}</p>
        {action}
      </div>

      {totals.length === 0 ? (
        emptyText ? (
          <p className="mt-3 text-sm text-hero-muted">{emptyText}</p>
        ) : (
          <strong className="tabular-amount mt-1.5 block text-[2.25rem] leading-tight font-extrabold">{formatAmount(0)}</strong>
        )
      ) : totals.length === 1 ? (
        <div className="mt-1.5 flex items-baseline gap-2">
          <strong className="tabular-amount text-[2.25rem] leading-tight font-extrabold">{formatAmount(totals[0][1])}</strong>
          <span className="text-sm font-semibold text-hero-accent">{currencyLabel(totals[0][0])}</span>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {totals.map(([currency, total]) => (
            <div key={currency} className="rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15">
              <p className="text-[11px] font-semibold text-hero-muted">{currencyName(currency)}</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <strong className="tabular-amount text-[1.625rem] leading-tight font-extrabold">{formatAmount(total)}</strong>
                <span className="text-sm font-semibold text-hero-accent">{currencyLabel(currency)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {children}
    </section>
  );
}

export default TotalsCard;
