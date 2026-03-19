import api from "./axios.js";

export const claimAPI = {
  submit:          (formData) => api.post("/claims", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getMine:         (params)   => api.get("/claims/my-claims", { params }),
  getById:         (id)       => api.get(`/claims/${id}`),
  withdraw:        (id, data) => api.delete(`/claims/${id}/withdraw`, { data }),
  // Adjuster
  getQueue:        (params)   => api.get("/claims/adjuster/queue", { params }),
  review:          (id, data) => api.patch(`/claims/${id}/review`, data),
  // Admin
  assign:          (id, data) => api.patch(`/claims/${id}/assign`, data),
  adminGetAll:     (params)   => api.get("/claims/admin/all", { params }),
  getStats:        ()         => api.get("/claims/admin/stats"),
};
