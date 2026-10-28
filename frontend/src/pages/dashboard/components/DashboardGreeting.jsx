import { formatDate } from "../../../utils/formatAmount";

function DashboardGreeting({ user, t }) {
  if (!user) return null;

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.75rem]">
        {t("dashboard.greeting", { name: user.name })}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{formatDate(new Date(), { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
  );
}

export default DashboardGreeting;
