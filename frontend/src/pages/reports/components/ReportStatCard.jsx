import { formatAmount, currencyLabel } from "../../../utils/formatAmount";

// Light tints that stay readable on the dark card (text-income / text-expense are too dark here).
const TONES = { positive: "text-green-300", negative: "text-red-300" };

/*
  A report headline number in the dark "total" style (same --color-hero-* tokens as TotalsCard):
  the amount in white (or a positive/negative tint), its currency in the theme accent.
  Pass `value` instead of `amount` for non-money figures (e.g. a percentage).
*/
function ReportStatCard({ label, icon: Icon, amount, currency = "EGP", value, tone, large = false, children }) {
  return (
    <div
      className={`rounded-2xl bg-linear-to-br from-hero-start to-hero-end text-white shadow-(--hero-shadow) ${
        large ? "p-6 sm:p-8" : "p-5"
      }`}
    >
      <p className={`flex items-center gap-2 text-hero-muted ${large ? "text-xs font-medium" : "text-[11px] font-semibold"}`}>
        {Icon && <Icon size={14} aria-hidden="true" />}
        {label}
      </p>
      <p className={`mt-1.5 flex items-baseline gap-1.5 font-extrabold ${large ? "text-[2rem] leading-tight" : "text-2xl"}`}>
        {value ?? (
          <>
            <span className={`tabular-amount ${TONES[tone] ?? ""}`}>{formatAmount(amount)}</span>
            <span className="text-sm font-semibold text-hero-accent">{currencyLabel(currency)}</span>
          </>
        )}
      </p>
      {children}
    </div>
  );
}

export default ReportStatCard;
