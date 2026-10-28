import axiosClient from "./axiosClient";

export const getIncomeExpenses = (months) => axiosClient.get("/reports/income-expenses", { params: { months } });

export const getCategories = (months) => axiosClient.get("/reports/categories", { params: { months } });

export const getCashFlow = (months) => axiosClient.get("/reports/cash-flow", { params: { months } });

export const getSavingsRate = (months) => axiosClient.get("/reports/savings", { params: { months } });

export const getNetWorth = (months) => axiosClient.get("/reports/net-worth", { params: { months } });

export const getDebtProgress = () => axiosClient.get("/reports/debts");

export const getSpendingHabits = (months) => axiosClient.get("/reports/habits", { params: { months } });
