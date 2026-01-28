import axios from 'axios';
import storageManager from '../utils/storageManager';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
axiosClient.interceptors.request.use(
  (config) => {
    const token = storageManager.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storageManager.clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
