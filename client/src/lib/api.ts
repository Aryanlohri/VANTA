import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor — attach auth token
api.interceptors.request.use((config) => {
  // Only set Content-Type for requests with a body
  if (config.method && ['post', 'put', 'patch'].includes(config.method)) {
    config.headers['Content-Type'] = 'application/json';
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('aicr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aicr_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---- API methods ----

export const authApi = {
  getLoginUrl: () => api.get('/auth/github'),
  getProfile: () => api.get('/auth/me'),
};

export const repoApi = {
  listConnected: () => api.get('/repos'),
  listGitHub: (page = 1) => api.get(`/repos/github?page=${page}`),
  connect: (data: any) => api.post('/repos/connect', data),
  disconnect: (id: string) => api.delete(`/repos/${id}`),
  getById: (id: string) => api.get(`/repos/${id}`),
  listFiles: (id: string, branch?: string) =>
    api.get(`/repos/${id}/files${branch ? `?branch=${branch}` : ''}`),
  getFileContent: (id: string, path: string) =>
    api.get(`/repos/${id}/content/${path}`),
};

export const reviewApi = {
  create: (data: { repo_id: string; title: string; files: any[] }) =>
    api.post('/reviews', data),
  list: (page = 1) => api.get(`/reviews?page=${page}`),
  getById: (id: string) => api.get(`/reviews/${id}`),
  deleteReview: (id: string) => api.delete(`/reviews/${id}`),
};

export const paymentApi = {
  getPlans: () => api.get('/payment/plans'),
  createOrder: (data: { plan: string; billing_cycle: string }) =>
    api.post('/payment/create-order', data),
  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    plan: string;
    billing_cycle: string;
  }) => api.post('/payment/verify', data),
  getUsage: () => api.get('/payment/usage'),
};
