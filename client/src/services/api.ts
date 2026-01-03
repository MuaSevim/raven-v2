import axios from 'axios';
import { LOCAL_NETWORK_IP } from '../config';

// API URL for local development with physical devices
const API_URL = `http://${LOCAL_NETWORK_IP}:3000`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // Increased to 60 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number;
  country: string;
  countryCode: string;
  city: string;
}

export interface SyncUserData {
  idToken: string;
  firstName?: string;
  lastName?: string;
  birthDay?: number;
  birthMonth?: number;
  birthYear?: number;
  country?: string;
  countryCode?: string;
  city?: string;
}

// Auth API functions
export const authApi = {
  /**
   * Check if email already exists
   */
  checkEmail: async (email: string): Promise<{ exists: boolean }> => {
    const response = await api.get('/auth/check-email', { params: { email } });
    return response.data;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterUserData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  /**
   * Send verification code
   */
  sendCode: async (email: string) => {
    const response = await api.post('/auth/send-code', { email });
    return response.data;
  },

  /**
   * Verify email with code
   */
  verify: async (email: string, code: string) => {
    const response = await api.post('/auth/verify', { email, code });
    return response.data;
  },

  /**
   * Sync user after social login
   */
  sync: async (data: SyncUserData) => {
    const response = await api.post('/auth/sync', data);
    return response.data;
  },

  /**
   * Get current user profile (requires auth token)
   */
  getMe: async (token: string) => {
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  /**
   * Update user profile (requires auth token)
   */
  updateMe: async (token: string, data: Partial<RegisterUserData>) => {
    const response = await api.put('/auth/me', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

export default api;
