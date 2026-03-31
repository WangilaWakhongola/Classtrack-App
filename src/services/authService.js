import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.API_URL || 'http://YOUR_BACKEND_URL:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authService = {
  async login(studentId, password) {
    try {
      const res = await api.post('/auth/login', { studentId, password });
      return { success: true, token: res.data.token, user: res.data.user };
    } catch (e) {
      return { success: false, message: e.response?.data?.message || 'Login failed' };
    }
  },

  async biometricLogin() {
    try {
      const savedId = await AsyncStorage.getItem('saved_student_id');
      if (!savedId) return { success: false, message: 'No saved credentials' };
      const res = await api.post('/auth/biometric', { studentId: savedId });
      return { success: true, token: res.data.token, user: res.data.user };
    } catch (e) {
      return { success: false };
    }
  },

  async register(data) {
    try {
      const res = await api.post('/auth/register', data);
      return { success: true, ...res.data };
    } catch (e) {
      return { success: false, message: e.response?.data?.message };
    }
  },
};
