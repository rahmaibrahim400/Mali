/*
  The tooltip card for every Recharts chart (pass as <Tooltip content={<ChartTooltip ... />} />).
  Values lead and series names follow; each row is keyed by a short stroke of its series color.
  - title(label, payload): the heading (e.g. the month); omit for charts without one (donuts).
  - formatValue(value, entry): how each value reads (money, count...).
  - footer(payload): an optional extra line (e.g. a share of the total).
  - showNames: false on single-series charts, where the title already says what the value is.
*/
function ChartTooltip({ active, payload, label, title, formatValue = (value) => value, footer, showNames = true }) {
  if (!active || !payload?.length) return null;
  const heading = title ? title(label, payload) : null;
  const note = footer ? footer(payload) : null;

  return (
    <div className="whitespace-nowrap rounded-lg bg-white px-2.5 py-1.5 text-start shadow-md ring-1 ring-slate-200">
      {heading && <p className="mb-1 text-[11px] font-semibold text-slate-500">{heading}</p>}
      <ul className="space-y-0.5">
        {payload.map((entry) => (
          <li key={entry.dataKey ?? entry.name} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-0.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.payload?.fill || entry.color || entry.fill }}
            />
            <span className="tabular-amount text-xs font-bold text-slate-900">{formatValue(entry.value, entry)}</span>
            {showNames && entry.name && <span className="text-[11px] text-slate-500">{entry.name}</span>}
          </li>
        ))}
      </ul>
      {note && <p className="mt-1 text-[11px] text-slate-500">{note}</p>}
    </div>
  );
}

export default ChartTooltip;
