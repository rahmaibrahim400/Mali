// A tiny picture of a theme: its sidebar strip, a primary bar and an accent dot.
function ThemePreview({ preview, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex overflow-hidden rounded-lg bg-slate-50 ring-1 ring-slate-200 ${className}`}
    >
      <span className="w-1/4 border-e border-slate-200" style={{ backgroundColor: preview.sidebar }} />
      <span className="flex flex-1 flex-col justify-center gap-1 px-1.5">
        <span className="h-1.5 w-full rounded-full" style={{ backgroundColor: preview.primary }} />
        <span className="flex items-center gap-1">
          <span className="h-1.5 flex-1 rounded-full bg-slate-200" />
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: preview.accent }} />
        </span>
      </span>
    </span>
  );
}

export default ThemePreview;
