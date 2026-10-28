import { errorClass } from "../constants";

function IncomeAlerts({ error, updateError, successMessage }) {
  return (
    <>
    {error && (
      <p className={`mt-4 ${errorClass}`}>
        {error}
      </p>
    )}

    {updateError && (
      <p className={`mt-4 ${errorClass}`}>
        {updateError}
      </p>
    )}

    {successMessage && (
      <p className="mt-4 rounded-xl bg-income-soft px-4 py-2.5 text-sm font-medium text-income">
        {successMessage}
      </p>
    )}
    </>
  );
}

export default IncomeAlerts;
