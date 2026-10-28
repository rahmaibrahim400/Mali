import axiosClient from "./axiosClient";

export const getGoals = () => axiosClient.get("/savings");

export const getGoal = (id) => axiosClient.get(`/savings/${id}`);

export const createGoal = (payload) => axiosClient.post("/savings", payload);

export const updateGoal = (id, payload) => axiosClient.put(`/savings/${id}`, payload);

export const deleteGoal = (id, payload) => axiosClient.delete(`/savings/${id}`, { data: payload });

export const depositToGoal = (id, payload) => axiosClient.post(`/savings/${id}/deposit`, payload);

export const withdrawFromGoal = (id, payload) => axiosClient.post(`/savings/${id}/withdraw`, payload);

export const completeGoal = (id, payload) => axiosClient.post(`/savings/${id}/complete`, payload);

export const archiveGoal = (id, payload) => axiosClient.post(`/savings/${id}/archive`, payload);

export const getGoalTransactions = (id) => axiosClient.get(`/savings/${id}/transactions`);
