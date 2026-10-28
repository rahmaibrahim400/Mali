import axiosClient from "./axiosClient";

export const register = ({ name, email, password }) =>
  axiosClient.post("/auth/register", { name, email, password });

export const login = ({ email, password, rememberMe }) =>
  axiosClient.post("/auth/login", { email, password, rememberMe });

export const fetchMe = () => axiosClient.get("/auth/me");

export const fetchAvatar = () => axiosClient.get("/auth/avatar");

export const forgotPassword = ({ email }) =>
  axiosClient.post("/auth/forgot-password", { email });

export const resetPassword = ({ token, password }) =>
  axiosClient.post("/auth/reset-password", { token, password });
