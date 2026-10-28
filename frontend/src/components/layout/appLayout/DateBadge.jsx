import { Calendar } from "lucide-react";
import { formatDate } from "../../../utils/formatAmount";

function DateBadge() {
  const today = formatDate(new Date());

  return (
    <span className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 xl:flex">
      <Calendar size={16} className="text-slate-400" />
      {today}
    </span>
  );
}

export default DateBadge;
