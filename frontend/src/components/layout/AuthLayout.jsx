import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../common/LanguageSwitcher";
import authBg from "../../assets/auth-bg.jpg";

function Brand() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
        <img src="/favicon.svg" alt="" className="h-7 w-7" />
      </span>
      <span className="text-base font-extrabold text-white">{t("layout.brand")}</span>
    </div>
  );
}

/*
  Phones  (< sm):  a short photo strip with brand + language switch only; the form sheet below it.
  Tablets (sm–lg): full-bleed photo, brand above a centered card; the page scrolls if the form is tall.
  Desktop (lg+):   photo with headline on one side, floating card on the other.
*/
function AuthLayout() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  // Mirrored only in LTR so the photo's empty area always sits on the form's side.
  const photo = `bg-cover bg-center ${isArabic ? "" : "transform-[scaleX(-1)]"}`;

  return (
    <div className="relative isolate min-h-dvh bg-white sm:bg-transparent lg:h-screen lg:overflow-y-auto">
      {/* Full-bleed photo (tablet and desktop) */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 hidden sm:block">
        <div className={`absolute inset-0 ${photo}`} style={{ backgroundImage: `url(${authBg})` }} />
        <div className="absolute inset-0 bg-slate-900/55" />
      </div>

      <div className="flex min-h-dvh flex-col sm:items-center sm:justify-center sm:px-6 sm:py-10 lg:block lg:h-full lg:min-h-0 lg:p-0">
        {/* Phone header: a short, quiet photo strip — brand and language switch only */}
        <header className="relative isolate flex h-36 items-start justify-between overflow-hidden px-5 pt-5 sm:hidden">
          <div aria-hidden="true" className={`absolute inset-0 -z-10 ${photo}`} style={{ backgroundImage: `url(${authBg})` }} />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-900/70 to-slate-900/85" />
          <Brand />
          <LanguageSwitcher />
        </header>

        {/* Desktop (lg+): the whole composition sits in one centered, width-capped stage
            so the card stays balanced with the photo instead of drifting to the far edge
            on ultra-wide screens. */}
        <div className="lg:relative lg:mx-auto lg:h-full lg:max-w-[1600px]">
          {/* Brand: above the card on tablets, top corner on desktop */}
          <div className="mb-6 hidden sm:block lg:absolute lg:top-6 lg:inset-s-6 lg:mb-0">
            <Brand />
          </div>

          <div className="absolute bottom-10 inset-s-10 hidden max-w-xl lg:block">
            <h2 className="text-2xl font-extrabold leading-tight text-white">
              {t("auth.panel.headline1")} {t("auth.panel.headline2")}
              <br />
              {t("auth.panel.headline3")}
            </h2>
            <p className="mt-2 text-sm text-white/70">{t("auth.panel.subtitle")}</p>
          </div>

          {/* Card: a bottom sheet on phones, a floating card from sm up. */}
          <div className="relative -mt-8 flex-1 rounded-t-[1.75rem] bg-white px-5 pb-10 pt-8 sm:mt-0 sm:w-full sm:max-w-lg sm:flex-none sm:rounded-3xl sm:p-8 sm:shadow-2xl lg:absolute lg:inset-e-10 lg:top-1/2 lg:w-145 lg:max-w-none lg:-translate-y-1/2">
            <div className="mb-4 hidden justify-end sm:flex">
              <LanguageSwitcher />
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
