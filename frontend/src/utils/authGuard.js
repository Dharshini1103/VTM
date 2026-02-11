/**
 * Authentication Guard Utility
 * Prevents automatic logout by validating tokens before API calls
 */

import storageManager from './storageManager';

const authGuard = {
  /**
   * Check if user is properly authenticated
   * @returns {boolean} - true if authenticated, false otherwise
   */
  isAuthenticated: () => {
    const token = storageManager.getAuthToken();
    const user = storageManager.getUser();
    
    console.log('=== AUTH GUARD CHECK ===');
    console.log('Token exists:', !!token);
    console.log('Token length:', token ? token.length : 0);
    console.log('User exists:', !!user);
    
    return !!(token && user && token.length > 0);
  },

  /**
   * Validate token format (basic JWT validation)
   * @param {string} token - JWT token to validate
   * @returns {boolean} - true if token format is valid
   */
  validateTokenFormat: (token) => {
    if (!token || typeof token !== 'string') return false;
    
    // Basic JWT format check: 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3;
  },

  /**
   * Safe API call wrapper that prevents automatic logout
   * @param {Function} apiCall - API function to call
   * @param {Object} options - Additional options
   * @returns {Promise} - API call promise
   */
  safeApiCall: async (apiCall, options = {}) => {
    const { skipAuthCheck = false } = options;
    
    if (!skipAuthCheck && !authGuard.isAuthenticated()) {
      console.log('AUTH GUARD: User not authenticated, skipping API call');
      throw new Error('User not authenticated');
    }
    
    const token = storageManager.getAuthToken();
    
    if (!authGuard.validateTokenFormat(token)) {
      console.log('AUTH GUARD: Invalid token format');
      throw new Error('Invalid token format');
    }
    
    console.log('AUTH GUARD: Token validated, proceeding with API call');
    
    try {
      const response = await apiCall();
      console.log('AUTH GUARD: API call successful');
      return response;
    } catch (error) {
      console.log('AUTH GUARD: API call failed:', error.message);
      
      // Don't automatically logout on 401 - let the caller handle it
      if (error.response?.status === 401) {
        console.log('AUTH GUARD: 401 error - NOT logging out automatically');
      }
      
      throw error;
    }
  },

  /**
   * Force logout (only call this explicitly)
   */
  forceLogout: () => {
    console.log('AUTH GUARD: Force logout called');
    storageManager.clearAll();
    window.location.href = '/login';
  }
};

export default authGuard;
