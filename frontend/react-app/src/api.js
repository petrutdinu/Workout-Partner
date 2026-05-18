import axios from 'axios';
import { getToken, updateToken } from './keycloak';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await updateToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - redirecting to login');
    }
    return Promise.reject(error);
  }
);

export const userApi = {
  syncUser: () => api.post('/users/sync'),
  getCurrentUser: () => api.get('/users/me'),
  getUserById: (userId) => api.get(`/users/${userId}`),
  updateFitnessProfile: (data) => api.put('/users/me/fitness-profile', data),
  getAthletes: (params = {}) => api.get('/users/athletes', { params }),
  getTrainers: (params = {}) => api.get('/users/trainers', { params })
};

export const workoutApi = {
  getSessions: (params = {}) => api.get('/workouts', { params }),
  getSessionById: (id) => api.get(`/workouts/${id}`),
  createSession: (data) => api.post('/workouts', data),
  deleteSession: (id) => api.delete(`/workouts/${id}`),
  addExercise: (sessionId, data) => api.post(`/workouts/${sessionId}/exercises`, data),
  getPartnerSessions: (userId, params = {}) => api.get(`/workouts/partner/${userId}`, { params }),
  getMyStats: () => api.get('/workouts/stats'),
  estimateCalories: (data) => api.post('/workouts/calorie-estimate', data)
};

export const sharedWorkoutApi = {
  create: (data) => api.post('/shared-workouts', data),
  getMyRooms: () => api.get('/shared-workouts'),
  getRoom: (id) => api.get(`/shared-workouts/${id}`),
  getLeaderboard: (id) => api.get(`/shared-workouts/${id}/leaderboard`),
  join: (id) => api.put(`/shared-workouts/${id}/join`),
  finish: (id) => api.put(`/shared-workouts/${id}/finish`),
  addExercise: (id, data) => api.post(`/shared-workouts/${id}/exercises`, data),
};

export const matchApi = {
  getSuggestions: () => api.get('/matching/suggestions'),
  browse: (params = {}) => api.get('/matching/browse', { params }),
  getConnections: () => api.get('/matching/connections'),
  getPartners: () => api.get('/matching/partners'),
  sendRequest: (addresseeId) => api.post('/matching/connections', { addressee_id: addresseeId }),
  updateConnection: (id, status) => api.put(`/matching/connections/${id}`, { status }),
  removeConnection: (id) => api.delete(`/matching/connections/${id}`)
};

export const chatApi = {
  getMessages: (otherUserId, params = {}) => api.get(`/chat/messages/${otherUserId}`, { params }),
  markRead: (msgId) => api.put(`/chat/messages/${msgId}/read`)
};

export const gymApi = {
  getGyms: (params = {}) => api.get('/gyms', { params }),
  invalidateCache: () => api.post('/gyms/cache/invalidate')
};

export const notificationApi = {
  getAll: (params = {}) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

export default api;
