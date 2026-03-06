import axios from "axios";
import { getErrorMessage } from "./errorHandler.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 - JWT 토큰 추가
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

// 응답 인터셉터 - 공통 에러 처리
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 에러 시 토큰 제거 및 로그인 페이지로 리다이렉트
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // 로그인 페이지로 리다이렉트 (라우터가 있는 경우)
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    
    // 에러를 사용자 친화적인 메시지로 변환
    const message = getErrorMessage(error);
    error.userMessage = message;
    return Promise.reject(error);
  }
);

export default api;
