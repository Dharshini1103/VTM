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
};

export default authApi;
