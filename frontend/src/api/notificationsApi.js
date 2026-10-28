import axiosClient from "./axiosClient";
import adminClient from "./adminClient";

// The bell: notifications worked out from the account's data, read one by one or all at once.
export const fetchUserNotifications = () => axiosClient.get("/notifications");
export const markUserNotificationRead = (id) => axiosClient.post("/notifications/read", { id });
export const markAllUserNotificationsRead = () => axiosClient.post("/notifications/read-all");

export const fetchAdminNotifications = () => adminClient.get("/admin/notifications");
export const markAdminNotificationRead = (id) => adminClient.post("/admin/notifications/read", { id });
export const markAllAdminNotificationsRead = () => adminClient.post("/admin/notifications/read-all");
