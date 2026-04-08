import axios from "axios";
import { getErrorMessage } from "./errorHandler.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3102/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10초 타임아웃
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message || "";
    const shouldResetAuth =
      status === 401 ||
      (status === 403 && /유효하지 않은 토큰|인증 토큰/i.test(serverMessage));

    if (shouldResetAuth) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    
    const message = getErrorMessage(error);
    error.userMessage = message;
    return Promise.reject(error);
  }
);

export default api;
