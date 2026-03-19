import api from "./axios.js";

export const authAPI = {
  register:             (data)  => api.post("/auth/register", data),
  login:                (data)  => api.post("/auth/login", data),
  logout:               ()      => api.post("/auth/logout"),
  getMe:                ()      => api.get("/auth/me"),
  verifyEmail:          (token) => api.get(`/auth/verify-email?token=${token}`),
  resendVerification:   (email) => api.post("/auth/resend-verification", { email }),
  forgotPassword:       (email) => api.post("/auth/forgot-password", { email }),
  resetPassword:        (data)  => api.post("/auth/reset-password", data),
  changePassword:       (data)  => api.patch("/auth/change-password", data),
};
