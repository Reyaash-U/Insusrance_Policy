import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "/api";

const axiosInstance = axios.create({
  baseURL:         BASE_URL,
  withCredentials: true,          // send httpOnly cookies
  timeout:         15000,
  headers: { "Content-Type": "application/json" },
});

// ─── Request Interceptor ──────────────────────────────────────
// Attaches the JWT from localStorage to every request (for clients
// that prefer header-based auth alongside the cookie).
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status  = error.response?.status;
    const message = error.response?.data?.message;

    // 401 → session expired, redirect to login
    if (status === 401) {
      localStorage.removeItem("token");
      // Only redirect if not already on the login page
      if (!window.location.pathname.includes("/login")) {
        toast.error("Session expired. Please log in again.");
        window.location.href = "/login";
      }
    }

    // 403 → forbidden
    if (status === 403) {
      toast.error(message || "You don't have permission to do that.");
    }

    // 429 → rate limited
    if (status === 429) {
      toast.error(message || "Too many requests. Please slow down.");
    }

    // 500+ → server error
    if (status >= 500) {
      toast.error("A server error occurred. Please try again later.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
