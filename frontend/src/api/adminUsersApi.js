import adminClient from "./adminClient";

export const fetchAdminUsers = (params, { signal } = {}) =>
  adminClient.get("/admin/users", { params, signal });

export const createAdminUser = (payload) => adminClient.post("/admin/users", payload);

export const updateAdminUserSubscription = (userId, payload) =>
  adminClient.put(`/admin/users/${userId}/subscription`, payload);

export const suspendAdminUser = (userId, reason) =>
  adminClient.post(`/admin/users/${userId}/suspend`, { reason });

export const activateAdminUser = (userId) =>
  adminClient.post(`/admin/users/${userId}/activate`);

export const fetchAdminLogs = (params, { signal } = {}) =>
  adminClient.get("/admin/logs", { params, signal });
