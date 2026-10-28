import axiosClient from "./axiosClient";

export const getDashboardSummary = (params) => axiosClient.get("/dashboard", { params });
