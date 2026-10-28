import adminClient from "./adminClient";

// Announcements to many users
export const fetchAudienceCounts = () => adminClient.get("/admin/announcements/audiences");
export const fetchAnnouncements = () => adminClient.get("/admin/announcements");
export const createAnnouncement = (payload) => adminClient.post("/admin/announcements", payload);
export const deleteAnnouncement = (id) => adminClient.delete(`/admin/announcements/${id}`);

// Saved chat replies
export const fetchQuickReplies = () => adminClient.get("/admin/quick-replies");
export const createQuickReply = (payload) => adminClient.post("/admin/quick-replies", payload);
export const deleteQuickReply = (id) => adminClient.delete(`/admin/quick-replies/${id}`);

// One user's full profile
export const fetchUserProfile = (userId) => adminClient.get(`/admin/users/${userId}/profile`);

// Renewal requests
export const fetchRenewals = (params) => adminClient.get("/admin/renewals", { params });
export const approveRenewal = (id, response) => adminClient.post(`/admin/renewals/${id}/approve`, { response });
export const rejectRenewal = (id, response) => adminClient.post(`/admin/renewals/${id}/reject`, { response });

// Revenue report
export const fetchRevenueReport = () => adminClient.get("/admin/revenue-report");

// Payment proof and where users send money
export const fetchRenewalProof = (id) => adminClient.get(`/admin/renewals/${id}/proof`, { responseType: "blob" });
export const fetchPaymentSettings = () => adminClient.get("/admin/payment-settings");
export const updatePaymentSettings = (payload) => adminClient.put("/admin/payment-settings", payload);
