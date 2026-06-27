/*
 * [면접] axios 공통 설정
 * Q. 토큰은 어떻게 붙나? → 요청 인터셉터가 localStorage 토큰을 Authorization 헤더에 자동 첨부
 * Q. 401이면? → 로그인 만료로 보고 저장된 인증 정보 삭제 후 /login 이동
 */
import axios from "axios";
import { getErrorMessage } from "./errorHandler.js";
import { clearAuthState, getAuthState } from "./authStorage.js";
import { resolveApiConfig } from "./runtimeConfig.js";

const { apiBaseUrl: API_BASE_URL } = resolveApiConfig();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthState().token;
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
    const reqUrl = String(error.config?.url || "");
    const isAuthLogin =
      String(error.config?.method || "").toLowerCase() === "post" &&
      /(^|\/)auth\/login(\?|$)/.test(reqUrl);

    const shouldResetAuth =
      status === 401 ||
      (status === 403 && /유효하지 않은 토큰|인증 토큰/i.test(serverMessage));

    if (shouldResetAuth && !isAuthLogin) {
      clearAuthState();
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
