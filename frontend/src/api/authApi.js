import axiosClient from './axiosClient';

const authApi = {
  login: (gmailId, password) => {
    return axiosClient.post('/auth/login', { gmailId, password });
  },

  register: (data) => {
    return axiosClient.post('/auth/register', data);
  },

  getCurrentUser: () => {
    return axiosClient.get('/users/me');
  },

  updatePassword: (oldPassword, newPassword) => {
    return axiosClient.put('/auth/update-password', { oldPassword, newPassword });
  },

  forgotPassword: (gmailId) => {
    return axiosClient.post('/auth/forgot-password', { gmailId });
  },

  verifyOtp: (gmailId, otp) => {
    return axiosClient.post('/auth/verify-otp', { gmailId, otp });
  },

  resetPassword: (gmailId, newPassword) => {
    return axiosClient.post('/auth/reset-password', { gmailId, newPassword });
  },
};

export default authApi;
