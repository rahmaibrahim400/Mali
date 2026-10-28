import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Clock, Gem } from "lucide-react";
import { toIntlLocale } from "../../../i18n/locale";

export const SUBSCRIPTION_LINK = "/profile?tab=subscription";

/*
  Sidebar card that leads to the subscription section. What it says follows the plan:
  trial → upgrade, ending soon / ended → renew, a request waiting for the admin → under review.
  A paid plan that isn't ending (or a suspended account) shows nothing.
  variant "sheet" is the same card inside the phone "More" sheet. info: GET /renewal, read by AppLayout.
*/
function SidebarUpgradeCard({ info, collapsed = false, variant = "sidebar", onNavigate }) {
  const { t, i18n } = useTranslation();
  const subscription = info?.subscription;
  if (!subscription) return null;

  const status = subscription._status;
  const pending = info.latest?.status === "pending";
  const trial = subscription.subscriptionType === "trial";
  let content;
  if (pending) {
    content = { icon: Clock, title: t("layout.upgradePendingTitle"), text: t("layout.upgradePendingSubtitle"), action: t("layout.viewRequest") };
  } else if (status === "expired") {
    content = { icon: Gem, title: t("layout.upgradeExpiredTitle"), text: t("layout.upgradeExpiredSubtitle"), action: t("layout.renewButton") };
  } else if (trial && status !== "suspended") {
    content = { icon: Gem, title: t("layout.upgradeTitle"), text: t("layout.upgradeSubtitle"), action: t("layout.upgradeButton") };
  } else if (status === "expiring") {
    const date = new Intl.DateTimeFormat(toIntlLocale(i18n.language), { day: "numeric", month: "long" }).format(new Date(subscription.subscriptionEnd));
    content = { icon: Gem, title: t("layout.upgradeExpiringTitle"), text: t("layout.upgradeExpiringSubtitle", { date }), action: t("layout.renewButton") };
  } else {
    return null;
  }
  const Icon = content.icon;
  const urgent = status === "expired";

  if (collapsed) {
    return (
      <Link
        to={SUBSCRIPTION_LINK}
        title={content.title}
        aria-label={content.title}
        className="relative flex h-10 w-full items-center justify-center rounded-xl bg-slate-50 text-accent-600 ring-1 ring-slate-100 transition hover:bg-slate-100 emerald:bg-white/5 emerald:text-brand-400 emerald:ring-white/10 emerald:hover:bg-white/10"
      >
        <Icon size={18} aria-hidden="true" />
        {urgent && <span aria-hidden="true" className="absolute top-1.5 h-2 w-2 rounded-full bg-expense ring-2 ring-white inset-e-1.5 emerald:ring-navy-900" />}
      </Link>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-slate-50 p-4 text-center ring-1 ring-slate-100 emerald:bg-white/5 emerald:ring-white/10 ${
        variant === "sheet" ? "" : "mb-3"
      }`}
    >
      <span
        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 emerald:bg-white/10 emerald:ring-white/10 ${
          urgent ? "text-expense" : "text-accent-600 emerald:text-brand-400"
        }`}
      >
        <Icon size={19} aria-hidden="true" />
      </span>
      <p className="mt-2.5 text-sm font-bold text-slate-900 emerald:text-white">{content.title}</p>
      <p className="mt-0.5 text-xs leading-5 text-slate-500 emerald:text-slate-400">{content.text}</p>
      <Link
        to={SUBSCRIPTION_LINK}
        onClick={onNavigate}
        className={`mt-3 flex min-h-9 w-full items-center justify-center rounded-lg px-3 text-xs font-bold transition ${
          pending
            ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 emerald:border-white/15 emerald:bg-transparent emerald:text-slate-200 emerald:hover:bg-white/10"
            : "bg-brand-600 text-white shadow-sm hover:bg-brand-700"
        }`}
      >
        {content.action}
      </Link>
    </div>
  );
}

export default SidebarUpgradeCard;
