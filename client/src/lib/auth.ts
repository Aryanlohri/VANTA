'use client';

import { create } from 'zustand';
import { authApi } from './api';

interface User {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  loadUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('aicr_token') : null,
  isLoading: true,
  isAuthenticated: false,

  setToken: (token: string) => {
    localStorage.setItem('aicr_token', token);
    set({ token, isAuthenticated: true });
  },

  loadUser: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('aicr_token') : null;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await authApi.getProfile();
      set({
        user: response.data.data,
        isAuthenticated: true,
        isLoading: false,
        token,
      });
    } catch {
      localStorage.removeItem('aicr_token');
      set({ user: null, isAuthenticated: false, isLoading: false, token: null });
    }
  },

  logout: () => {
    localStorage.removeItem('aicr_token');
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = '/login';
  },
}));
