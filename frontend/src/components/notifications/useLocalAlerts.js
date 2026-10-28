import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { notificationsLoaded, notificationsRead } from "../../store/slices/notificationsSlice";

const STORAGE_PREFIX = "appNotifications:";
const MAX_READ_IDS = 200;
const EVENT_LINKS = { transfer: "/accounts/transfer", cash: "/cash", expense: "/expenses", debtPayment: "/debts", savings: "/savings", renewals: "/admin/renewals" };

/*
  Alerts that only exist in this browser (e.g. trying to spend more than an account holds),
  kept per user in localStorage. Returned in the bell's item shape so they sit next to the
  server's notifications, plus a way to mark them read.
*/
export default function useLocalAlerts(user) {
  const dispatch = useDispatch();
  const { ownerId, events, readIds } = useSelector((state) => state.notifications);
  const userId = user?._id || user?.id || user?.email;

  // Load this user's saved alerts; save them back whenever they change.
  useEffect(() => {
    if (!userId) return;
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_PREFIX + userId)) || {};
    } catch {
      // Unreadable storage: start empty.
    }
    dispatch(notificationsLoaded({ ownerId: userId, events: stored.events, readIds: stored.readIds }));
  }, [dispatch, userId]);

  useEffect(() => {
    if (!userId || ownerId !== userId) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify({ events, readIds: readIds.slice(-MAX_READ_IDS) }));
    } catch {
      // Storage blocked: alerts still work for this visit.
    }
  }, [userId, ownerId, events, readIds]);

  const items = useMemo(() => {
    const read = new Set(readIds);
    return events.map((event) => ({
      id: event.id,
      type: event.type,
      params: event.data,
      link: EVENT_LINKS[event.data?.source] || "/accounts",
      at: event.createdAt,
      read: read.has(event.id),
      local: true,
    }));
  }, [events, readIds]);

  const markRead = useCallback((ids) => dispatch(notificationsRead(ids)), [dispatch]);

  return { items, markRead };
}
