import { Spinner } from "../../../components/common/Loader";

function AuthSubmitButton({ loading, loadingLabel, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className="mx-auto mt-4 flex min-h-11 w-[70%] max-w-56 items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/30 transition hover:bg-brand-700 disabled:cursor-wait disabled:opacity-80"
    >
      {loading && <Spinner size={16} color="#ffffff" label={loadingLabel} />}
      {loading ? loadingLabel : label}
    </button>
  );
}

export default AuthSubmitButton;
