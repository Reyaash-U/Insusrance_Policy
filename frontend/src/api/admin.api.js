import api from "./axios.js";

export const adminAPI = {
  getStats:        () => api.get("/admin/stats"),
  getUsers:        (params) => api.get("/admin/users", { params }),
  updateUserRole:  (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleUserStatus:(id) => api.patch(`/admin/users/${id}/toggle-status`),
  getFraudLogs:    (params) => api.get("/fraud/logs", { params }),
  getFraudStats:   () => api.get("/fraud/stats"),
  recheckFraud:    (claimId) => api.post(`/fraud/recheck/${claimId}`),
  resolveFraud:    (logId, data) => api.patch(`/fraud/logs/${logId}/resolve`, data),
  broadcast:       (data) => api.post("/notifications/broadcast", data),
};
