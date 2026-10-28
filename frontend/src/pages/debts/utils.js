import { extractError } from "../../utils/errorHandler";

export function getErrorMessage(error, fallback) {
  return extractError(error, fallback);
}

export function isOverdue(debt) {
  if (debt.status === "paid") return false;
  if (debt.status === "overdue") return true;
  if (!debt.dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(debt.dueDate) < today;
}

export function isDueSoon(debt) {
  if (debt.status === "paid" || isOverdue(debt) || !debt.dueDate) return false;
  const daysUntilDue = getDaysUntilDue(debt.dueDate);
  return daysUntilDue >= 0 && daysUntilDue <= 7;
}

export function getDaysUntilDue(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(dateString);
  dueDate.setHours(0, 0, 0, 0);
  return Math.ceil((dueDate - today) / 86400000);
}

