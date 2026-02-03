import axiosClient from './axiosClient';

const userApi = {
  getUserById: (userId) => {
    return axiosClient.get(`/users/${userId}`);
  },

  getUserByEmail: (email) => {
    return axiosClient.get(`/users/email/${email}`);
  },

  getAllTeamMembers: () => {
    return axiosClient.get('/users');
  },

  getAllUsers: () => {
    return axiosClient.get('/users/all');
  },

  updateUser: (userId, userData) => {
    return axiosClient.put(`/users/${userId}`, userData);
  },

  deactivateUser: (userId) => {
    return axiosClient.delete(`/users/${userId}`);
  },

  deleteUserPermanently: (userId) => {
    return axiosClient.delete(`/users/${userId}/permanent`);
  },
};

export default userApi;
