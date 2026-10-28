import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
// اسم المكان اللي محفوظ فيه الـ Token 
const TOKEN_KEY = "authToken";

const axiosClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});


// قبل ما أي request يخرج من الـ frontend للـ backend، هات الـ token من localStorage وحطه في Authorization Header. 
export const SUBSCRIPTION_EXPIRED_EVENT = "subscription-expired";

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// بعد ما الـ backend يرد، الكود ده بيتنفذ
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
    }

    // The plan ended while the app was open: let the layout re-read it and show the banner.
    if (error.response?.data?.code === "SUBSCRIPTION_EXPIRED") {
      window.dispatchEvent(new Event(SUBSCRIPTION_EXPIRED_EVENT));
    }

    // متخبيش الـ error؛ خلي الـ component اللي استدعى الـ API يعرف إن فيه خطأ.
    return Promise.reject(error);
  }
);

export default axiosClient;
export { TOKEN_KEY, BASE_URL };
