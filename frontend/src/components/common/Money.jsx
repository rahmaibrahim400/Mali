import { formatNumber, currencyLabel } from "../../utils/formatAmount";

/*
  An amount followed by its currency label, the label colored apart: the theme's currency color
  on light surfaces by default, or pass `currencyClassName` (e.g. "text-hero-accent" on dark
  cards, "" to inherit the amount's color). Renders the same text as formatMoney().
*/
function Money({ value, currency = "EGP", options, currencyClassName = "text-currency" }) {
  return (
    <>
      <span className="tabular-amount">{formatNumber(value, options)}</span>{" "}
      <span className={currencyClassName}>{currencyLabel(currency || "EGP")}</span>
    </>
  );
}

export default Money;
