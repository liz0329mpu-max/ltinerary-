/**
 * API utility functions
 * Centralized API calls for frontend-backend communication
 */

import axios from 'axios';

// Base API URL - uses proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_API_URL || 'http://localhost:5000'
  : '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401/403 errors (unauthorized/forbidden) - redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理认证错误：401 (未授权) 或 403 (禁止访问，通常是 token 无效或过期)
    if (error.response?.status === 401 || error.response?.status === 403) {
      // 检查是否是 token 相关错误
      const errorMessage = error.response?.data?.error || '';
      if (errorMessage.includes('token') || errorMessage.includes('Token')) {
        console.warn('Token 无效或已过期，清除本地存储并跳转到登录页');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 使用 replace 避免在历史记录中留下无效状态
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: (username: string, email: string, password: string) =>
    api.post('/auth/register', { username, email, password }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

// Itinerary API
export const itineraryAPI = {
  getAll: () => api.get('/itinerary'),
  
  getById: (id: number) => api.get(`/itinerary/${id}`),
  
  create: (data: {
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    cover_image?: string;
  }) => api.post('/itinerary', data),
  
  update: (id: number, data: {
    title?: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    cover_image?: string;
  }) => api.put(`/itinerary/${id}`, data),
  
  delete: (id: number) => api.delete(`/itinerary/${id}`),
  
  addAttraction: (itineraryId: number, data: {
    name: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    visit_date?: string;
    visit_time?: string;
    image?: string;
  }) => api.post(`/itinerary/${itineraryId}/attraction`, data),
  
  deleteAttraction: (itineraryId: number, attractionId: number) =>
    api.delete(`/itinerary/${itineraryId}/attraction/${attractionId}`),
};

// Currency API
export const currencyAPI = {
  getRates: (base?: string) =>
    api.get('/currency/rates', { params: { base } }),
  
  convert: (amount: number, from: string, to: string) =>
    api.post('/currency/convert', { amount, from, to }),
  
  getSupported: () => api.get('/currency/supported'),
  
  getHistory: (from: string, to: string, days: number = 7) =>
    api.get('/currency/history', { params: { from, to, days } }),
};

// AI Assistant API
export const aiAPI = {
  chat: (message: string) => api.post('/ai/chat', { message }),
};

export default api;


