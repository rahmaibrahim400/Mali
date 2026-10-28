import Select from "../../../components/common/Select";
import NumberInput from "../../../components/common/NumberInput";
import ColorPicker from "../../../components/common/ColorPicker";
import FormModal from "../../../components/common/FormModal";
import { Plus } from "lucide-react";
import { currencyName } from "../../../utils/formatAmount";

const CURRENCIES = ["EGP", "USD", "EUR", "GBP"];

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500";
const labelClass = "text-sm font-semibold text-slate-700";
const errorClass = "rounded-xl bg-expense-soft px-4 py-2.5 text-sm font-medium text-expense";

function AccountForm({ form, createStatus, createError, onChange, onSubmit, onClose, t }) {
  return (
    <FormModal title={t("accounts.submit")} onClose={onClose} closeDisabled={createStatus === "loading"}>
      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className={labelClass}>
            {t("accounts.nameLabel")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={onChange}
            placeholder={t("accounts.namePlaceholder")}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className={labelClass}>
            {t("accounts.typeLabel")}
          </label>
          <Select id="type" name="type" required value={form.type} onChange={onChange} className={inputClass}>
            <option value="">{t("accounts.typePlaceholder")}</option>
            <option value="bank">{t("accounts.bank")}</option>
            <option value="wallet">{t("accounts.wallet")}</option>
            <option value="cash">{t("accounts.cash")}</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="initialBalance" className={labelClass}>
            {t("accounts.balanceLabel")}
          </label>
          <NumberInput
            id="initialBalance"
            name="initialBalance"
            step="0.01"
            value={form.initialBalance}
            onChange={onChange}
            placeholder="0"
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="currency" className={labelClass}>
            {t("accounts.currencyLabel")}
          </label>
          <Select id="currency" name="currency" value={form.currency} onChange={onChange} className={inputClass}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyName(code)}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label id="color-label" htmlFor="color" className={labelClass}>
            {t("accounts.colorLabel")}
          </label>
          <ColorPicker id="color" name="color" value={form.color} onChange={onChange} labelledBy="color-label" />
        </div>

        <div className="flex flex-col gap-3 sm:col-span-2">
          {createError && <p role="alert" className={errorClass}>{createError}</p>}
          <button
            type="submit"
            disabled={createStatus === "loading"}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 active:scale-[0.99] disabled:cursor-wait disabled:opacity-65"
          >
            {createStatus !== "loading" && <Plus size={17} aria-hidden="true" />}
            {createStatus === "loading" ? t("accounts.submitting") : t("accounts.submit")}
          </button>
        </div>
      </form>
    </FormModal>
  );
}

export default AccountForm;
