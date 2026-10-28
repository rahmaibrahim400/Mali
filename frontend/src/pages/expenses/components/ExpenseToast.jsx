

function ExpenseToast({ toastMessage }) {
  return (
    <>
    {toastMessage && (
      <div className="fixed bottom-5 inset-s-5 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl transition">
        <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
        </svg>
        <span>{toastMessage}</span>
      </div>
    )}
    </>
  );
}

export default ExpenseToast;
