import axios from 'axios';

const api = axios.create({
  baseURL: '/daybook-api/api', // Reaching existing backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Interceptor for JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
