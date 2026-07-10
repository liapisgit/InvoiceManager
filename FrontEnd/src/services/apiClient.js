import axios from "axios";
import { getToken, clearToken } from "./auth";

const apiBaseUrl = (
  import.meta.env.VITE_API_BASE_URL || "http://192.168.1.102:8081"
).replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
});

// Request interceptor: add Bearer token automatically
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optional response interceptor: handle unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      // optional: redirect to login
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
