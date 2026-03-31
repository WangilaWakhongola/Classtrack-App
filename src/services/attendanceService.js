import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.API_URL || 'http://YOUR_BACKEND_URL:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const attendanceService = {
  async getTodayClasses(studentId) {
    const res = await api.get(`/classes/today/${studentId}`);
    return res.data;
  },

  async checkAlreadySigned(studentId, classId) {
    const res = await api.get(`/attendance/check`, { params: { studentId, classId } });
    return res.data.signed;
  },

  async signAttendance({ studentId, classId, latitude, longitude, selfieUri, timestamp }) {
    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('classId', classId);
    formData.append('latitude', latitude);
    formData.append('longitude', longitude);
    formData.append('timestamp', timestamp);
    if (selfieUri) {
      formData.append('selfie', {
        uri: selfieUri,
        type: 'image/jpeg',
        name: 'selfie.jpg',
      });
    }
    const res = await api.post('/attendance/sign', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getStudentStats(studentId) {
    const res = await api.get(`/attendance/stats/${studentId}`);
    return res.data;
  },

  async getReports(studentId, period) {
    const res = await api.get(`/attendance/reports/${studentId}`, { params: { period } });
    return res.data;
  },
};
