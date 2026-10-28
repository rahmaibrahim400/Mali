import Select from "../../../components/common/Select";
import { formatMoney } from "../../../utils/formatAmount";

const inputClass =
  "w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-brand-500";
const labelClass = "mb-1.5 mt-4 block text-sm font-semibold text-slate-700";

function AccountSelect({ id, name, label, placeholder, accounts, value, onChange }) {
  return (
    <>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <Select id={id} name={name} value={value} onChange={onChange} className={inputClass}>
        <option value="">{placeholder}</option>
        {accounts.map((account) => (
          <option key={account._id} value={account._id}>
            {account.name} ({formatMoney(account.balance, account.currency)})
          </option>
        ))}
      </Select>
    </>
  );
}

export default AccountSelect;
