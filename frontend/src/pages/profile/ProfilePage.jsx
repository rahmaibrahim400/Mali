import { useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, CreditCard, ShieldCheck, UserRound } from "lucide-react";
import ProfileForm from "./components/ProfileForm";
import EmailChangeSection from "./components/EmailChangeSection";
import PhoneChangeSection from "./components/PhoneChangeSection";
import PasswordChangeSection from "./components/PasswordChangeSection";
import SubscriptionCard from "./components/SubscriptionCard";
import UserProfileCard from "./components/UserProfileCard";
import LanguageMenu from "../../components/common/LanguageMenu";
import ThemePicker from "../../components/common/ThemePicker";
import useChangeLanguage from "../../i18n/useChangeLanguage";
import PageHeader from "../../components/common/PageHeader";

const TABS = [
  { key: "information", icon: UserRound, label: "profile.tabs.information", hint: "profile.tabHints.information", tone: "bg-brand-50 text-brand-600" },
  { key: "subscription", icon: CreditCard, label: "profile.tabs.subscription", hint: "profile.tabHints.subscription", tone: "bg-emerald-50 text-emerald-600" },
  { key: "security", icon: ShieldCheck, label: "profile.tabs.security", hint: "profile.tabHints.security", tone: "bg-amber-50 text-amber-600" },
];

// The user's settings, laid out like the admin's: profile card on top, then a menu (with the
// language and theme pickers) beside the chosen section, both the same height on large screens.
function ProfilePage() {
  const { t, i18n } = useTranslation();
  const changeLanguage = useChangeLanguage();
  const { user } = useSelector((state) => state.auth);
  // ?tab=subscription (from the sidebar card or a notification) opens that section. Each link
  // click is a new location key, so it re-opens the tab even if the URL didn't change.
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const urlTab = TABS.some(({ key }) => key === searchParams.get("tab")) ? searchParams.get("tab") : null;
  const [activeTab, setActiveTab] = useState(urlTab || "information");
  const [seenLocationKey, setSeenLocationKey] = useState(location.key);
  if (location.key !== seenLocationKey) {
    setSeenLocationKey(location.key);
    if (urlTab) setActiveTab(urlTab);
  }
  const [securityRequest, setSecurityRequest] = useState({ section: null, id: 0 });

  const openSecuritySection = (section) => {
    setActiveTab("security");
    setSecurityRequest((previous) => ({ section, id: previous.id + 1 }));
  };
  const clearSecurityRequest = () => {
    setSecurityRequest((previous) => ({ ...previous, section: null }));
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
    document.getElementById(`profile-tab-${keys[nextIndex]}`)?.focus();
  };

  return (
    <div className="mx-auto max-w-6xl pb-8">
      <PageHeader icon={UserRound} title={t("profile.title")} subtitle={t("profile.subtitle")} />

      <UserProfileCard user={user} t={t} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_1fr]">
        <aside>
          <nav className="h-full rounded-3xl border border-slate-200/80 bg-white p-2 shadow-sm">
            <div role="tablist" aria-orientation="vertical" aria-label={t("profile.sectionsLabel")} onKeyDown={handleTabKeyDown}>
              {TABS.map(({ key, icon: TabIcon, label, hint, tone }) => {
                const selected = activeTab === key;
                return (
                  <button
                    key={key}
                    id={`profile-tab-${key}`}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`profile-panel-${key}`}
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
                <LanguageMenu t={t} i18n={i18n} placement="below" onChange={changeLanguage} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-500">{t("layout.theme")}</span>
                <ThemePicker t={t} placement="below" />
              </div>
            </div>
          </nav>
        </aside>

        <div className="min-w-0 lg:h-full">
          <section id="profile-panel-information" role="tabpanel" aria-labelledby="profile-tab-information" hidden={activeTab !== "information"} className="h-full">
            <ProfileForm user={user} t={t} onEditSecurity={openSecuritySection} />
          </section>

          <section id="profile-panel-subscription" role="tabpanel" aria-labelledby="profile-tab-subscription" hidden={activeTab !== "subscription"} className="h-full">
            <SubscriptionCard t={t} language={i18n.language} />
          </section>

          <section
            id="profile-panel-security"
            role="tabpanel"
            aria-labelledby="profile-tab-security"
            hidden={activeTab !== "security"}
            className="h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm"
          >
            <header className="flex items-start gap-3 px-5 py-5 sm:px-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900">{t("profile.security.title")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("profile.security.subtitle")}</p>
              </div>
            </header>
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              <EmailChangeSection
                key={`email-${securityRequest.id}`}
                t={t}
                currentEmail={user?.email}
                securityRequest={securityRequest}
                onClearRequest={clearSecurityRequest}
              />
              <PhoneChangeSection
                key={`phone-${securityRequest.id}`}
                user={user}
                t={t}
                securityRequest={securityRequest}
                onClearRequest={clearSecurityRequest}
              />
              <PasswordChangeSection
                key={`password-${securityRequest.id}`}
                t={t}
                securityRequest={securityRequest}
                onClearRequest={clearSecurityRequest}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
