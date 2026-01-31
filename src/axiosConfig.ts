// src/axiosConfig.ts
import axios from "axios";
import { useContextStore } from "@/store/contextStore";

axios.defaults.baseURL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api/v1";

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
