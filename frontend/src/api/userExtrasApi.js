import axiosClient from "./axiosClient";

// Announcements the admin team sent me
export const fetchMyAnnouncements = () => axiosClient.get("/announcements");

// My plan, and renewing it: payload { plan, method, reference, sender, proof (data URL), note }
export const fetchMyRenewal = () => axiosClient.get("/renewal");
export const requestRenewal = (payload) => axiosClient.post("/renewal", payload);
export const cancelMyRenewal = () => axiosClient.delete("/renewal");
