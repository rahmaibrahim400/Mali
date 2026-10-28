import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toIntlLocale } from "../../i18n/locale";

/*
  Shared look for the app's Recharts charts. Colors are CSS variables, so every chart follows
  the active theme (Mali / emerald) without re-rendering. Hex fallbacks cover any variable
  Tailwind didn't emit.
*/
export const CHART_COLORS = {
  income: "var(--color-income, #15803d)",
  expense: "var(--color-expense, #b91c1c)",
  brand: "var(--color-brand-600, #334155)",
  brandSoft: "var(--color-brand-500, #64748b)",
  // Weekend days in the spending-habits chart: the theme accent (orange in Mali).
  weekend: "var(--color-accent-500, #ff9b51)",
  empty: "var(--color-slate-200, #e2e8f0)",
};

// Recessive chrome: muted tick labels, no axis lines, a faint dashed horizontal grid.
export const AXIS_TICK = { fill: "var(--color-slate-400, #94a3b8)", fontSize: 11, fontWeight: 500 };
export const GRID_PROPS = { vertical: false, stroke: "var(--color-slate-100, #f1f5f9)", strokeDasharray: "4 4" };
// The hovered column's band (shared tooltips on bar charts).
export const BAR_CURSOR = { fill: "var(--color-slate-100, #f1f5f9)", opacity: 0.7 };
// Rounded data-ends, anchored to the baseline.
export const BAR_RADIUS = [4, 4, 0, 0];

export function prefersReducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/*
  Direction-aware axis props: in Arabic time runs right-to-left and the value axis sits on the
  right, matching the rest of the RTL layout. Also returns a compact number formatter for ticks.
*/
export function useChartLayout() {
  const { i18n } = useTranslation();
  const rtl = i18n.language === "ar";
  const locale = toIntlLocale(i18n.language);

  return useMemo(() => {
    const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
    return {
      rtl,
      xAxisProps: { reversed: rtl, axisLine: false, tickLine: false, tick: AXIS_TICK, tickMargin: 8 },
      yAxisProps: {
        orientation: rtl ? "right" : "left",
        axisLine: false,
        tickLine: false,
        tick: AXIS_TICK,
        width: 44,
        tickFormatter: (value) => compact.format(value),
      },
      // Donut tooltips: above the center label, free to leave the small chart area, and opening
      // toward the card's interior (leftward in RTL, where donuts sit at the card's right edge).
      donutTooltipProps: { wrapperStyle: { zIndex: 20 }, allowEscapeViewBox: { x: true, y: true }, reverseDirection: { x: rtl } },
      animate: !prefersReducedMotion(),
    };
  }, [rtl, locale]);
}
