import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Consistent page title block: optional back link, icon, title, subtitle and actions.
// Stacks on phones; title and actions sit side by side from `sm` up.
function PageHeader({ title, subtitle, icon: Icon, actions, backTo, backLabel }) {
  return (
    <header className="mb-6">
      {backTo && (
        <Link
          to={backTo}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-slate-500 transition hover:text-brand-700"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200 sm:flex">
              <Icon size={22} />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[1.75rem]">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-500 sm:text-base">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

export default PageHeader;
