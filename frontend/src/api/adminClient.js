import axios from "axios";
import { BASE_URL } from "./axiosClient";

// توكن الأدمن متخزن في مكان منفصل تمامًا عن توكن المستخدم العادي
const ADMIN_TOKEN_KEY = "adminToken";

const adminClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// بيتسجّل من AdminProtectedRoute عشان يحوّل للوجين لما الجلسة تنتهي
let onUnauthorized = null;
export const setAdminUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 على طلب كان معاه توكن = الجلسة انتهت (مش باسورد غلط في اللوجين)
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default adminClient;
export { ADMIN_TOKEN_KEY };
