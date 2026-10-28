import axiosClient from "./axiosClient";

// إنشاء حساب جديد
export const createAccount = ({ name, type, balance, currency, color }) =>
  axiosClient.post("/accounts", { name, type, balance, currency, color });

// هاتلي كل الحسابات الموجودة للمستخدم
// عشان يعرض الحسابات اللي المستخدم هيختار منها.
export const getAccounts = () => axiosClient.get("/accounts");

export const getAccountTransactions = (accountId, { start, end } = {}) =>
  axiosClient.get(`/accounts/${accountId}/transactions`, {
    params: { start, end },
  });

// تعديل رصيد حساب موجود وتسجيل سبب التعديل في تاريخ الحساب
export const adjustBalance = ({ accountId, newBalance, notes }) =>
  axiosClient.post(`/accounts/${accountId}/adjust`, {
    newBalance,
    notes,
  });

// تحويل فلوس بين حسابين
export const transferFunds = ({ fromId, toId, amount, description }) =>
  axiosClient.post("/accounts/transfer", {
    fromId,
    toId,
    amount,
    description,
  });

// أرشفة أو إعادة تفعيل حساب
export const archiveAccountApi = (id) =>
  axiosClient.patch(`/accounts/${id}/archive`);