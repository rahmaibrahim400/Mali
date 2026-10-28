import axiosClient from "./axiosClient";

const BASE = "/expense-categories";

// Fix #2 & #3 — type is now required by backend
export async function listCategories() {
  const res = await axiosClient.get(BASE);
  return res.data.data;
}

export async function createCategory({ name, type, color }) {
  const res = await axiosClient.post(BASE, { name, type, color });
  return res.data.data;
}

export async function updateCategory(id, { name, type, color }) {
  const res = await axiosClient.put(`${BASE}/${id}`, { name, type, color });
  return res.data.data;
}

export async function deleteCategory(id) {
  await axiosClient.delete(`${BASE}/${id}`);
}