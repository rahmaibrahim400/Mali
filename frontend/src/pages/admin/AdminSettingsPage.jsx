import { useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Settings, ShieldCheck, UserRound, Wallet } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import AdminInfoTab from "./settings/AdminInfoTab";
import AdminSecurityTab from "./settings/AdminSecurityTab";
import AdminPaymentsTab from "./settings/AdminPaymentsTab";
import AdminProfileCard from "./settings/AdminProfileCard";
import LanguageMenu from "../../components/common/LanguageMenu";
import ThemePicker from "../../components/common/ThemePicker";

const TABS = [
  { key: "information", icon: UserRound, label: "profile.tabs.information", hint: "admin.settings.infoHint", tone: "bg-slate-100 text-slate-500" },
  { key: "security", icon: ShieldCheck, label: "profile.tabs.security", hint: "admin.settings.securityHint", tone: "bg-slate-100 text-slate-500" },
  { key: "payments", icon: Wallet, label: "admin.payments.tab", hint: "admin.payments.hint", tone: "bg-slate-100 text-slate-500" },
];

// The signed-in admin's settings: profile card and a menu on one side, the chosen section on the other.
function AdminSettingsPage() {
  const { t, i18n } = useTranslation();
  const { admin } = useSelector((state) => state.adminAuth);
  // ?tab=payments (e.g. from the revenue report's "edit prices") opens that tab.
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => (["information", "security", "payments"].includes(searchParams.get("tab")) ? searchParams.get("tab") : "information"));
  const [openSection, setOpenSection] = useState(null);

  const openSecuritySection = (section) => {
    setActiveTab("security");
    setOpenSection(section);
  };

  const handleTabKeyDown = (event) => {
    const keys = TABS.map((tab) => tab.key);
    const currentIndex = keys.indexOf(activeTab);
    let nextIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = keys.length - 1;
    else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      nextIndex = (currentIndex + (event.key === "ArrowDown" ? 1 : -1) + keys.length) % keys.length;
    } else {
      return;
    }
    event.preventDefault();
    setActiveTab(keys[nextIndex]);
    document.getElementById(`admin-settings-tab-${keys[nextIndex]}`)?.focus();
  };

  return (
    <div className="mx-auto max-w-6xl pb-8">
      <PageHeader icon={Settings} title={t("admin.settings.title")} subtitle={t("admin.settings.subtitle")} />

      {/* Photo card across the full width; below it the menu and the chosen section, side by side
          and the same height on large screens. */}
      <AdminProfileCard admin={admin} t={t} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside>
          <nav className="card-shadow h-full rounded-2xl border border-slate-200 bg-white p-2">
            <div role="tablist" aria-orientation="vertical" aria-label={t("admin.settings.title")} onKeyDown={handleTabKeyDown}>
              {TABS.map(({ key, icon: TabIcon, label, hint, tone }) => {
                const selected = activeTab === key;
                return (
                  <button
                    key={key}
                    id={`admin-settings-tab-${key}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`admin-settings-panel-${key}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => setActiveTab(key)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-start transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15 ${
                      selected ? "bg-slate-100" : "hover:bg-slate-100/60"
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                      <TabIcon size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm font-bold ${selected ? "text-slate-900" : "text-slate-700"}`}>{t(label)}</span>
                      <span className="block truncate text-xs text-slate-500">{t(hint)}</span>
                    </span>
                    <ChevronLeft size={16} className={`shrink-0 ltr:rotate-180 ${selected ? "text-slate-500" : "text-slate-300"}`} aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            {/* Language and theme: each opens a small menu in place (not a section). */}
            <div className="mt-1 space-y-2 border-t border-slate-100 px-3 pt-3 pb-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500">{t("admin.settings.languageTitle")}</span>
                <LanguageMenu t={t} i18n={i18n} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500">{t("layout.theme")}</span>
                <ThemePicker t={t} />
              </div>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 lg:h-full">
          {/* Panels fill the row (lg), so the card lines up with the photo + menu column. */}
          <section id="admin-settings-panel-information" role="tabpanel" aria-labelledby="admin-settings-tab-information" hidden={activeTab !== "information"} className="h-full">
            <AdminInfoTab admin={admin} t={t} onEditSecurity={openSecuritySection} />
          </section>
          <section id="admin-settings-panel-security" role="tabpanel" aria-labelledby="admin-settings-tab-security" hidden={activeTab !== "security"} className="h-full">
            <AdminSecurityTab admin={admin} t={t} openSection={openSection} setOpenSection={setOpenSection} />
          </section>
          <section id="admin-settings-panel-payments" role="tabpanel" aria-labelledby="admin-settings-tab-payments" hidden={activeTab !== "payments"} className="h-full">
            {activeTab === "payments" && <AdminPaymentsTab t={t} />}
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminSettingsPage;
