import { createSlice } from '@reduxjs/toolkit';
import storageManager from '../utils/storageManager';

const initialState = {
  isAuthenticated: storageManager.isAuthenticated(),
  user: storageManager.getUser(),
  token: storageManager.getAuthToken() || null,
  rememberMe: storageManager.getCredentials().rememberMe,
  savedEmail: storageManager.getCredentials().email,
  savedPassword: storageManager.getCredentials().password,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      storageManager.setAuthToken(action.payload.token);
      storageManager.setUser(action.payload.user);
      // Save credentials if remember me is enabled
      if (action.payload.rememberMe) {
        state.rememberMe = true;
        state.savedEmail = action.payload.email;
        state.savedPassword = action.payload.password;
        storageManager.setCredentials(action.payload.email, action.payload.password);
      }
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    registerStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    registerSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      storageManager.setAuthToken(action.payload.token);
      storageManager.setUser(action.payload.user);
      // Auto-save credentials after registration for future logins
      state.rememberMe = true;
      state.savedEmail = action.payload.email;
      state.savedPassword = action.payload.password;
      storageManager.setCredentials(action.payload.email, action.payload.password);
    },
    registerFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      storageManager.clearSession();
      // Keep saved credentials if remember me is enabled
      if (!state.rememberMe) {
        state.rememberMe = false;
        state.savedEmail = '';
        state.savedPassword = '';
        storageManager.removeCredentials();
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  registerStart,
  registerSuccess,
  registerFailure,
  logout,
  clearError,
} = authSlice.actions;

export default authSlice.reducer;
