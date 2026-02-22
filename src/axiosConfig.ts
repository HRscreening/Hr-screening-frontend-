// src/axiosConfig.ts
import axios from "axios";
import { useContextStore } from "@/store/contextStore";

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

export default axios;
