import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { inputClass, labelClass } from "../constants";
import { formatAmount, formatMoney, currencyLabel } from "../../../utils/formatAmount";
import NumberInput from "../../../components/common/NumberInput";
import DatePicker from "../../../components/common/DatePicker";
import Select from "../../../components/common/Select";

function PaymentModal({ paymentModalDebt, setPaymentModalDebt, handleSavePayment, paymentForm, setPaymentForm, activeAccounts, savingPayment }) {
  const { t } = useTranslation();

  return (
    <>
    {paymentModalDebt && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4">
        <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200 sm:max-h-[calc(100dvh-2rem)] sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{t("debts.paymentModal.title")}</h2>
              <p className="text-xs text-slate-500">
                {t("debts.paymentModal.payingFor")} <strong>{paymentModalDebt.creditor}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentModalDebt(null)}
              aria-label={t("common.close")}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-800">
            {t("debts.paymentModal.remainingLabel")}{" "}
            <strong>
              {formatMoney(
                paymentModalDebt.remainingAmount ?? paymentModalDebt.totalAmount - paymentModalDebt.paidAmount,
                paymentModalDebt.currency
              )}
            </strong>
          </div>

          <form onSubmit={handleSavePayment} className="space-y-4">
            <div>
              <label htmlFor="payment-amount" className={labelClass}>
                {t("debts.paymentModal.amountLabel")} <span className="text-red-500">*</span>
              </label>
              <NumberInput
                id="payment-amount"
                autoFocus
                required
                min="0.01"
                step="0.01"
                max={Number(
                  paymentModalDebt.remainingAmount ??
                    paymentModalDebt.totalAmount - paymentModalDebt.paidAmount
                )}
                placeholder="0.00"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="payment-date" className={labelClass}>
                {t("debts.paymentModal.dateLabel")} <span className="text-red-500">*</span>
              </label>
              <DatePicker
                id="payment-date"
                required
                value={paymentForm.date}
                onChange={(value) =>
                  setPaymentForm((prev) => ({ ...prev, date: value }))
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="payment-account" className={labelClass}>
                {t("debts.paymentModal.accountLabel")} <span className="text-red-500">*</span>
              </label>
              <Select
                id="payment-account"
                required
                value={paymentForm.accountId}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, accountId: e.target.value }))
                }
                className={inputClass}
              >
                <option value="">{t("debts.paymentModal.selectAccount")}</option>
                {activeAccounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {t("debts.paymentModal.accountOption", {
                      name: account.name,
                      balance: formatAmount(account.balance || 0),
                      currency: currencyLabel(account.currency),
                    })}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-slate-500">
                {t("debts.paymentModal.accountHint")}
              </p>
            </div>

            <div>
              <label htmlFor="payment-notes" className={labelClass}>{t("debts.paymentModal.notesLabel")}</label>
              <input
                id="payment-notes"
                type="text"
                placeholder={t("debts.paymentModal.notesPlaceholder")}
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className={inputClass}
              />
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                onClick={() => setPaymentModalDebt(null)}
                className="min-h-11 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 sm:w-auto"
              >
                {t("debts.paymentModal.cancel")}
              </button>
              <button
                type="submit"
                disabled={savingPayment}
                className="min-h-11 w-full rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60 sm:w-auto"
              >
                {savingPayment ? t("debts.paymentModal.saving") : t("debts.paymentModal.confirm")}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}

export default PaymentModal;
