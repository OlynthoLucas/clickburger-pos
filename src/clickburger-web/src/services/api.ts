import axios, { type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/authStore";
import { refreshApi } from "./authApi";

function getAuthorizationHeader(config: InternalAxiosRequestConfig): string {
  const h = config.headers;
  if (!h) return "";
  if (typeof h.get === "function") {
    const v = h.get("Authorization");
    return typeof v === "string" ? v : "";
  }
  const v = (h as unknown as Record<string, unknown>).Authorization;
  return typeof v === "string" ? v : "";
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5004",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Shared promise so that concurrent 401s trigger only one refresh request.
let _refreshPromise: Promise<{ token: string; refreshToken: string }> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const config = error.config;
    const requestUrl = config?.url ?? "";

    if (status === 401 && config && !config._retry) {
      const authHeader = getAuthorizationHeader(config);
      if (authHeader.startsWith("Bearer ")) {
        config._retry = true;
        try {
          if (!_refreshPromise) {
            const refresh = useAuthStore.getState().refreshToken;
            if (!refresh) throw new Error("no refresh token");
            _refreshPromise = refreshApi(refresh).finally(() => {
              _refreshPromise = null;
            });
          }
          const { token, refreshToken } = await _refreshPromise;
          const user = useAuthStore.getState().user;
          if (user) useAuthStore.getState().setAuth(user, token, refreshToken);
          if (typeof config.headers?.set === "function")
            config.headers.set("Authorization", `Bearer ${token}`);
          else config.headers.Authorization = `Bearer ${token}`;
          return api(config);
        } catch {
          useAuthStore.getState().logout();
          return Promise.reject(error);
        }
      }
    }

    if (
      (status === 401 || status === 403) &&
      !requestUrl.includes("/api/auth/login")
    ) {
      useAuthStore.getState().logout();
    }

    if (error.response && error.response.status >= 500) {
      console.error("Erro interno no servidor:", error.response.data);
    } else if (!error.response) {
      console.error("Erro na requisição:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
