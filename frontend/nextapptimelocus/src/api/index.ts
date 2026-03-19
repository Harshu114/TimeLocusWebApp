// ─── src/api/axiosInstance.ts ─────────────────────────────────────────────────
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('tl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tl_token');
      localStorage.removeItem('tl_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;


// ─── src/api/authApi.ts ───────────────────────────────────────────────────────
export const authApi = {
  checkUser:     (identifier: string) => api.get(`/auth/check-user?identifier=${encodeURIComponent(identifier)}`),
  login:         (email: string, password: string) => api.post('/auth/login', { email, password }),
  register:      (data: RegisterPayload) => api.post('/auth/register', data),
  forgotPassword:(email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) => api.post('/auth/reset-password', { token, newPassword }),
  refresh:       (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

export interface RegisterPayload {
  firstName: string;
  lastName:  string;
  email:     string;
  password:  string;
  age:       number;
  gender:    string;
  profession:string;
  userType:  'student' | 'corporate' | 'self_employed';
}


// ─── src/api/timeApi.ts ───────────────────────────────────────────────────────
export const timeApi = {
  getByDate:    (date?: string) => api.get('/time-entries', { params: { date } }),
  getRange:     (from: string, to: string) => api.get('/time-entries/range', { params: { from, to } }),
  dailySummary: (date?: string) => api.get('/time-entries/summary/daily', { params: { date } }),
  weeklySummary:() => api.get('/time-entries/summary/weekly'),
  create:       (data: CreateEntryPayload) => api.post('/time-entries', data),
  startTimer:   (task: string, category: string) => api.post('/time-entries/start', { task, category }),
  stopTimer:    (id: string) => api.post(`/time-entries/${id}/stop`),
  update:       (id: string, data: CreateEntryPayload) => api.put(`/time-entries/${id}`, data),
  delete:       (id: string) => api.delete(`/time-entries/${id}`),
};

export interface CreateEntryPayload {
  task:       string;
  date?:      string;
  startTime?: string;
  endTime?:   string;
  duration?:  number;
  category?:  string;
  notes?:     string;
}


// ─── src/api/aiApi.ts ─────────────────────────────────────────────────────────
export const aiApi = {
  chat:     (message: string, context?: string) => api.post('/ai/chat', { message, context }),
  insights: () => api.get('/ai/insights'),
  recall:   (topic: string, difficulty: string, count = 5) => api.post('/ai/recall', { topic, difficulty, count }),
};


// ─── src/api/userApi.ts ───────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: Partial<{ firstName: string; lastName: string; profession: string; age: number }>) =>
    api.put('/users/me', data),
  getStats: () => api.get('/users/me/stats'),
};
