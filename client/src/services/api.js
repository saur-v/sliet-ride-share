// client/src/services/api.js
// Central axios instance.
// - Automatically attaches Authorization header from localStorage
// - On 401 TOKEN_EXPIRED, silently refreshes and retries the original request
// - On hard 401 (refresh failed), redirects to /login

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: refresh on 401 ─────────────────────────────────────
let isRefreshing = false;
let failedQueue  = [];   // requests waiting for the new token

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    if (err.response?.status === 401 && !original._retry) {
      const errorCode = err.response.data?.errorCode;

      // Only attempt refresh on TOKEN_EXPIRED — not other 401s
      if (errorCode !== 'TOKEN_EXPIRED') return Promise.reject(err);

      if (isRefreshing) {
        // Queue this request until the refresh finishes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing     = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

        localStorage.setItem('accessToken',  data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`;

        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        // Hard logout
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

// ── Auth endpoints ─────────────────────────────────────────────────────────────
export const authApi = {
  register:    (data) => api.post('/auth/register', data),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  login:       (data) => api.post('/auth/login', data),
  logout:      (data) => api.post('/auth/logout', data),
};

// ── User endpoints ────────────────────────────────────────────────────────────
export const userApi = {
  getMe:      ()     => api.get('/users/me'),
  updateMe:   (data) => api.put('/users/me', data),
  getById:    (id)   => api.get(`/users/${id}`),
};

// ── Group endpoints ───────────────────────────────────────────────────────────
export const groupApi = {
  list:       (params) => api.get('/groups', { params }),
  create:     (data)   => api.post('/groups', data),
  get:        (id)     => api.get(`/groups/${id}`),
  update:     (id, data) => api.put(`/groups/${id}`, data),
  cancel:     (id)     => api.delete(`/groups/${id}`),
  join:       (id)     => api.post(`/groups/${id}/join`),
  leave:      (id)     => api.post(`/groups/${id}/leave`),
  confirm:    (id, data) => api.post(`/groups/${id}/confirm`, data),
  kick:       (id, userId) => api.post(`/groups/${id}/kick`, { userId }),
  getMembers: (id)     => api.get(`/groups/${id}/members`),
  getMessages:(id, params) => api.get(`/groups/${id}/messages`, { params }),
  sendMessage:(id, text)   => api.post(`/groups/${id}/messages`, { text }),
};

// ── Notification endpoints ────────────────────────────────────────────────────
export const notifApi = {
  list:     (params) => api.get('/notifications', { params }),
  markRead: (ids)    => api.post('/notifications/mark-read', { ids }),
};

// ── Admin endpoints ───────────────────────────────────────────────────────────
export const adminApi = {
  stats:        ()           => api.get('/admin/stats'),
  users:        (params)     => api.get('/admin/users', { params }),
  suspendUser:  (id, data)   => api.post(`/admin/suspend-user/${id}`, data),
  suspendGroup: (id, data)   => api.post(`/admin/suspend-group/${id}`, data),
  auditLogs:    (params)     => api.get('/admin/audit-logs', { params }),
};

export default api;
