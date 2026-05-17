import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// For local development, use your machine's IP address (e.g., 'http://192.168.1.XX:5000')
// For production/deployment, use your Render URL
const API_BASE_URL = 'https://travel-smart-o6mf.onrender.com/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let tokenProvider: (() => Promise<string | null>) | null = null;

export const setTokenProvider = (provider: () => Promise<string | null>) => {
  tokenProvider = provider;
};

// Request interceptor — attach Clerk token dynamically
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (tokenProvider && config.headers) {
      try {
        const token = await tokenProvider();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('🔑 API Auth: Failed to get token from provider', error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // Token expired — clear storage
      if (status === 401) {
        try {
          await SecureStore.deleteItemAsync('authToken');
        } catch {
          // Ignore SecureStore errors
        }
      }

      // Return structured error
      return Promise.reject({
        status,
        message: data?.message || 'Something went wrong',
        errors: data?.errors || [],
      });
    }

    // Network error
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        status: 0,
        message: 'Request timed out. Please check your connection.',
        errors: [],
      });
    }

    return Promise.reject({
      status: 0,
      message: 'Network error. Please check your internet connection.',
      errors: [],
    });
  }
);

// ============= API Methods =============

// --- Auth ---
export const authAPI = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  verify: () => api.get('/auth/verify'),
};

// --- Itinerary ---
export const itineraryAPI = {
  generate: (data: {
    source: string;
    destination: string;
    budget: string;
    days: number;
    people: number;
    intent: string;
  }) => api.post('/itinerary/generate', data),
};

// --- Trips ---
export const tripsAPI = {
  save: (data: any) => api.post('/trips/save', data),
  getAll: () => api.get('/trips'),
  getById: (id: string) => api.get(`/trips/${id}`),
  update: (id: string, itinerary: any) => api.put(`/trips/${id}`, { itinerary }),
  delete: (id: string) => api.delete(`/trips/${id}`),
};

// --- Chat ---
export const chatAPI = {
  ask: (message: string, context?: any) => 
    api.post('/chat/ask', { message, context }),
};

// --- Nearby ---
export const nearbyAPI = {
  search: (data: {
    latitude: number;
    longitude: number;
    category?: string;
    radius?: number;
  }) => api.post('/nearby', data),
};

// --- Contributions ---
export const contributionsAPI = {
  submit: (data: { city: string; type: string; content: string; details?: any }) =>
    api.post('/contributions', data),
};

// --- Journal ---
export const journalAPI = {
  getEntries: (tripId: string) =>
    api.get(`/trips/${tripId}/journal`),

  addEntry: (tripId: string, entry: { type: string; content: any; localId?: string }) =>
    api.post(`/trips/${tripId}/journal`, entry),

  updateEntry: (tripId: string, entryId: string, data: { content?: any; type?: string }) =>
    api.put(`/trips/${tripId}/journal/${entryId}`, data),

  deleteEntry: (tripId: string, entryId: string) =>
    api.delete(`/trips/${tripId}/journal/${entryId}`),

  syncEntries: (tripId: string, entries: any[]) =>
    api.post(`/trips/${tripId}/journal/sync`, { entries }),
};

// --- Upload ---
export const uploadAPI = {
  image: (formData: FormData) =>
    api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60s for image uploads
    }),
};

export default api;
