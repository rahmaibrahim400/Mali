import adminClient from "./adminClient";

// The signed-in admin's own account
export const updateAdminProfile = (name) => adminClient.put("/admin/settings/profile", { name });
export const uploadAdminPhoto = (avatar) => adminClient.put("/admin/settings/photo", { avatar });
export const deleteAdminPhoto = () => adminClient.delete("/admin/settings/photo");
export const changeAdminEmail = (email, currentPassword) =>
  adminClient.put("/admin/settings/email", { email, currentPassword });
export const changeAdminPassword = (payload) => adminClient.put("/admin/settings/password", payload);
