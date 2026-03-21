// src/axiosConfig.ts
import axios from "axios";
import { useContextStore } from "@/store/contextStore";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

axios.defaults.baseURL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8000/api";

// Helpful runtime visibility in DevTools console
console.info("[axios] VITE_BACKEND_URL =", import.meta.env.VITE_BACKEND_URL);
console.info("[axios] axios.defaults.baseURL =", axios.defaults.baseURL);

// ❌ REMOVE THIS
// axios.defaults.withCredentials = true;

// ✅ Attach token + context automatically
axios.interceptors.request.use((config) => {
  // ---- JWT ----
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ---- Context ----
  const ctx = useContextStore.getState().context;
  config.headers["X-Context-Type"] = ctx.type;

  if (ctx.type === "org") {
    config.headers["X-Context-Id"] = ctx.orgId;
  }

  return config;
});

// ✅ Handle 401 — session expired or invalid token
let isRedirecting = false;
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginPage = window.location.pathname === "/";
    if (error.response?.status === 401 && !isRedirecting && !isLoginPage) {
      isRedirecting = true;
      localStorage.removeItem("access_token");
      useAuthStore.getState().clearUser();
      toast.error("Session expired. Please log in again.");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default axios;
