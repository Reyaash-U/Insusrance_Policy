import api from "./axios.js";

export const policyAPI = {
  getAll:           (params) => api.get("/policies", { params }),
  getById:          (id)     => api.get(`/policies/${id}`),
  getBySlug:        (slug)   => api.get(`/policies/slug/${slug}`),
  getMine:          (params) => api.get("/policies/my-policies", { params }),
  getMyById:        (id)     => api.get(`/policies/my-policies/${id}`),
  calculatePremium: (data)   => api.post("/policies/calculate-premium", data),
  purchase:         (data)   => api.post("/policies/purchase", data),
  // Admin
  create:           (data)   => api.post("/policies", data),
  update:           (id, data) => api.put(`/policies/${id}`, data),
  remove:           (id)     => api.delete(`/policies/${id}`),
  adminGetAll:      (params) => api.get("/policies/admin/all", { params }),
  adminGetPurchased:(params) => api.get("/policies/admin/purchased", { params }),
};
