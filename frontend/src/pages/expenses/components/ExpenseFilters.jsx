import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import DatePicker from "../../../components/common/DatePicker";
import Select from "../../../components/common/Select";
import { categoryLabel } from "../../categories/components/mandatoryCategories";


function ExpenseFilters({ filters, setFilters, handleFilterChange, isFiltered, resetFilters, availableAccounts, availableCategories, getCategoryName, getCategoryColor }) {
  const { t } = useTranslation();

  const [filterCatOpen, setFilterCatOpen] = useState(false);
  const filterCatRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (filterCatRef.current && !filterCatRef.current.contains(e.target)) {
        setFilterCatOpen(false);
      }
    }
    if (filterCatOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [filterCatOpen]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{t("expenses.listTitle")}</h3>
          <p className="text-xs text-slate-500">{t("expenses.listSubtitle")}</p>
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex min-h-10 items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
            <span>{t("expenses.clearFilters")}</span>
          </button>
        )}
      </div>

      {/* شريط الفلاتر (US-204) */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* فلتر الفترة الزمنية */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-period" className="text-xs font-semibold text-slate-600">{t("expenses.filters.periodLabel")}</label>
          <Select
            id="filter-period"
            name="period"
            value={filters.period}
            onChange={handleFilterChange}
            className="w-full bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="all">{t("expenses.filters.period.all")}</option>
            <option value="day">{t("expenses.filters.period.day")}</option>
            <option value="week">{t("expenses.filters.period.week")}</option>
            <option value="month">{t("expenses.filters.period.month")}</option>
            <option value="custom">{t("expenses.filters.period.custom")}</option>
          </Select>
        </div>

        {/* فلتر النوع */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-type" className="text-xs font-semibold text-slate-600">{t("expenses.filters.typeLabel")}</label>
          <Select
            id="filter-type"
            name="type"
            value={filters.type}
            onChange={handleFilterChange}
            className="w-full bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="all">{t("expenses.filters.typeAll")}</option>
            <option value="daily">{t("expenses.expenseType.daily")}</option>
            <option value="fixed">{t("expenses.expenseType.fixed")}</option>
            <option value="emergency">{t("expenses.expenseType.emergency")}</option>
          </Select>
        </div>

        {/* فلتر التصنيف مع نقاط ملونة */}
        <div className="flex flex-col gap-1 relative" ref={filterCatRef}>
          <label htmlFor="filter-category" className="text-xs font-semibold text-slate-600">{t("expenses.filters.categoryLabel")}</label>
          <button
            type="button"
            id="filter-category"
            aria-haspopup="listbox"
            aria-expanded={filterCatOpen}
            onClick={() => setFilterCatOpen((prev) => !prev)}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-start text-xs font-medium text-slate-700 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <span className="flex items-center gap-1.5">
              {filters.category !== "all" && (
                <span
                  className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(filters.category) }}
                />
              )}
              <span>
                {filters.category === "all"
                  ? t("expenses.filters.categoryAll")
                  : categoryLabel(getCategoryName(filters.category))}
              </span>
            </span>
            <svg
              className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${filterCatOpen ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          {filterCatOpen && (
            <div className="absolute top-full z-40 mt-1 w-full rounded-xl border border-slate-200 bg-white p-1 shadow-lg max-h-56 overflow-y-auto">
              <div
                onClick={() => {
                  setFilters((prev) => ({ ...prev, category: "all" }));
                  setFilterCatOpen(false);
                }}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs transition hover:bg-slate-100 ${
                  filters.category === "all" ? "bg-brand-50 font-bold text-brand-700" : "text-slate-700"
                }`}
              >
                {t("expenses.filters.categoryAll")}
              </div>
              {availableCategories.map((cat) => (
                <div
                  key={cat._id || cat.name}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, category: cat.name }));
                    setFilterCatOpen(false);
                  }}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs transition hover:bg-slate-100 ${
                    filters.category === cat.name ? "bg-brand-50 font-bold text-brand-700" : "text-slate-700"
                  }`}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color || getCategoryColor(cat.name) }}
                  />
                  <span>{categoryLabel(cat.name)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* فلتر الحساب */}
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-account" className="text-xs font-semibold text-slate-600">{t("expenses.filters.accountLabel")}</label>
          <Select
            id="filter-account"
            name="account"
            value={filters.account}
            onChange={handleFilterChange}
            className="w-full bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700"
          >
            <option value="all">{t("expenses.filters.accountAll")}</option>
            {availableAccounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* حقول التاريخ المخصص */}
      {filters.period === "custom" && (
        <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-startDate" className="text-xs font-semibold text-slate-600">{t("expenses.filters.startDate")}</label>
            <DatePicker
              id="filter-startDate"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={(value) => handleFilterChange({ target: { name: "startDate", value } })}
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-endDate" className="text-xs font-semibold text-slate-600">{t("expenses.filters.endDate")}</label>
            <DatePicker
              id="filter-endDate"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={(value) => handleFilterChange({ target: { name: "endDate", value } })}
              className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-brand-500"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ExpenseFilters;
