import { useTranslation } from "react-i18next";
import { inputClass } from "../constants";
import Select from "../../../components/common/Select";
import MonthYearPicker from "../../../components/common/MonthYearPicker";
import { currencyName } from "../../../utils/formatAmount";
import { INCOME_CURRENCIES } from "../constants";

function IncomeSummaryFilter({ selectedMonth, setSelectedMonth, summaryCurrency, setSummaryCurrency }) {
  const { t } = useTranslation();

  return (
    <>
    <section className="mt-6 rounded-2xl bg-white p-4 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80 sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">
        {t("income.filter.title")}
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold text-slate-700">
          <label htmlFor="summary-month">{t("income.filter.monthYearLabel")}</label>
          <MonthYearPicker
            id="summary-month"
            value={selectedMonth}
            onChange={setSelectedMonth}
            className={inputClass}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold text-slate-700">
          <label htmlFor="summary-currency">{t("income.filter.baseCurrencyLabel")}</label>

          <Select
            id="summary-currency"
            value={summaryCurrency}
            onChange={(event) =>
              setSummaryCurrency(event.target.value)
            }
            className={inputClass}
          >
            <option value="ALL">{t("income.filter.allCurrencies")}</option>
            {INCOME_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyName(code)}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </section>
    </>
  );
}

export default IncomeSummaryFilter;
