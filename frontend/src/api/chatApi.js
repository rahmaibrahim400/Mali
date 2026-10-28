import axiosClient from "./axiosClient";
import adminClient from "./adminClient";

// User ↔ support (the admin team)
export const fetchMyMessages = () => axiosClient.get("/chat/messages");
// payload: { text } or a voice message { audio (base64), mimeType, duration }
export const sendMyMessage = (payload) => axiosClient.post("/chat/messages", payload);
export const fetchMyUnread = () => axiosClient.get("/chat/unread");
export const editMyMessage = (messageId, text) => axiosClient.patch(`/chat/messages/${messageId}`, { text });
export const deleteMyMessage = (messageId) => axiosClient.delete(`/chat/messages/${messageId}`);
export const fetchMyAudio = (messageId) =>
  axiosClient.get(`/chat/messages/${messageId}/audio`, { responseType: "blob" });

// Admin side: every registered user is a contact
export const fetchChatContacts = (params, { signal } = {}) =>
  adminClient.get("/admin/chat/contacts", { params, signal });
export const fetchUserMessages = (userId) => adminClient.get(`/admin/chat/users/${userId}/messages`);
export const sendMessageToUser = (userId, payload) =>
  adminClient.post(`/admin/chat/users/${userId}/messages`, payload);
export const fetchAdminUnread = () => adminClient.get("/admin/chat/unread");
export const editAdminMessage = (messageId, text) => adminClient.patch(`/admin/chat/messages/${messageId}`, { text });
export const deleteAdminMessage = (messageId) => adminClient.delete(`/admin/chat/messages/${messageId}`);
export const fetchAdminAudio = (messageId) =>
  adminClient.get(`/admin/chat/messages/${messageId}/audio`, { responseType: "blob" });
