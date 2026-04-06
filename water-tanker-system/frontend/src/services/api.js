import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wt_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  getUsers: () => api.get('/auth/users'),
};

export const villageAPI = {
  getAll: () => api.get('/villages'),
  getById: (id) => api.get(`/villages/${id}`),
  create: (data) => api.post('/villages', data),
  update: (id, data) => api.put(`/villages/${id}`, data),
  delete: (id) => api.delete(`/villages/${id}`),
  getPrioritized: () => api.get('/villages/prioritized'),
  getDemand: (id) => api.get(`/villages/${id}/demand`),
};

export const tankerAPI = {
  getAll: () => api.get('/tankers'),
  getAvailable: () => api.get('/tankers/available'),
  getById: (id) => api.get(`/tankers/${id}`),
  create: (data) => api.post('/tankers', data),
  update: (id, data) => api.put(`/tankers/${id}`, data),
  delete: (id) => api.delete(`/tankers/${id}`),
  updateLocation: (id, loc) => api.put(`/tankers/${id}/location`, loc),
};

export const deliveryAPI = {
  getAll: (params) => api.get('/deliveries', { params }),
  getById: (id) => api.get(`/deliveries/${id}`),
  schedule: (data) => api.post('/deliveries', data),
  updateStatus: (id, data) => api.put(`/deliveries/${id}`, data),
  getLogs: (params) => api.get('/deliveries/logs', { params }),
  updateLocation: (id, loc) => api.put(`/deliveries/${id}/location`, loc),
};

export const complaintAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  resolve: (id, data) => api.put(`/complaints/${id}`, data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getAlerts: () => api.get('/dashboard/alerts'),
  markAlertRead: (id) => api.put(`/dashboard/alerts/${id}/read`),
};

export default api;
