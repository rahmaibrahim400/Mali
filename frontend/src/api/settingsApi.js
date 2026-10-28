import axiosClient from "./axiosClient";

export const getProfile = () => axiosClient.get("/settings/profile");

export const updateProfile = ({ name, phone }) =>
  axiosClient.put("/settings/profile", { name, phone });

export const uploadPhoto = (avatar) => axiosClient.post("/settings/photo", { avatar });

export const deletePhoto = () => axiosClient.delete("/settings/photo");

export const requestEmailChange = (email) =>
  axiosClient.post("/settings/email/request", { email });

export const confirmEmailChange = (code) =>
  axiosClient.post("/settings/email/confirm", { code });

export const saveLocale = (locale) => axiosClient.put("/settings/locale", { locale });

export const changePassword = ({ currentPassword, newPassword, confirmPassword }) =>
  axiosClient.put("/settings/password", { currentPassword, newPassword, confirmPassword });
