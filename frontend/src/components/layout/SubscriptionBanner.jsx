import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Lock } from "lucide-react";
import { SUBSCRIPTION_LINK } from "./sidebar/SidebarUpgradeCard";

/*
  Shown above every page once the subscription has ended: the account is read-only until it is
  renewed (the server refuses any change). If a renewal request is already waiting for the
  admin, it says so instead of asking again.
*/
function SubscriptionBanner({ info }) {
  const { t } = useTranslation();
  if (info?.subscription?._status !== "expired") return null;
  const pending = info.latest?.status === "pending";
  const Icon = pending ? Clock : Lock;

  return (
    <div
      role="status"
      className={`mb-5 flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
        pending ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white ring-1 ${
            pending ? "text-amber-600 ring-amber-200" : "text-expense ring-red-200"
          }`}
        >
          <Icon size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-bold ${pending ? "text-amber-900" : "text-red-900"}`}>
            {t(pending ? "subscription.banner.pendingTitle" : "subscription.banner.expiredTitle")}
          </p>
          <p className={`mt-0.5 text-xs leading-5 ${pending ? "text-amber-800" : "text-red-800"}`}>
            {t(pending ? "subscription.banner.pendingText" : "subscription.banner.expiredText")}
          </p>
        </div>
      </div>
      <Link
        to={SUBSCRIPTION_LINK}
        className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold transition ${
          pending
            ? "border border-amber-200 bg-white text-amber-900 hover:bg-amber-100"
            : "bg-expense text-white shadow-sm hover:bg-red-800"
        }`}
      >
        {t(pending ? "layout.viewRequest" : "layout.renewButton")}
      </Link>
    </div>
  );
}

export default SubscriptionBanner;
