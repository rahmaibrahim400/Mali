import { useTranslation } from "react-i18next";

// Loading placeholders shaped like the content they stand in for. Each group is announced
// once to screen readers (role="status" + hidden label); the shapes themselves are hidden.

export function Skeleton({ className = "", style }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} style={style} />;
}

function Group({ label, className = "", children, announce = true }) {
  const { t } = useTranslation();
  if (!announce) return <div className={className}>{children}</div>;
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label || t("common.loading")}</span>
      {children}
    </div>
  );
}

// Rows of "icon + two lines + amount" — transactions, expenses, income, categories.
export function ListSkeleton({ rows = 4, label, className = "", compact = false }) {
  return (
    <Group label={label} className={`divide-y divide-slate-100 ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`flex items-center gap-3 ${compact ? "px-4 py-3.5" : "py-4"}`}>
          <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={`h-3.5 ${i % 2 ? "w-2/5" : "w-1/2"}`} />
            {!compact && <Skeleton className="h-3 w-1/4" />}
          </div>
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
      ))}
    </Group>
  );
}

// Grid of cards — accounts, debts, savings goals.
export function CardGridSkeleton({ cards = 3, className = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", label }) {
  return (
    <Group label={label} className={className}>
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="flex gap-2 border-t border-slate-100 pt-3">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </Group>
  );
}

// Tiles with a label and a big number — summaries and report KPIs.
export function StatsSkeleton({ count = 3, className = "grid grid-cols-1 gap-4 md:grid-cols-3", label, bare = false, announce = true }) {
  return (
    <Group label={label} className={className} announce={announce}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`space-y-3 rounded-xl p-4 ${bare ? "bg-slate-50" : "bg-white shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80"}`}
        >
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </Group>
  );
}

// Bar-chart placeholder.
export function ChartSkeleton({ bars = 8, className = "" }) {
  const heights = ["45%", "70%", "55%", "85%", "40%", "65%", "75%", "50%", "60%", "80%", "35%", "68%"];
  return (
    <div aria-hidden="true" className={`flex h-40 items-end gap-3 ${className}`}>
      {Array.from({ length: bars }, (_, i) => (
        <Skeleton key={i} className="flex-1 rounded-t-md rounded-b-none" style={{ height: heights[i % heights.length] }} />
      ))}
    </div>
  );
}

// Reports tab: KPI tiles + a chart card.
export function ReportSkeleton({ label }) {
  return (
    <Group label={label} className="space-y-4">
      <StatsSkeleton count={3} announce={false} className="grid grid-cols-1 gap-4 sm:grid-cols-3" />
      <div className="rounded-2xl bg-white p-6 shadow-sm shadow-slate-200 ring-1 ring-slate-100 emerald:ring-slate-200/80">
        <Skeleton className="mb-6 h-4 w-40" />
        <ChartSkeleton />
      </div>
    </Group>
  );
}
