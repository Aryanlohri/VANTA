import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Request interceptor — attach auth token

import { isDemoMode, demoMockData } from './demoData';
import { toast } from './toast';

api.interceptors.request.use(async (config) => {
  if (isDemoMode()) {
    // Intercept GET requests
    if (config.method?.toLowerCase() === 'get') {
      const url = config.url || '';
      if (url.includes('/repos/github')) return { ...config, adapter: async () => ({ data: { data: [] }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
      if (url.includes('/repos')) return { ...config, adapter: async () => ({ data: { data: demoMockData.repos }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
      if (url.includes('/reviews/analytics/repos')) return { ...config, adapter: async () => ({ data: { data: demoMockData.stats }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
      if (url.includes('/reviews')) return { ...config, adapter: async () => ({ data: { data: demoMockData.reviews }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
      if (url.includes('/auth/me')) return { ...config, adapter: async () => ({ data: { data: { id: 'demo-user', username: 'demo', display_name: 'Demo User' } }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
    }
    // Block write requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      toast.notify("Demo mode: write actions are disabled.", { label: "Dismiss", onClick: () => {} });
      return { ...config, adapter: async () => ({ data: { data: {} }, status: 200, statusText: 'OK', headers: {}, config: config as any }) } as any;
    }
  }

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
  create: (data: { repo_id: string; title: string; mode: string; files: any[] }) =>
    api.post('/reviews', data),
  list: (page = 1) => api.get(`/reviews?page=${page}`),
  getById: (id: string) => api.get(`/reviews/${id}`),
  deleteReview: (id: string) => api.delete(`/reviews/${id}`),
  retryReview: (id: string) => api.post(`/reviews/${id}/retry`),
  postToGitHub: (id: string) => api.post(`/reviews/${id}/github`),
  getAnalytics: () => api.get('/reviews/analytics/dashboard'),
  getRepoStats: () => api.get('/reviews/analytics/repos'),
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

export const adminApi = {
  getAuthMetrics: () => api.get('/auth/admin/metrics'),
  getReviewMetrics: () => api.get('/reviews/admin/metrics'),
};
