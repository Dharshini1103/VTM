/**
 * Storage Manager Utility
 * Handles all local storage operations for authentication
 */

const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER: 'user',
  REMEMBER_ME: 'rememberMe',
  SAVED_EMAIL: 'savedEmail',
  SAVED_PASSWORD: 'savedPassword',
};

const storageManager = {
  // Auth Token Management
  setAuthToken: (token) => {
    console.log('=== STORAGE MANAGER SET TOKEN ===');
    console.log('Token to store:', token);
    console.log('Token length:', token ? token.length : 'null');
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    console.log('Token stored in localStorage:', localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN));
    console.log('=== STORAGE MANAGER SET TOKEN END ===');
  },

  getAuthToken: () => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    console.log('=== STORAGE MANAGER GET TOKEN ===');
    console.log('Token retrieved from localStorage:', token);
    console.log('Token length:', token ? token.length : 'null');
    console.log('=== STORAGE MANAGER GET TOKEN END ===');
    return token;
  },

  removeAuthToken: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  // User Management
  setUser: (user) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  getUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },

  removeUser: () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Credentials Management (Remember Me)
  setCredentials: (email, password) => {
    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
    localStorage.setItem(STORAGE_KEYS.SAVED_EMAIL, email);
    localStorage.setItem(STORAGE_KEYS.SAVED_PASSWORD, password);
  },

  getCredentials: () => {
    return {
      rememberMe: JSON.parse(localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) || 'false'),
      email: localStorage.getItem(STORAGE_KEYS.SAVED_EMAIL) || '',
      password: localStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD) || '',
    };
  },

  removeCredentials: () => {
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    localStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD);
  },

  // Clear all auth data
  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
    localStorage.removeItem(STORAGE_KEYS.SAVED_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.SAVED_PASSWORD);
  },

  // Clear only session (keep credentials if remember me is on)
  clearSession: () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Check if user has saved credentials
  hasSavedCredentials: () => {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) || 'false') &&
           !!localStorage.getItem(STORAGE_KEYS.SAVED_EMAIL) &&
           !!localStorage.getItem(STORAGE_KEYS.SAVED_PASSWORD);
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};

export default storageManager;
