// Subscription helpers shared by the admin controllers.

const PLAN_LABELS = { trial: "تجريبي", "3months": "3 أشهر", "6months": "6 أشهر", yearly: "سنة", custom: "مخصص" };
const DAY = 24 * 60 * 60 * 1000;

function calcEnd(type, start, customDays) {
  const d = new Date(start);
  if (type === "trial")    d.setDate(d.getDate() + 14);
  else if (type === "3months") d.setMonth(d.getMonth() + 3);
  else if (type === "6months") d.setMonth(d.getMonth() + 6);
  else if (type === "yearly")  d.setFullYear(d.getFullYear() + 1);
  else if (type === "custom")  d.setDate(d.getDate() + (parseInt(customDays) || 30));
  return d;
}

function planLabel(type) {
  return PLAN_LABELS[type] ?? type;
}

function userStatus(user) {
  if (user.isSuspended) return "suspended";
  if (!user.subscriptionEnd) return "active";
  const now  = Date.now();
  const end  = new Date(user.subscriptionEnd).getTime();
  if (now > end)          return "expired";
  if (end - now < 7 * DAY) return "expiring";
  return "active";
}

module.exports = { calcEnd, planLabel, userStatus, DAY };
