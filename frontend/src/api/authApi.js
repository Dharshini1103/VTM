import axiosClient from './axiosClient';

const authApi = {
  login: (email, password) => {
    return axiosClient.post('/auth/login', { email, password });
  },

  register: (data) => {
    return axiosClient.post('/auth/register', data);
  },

  getCurrentUser: () => {
    return axiosClient.get('/users/me');
  },
};

export default authApi;
