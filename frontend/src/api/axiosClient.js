import axios from 'axios';
import storageManager from '../utils/storageManager';
import store from '../store';
import { logout } from '../slices/authSlice';

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
    console.log('=== AXIOS REQUEST INTERCEPTOR ===');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    console.log('Token from storage:', token);
    console.log('Token exists:', !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers.Authorization);
    } else {
      console.log('No token found, not setting Authorization header');
    }
    
    console.log('Full headers:', config.headers);
    return config;
  },
  (error) => {
    console.log('=== AXIOS REQUEST ERROR ===');
    console.log('Request error:', error);
    return Promise.reject(error);
  }
);

// Handle responses
axiosClient.interceptors.response.use(
  (response) => {
    console.log('=== AXIOS RESPONSE SUCCESS ===');
    console.log('URL:', response.config.url);
    console.log('Status:', response.status);
    return response;
  },
  (error) => {
    console.log('=== AXIOS RESPONSE ERROR ===');
    console.log('Error URL:', error.config?.url);
    console.log('Error status:', error.response?.status);
    console.log('Error message:', error.message);
    
    // ONLY logout on 401 if it's NOT a network error or token issue
    if (error.response?.status === 401) {
      console.log('401 received - checking if token exists before logout');
      
      const token = storageManager.getAuthToken();
      
      // Only logout if token doesn't exist (real logout scenario)
      if (!token) {
        console.log('No token found - legitimate logout');
        store.dispatch(logout());
        window.location.href = '/login';
      } else {
        console.log('Token exists but got 401 - this is a backend issue, not logging out');
        console.log('Token length:', token.length);
        console.log('Token preview:', token.substring(0, 50) + '...');
        
        // Don't automatically logout - let the user see the error
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
