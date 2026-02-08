import axiosClient from './axiosClient';

const userApi = {
  getUserById: (userId) => {
    return axiosClient.get(`/users/${userId}`);
  },

  getUserByEmail: (email) => {
    return axiosClient.get(`/users/email/${email}`);
  },

  getAllTeamMembers: () => {
    return axiosClient.get('/users/team');
  },

  getAllUsers: () => {
    return axiosClient.get('/users/all');
  },

  updateUser: (userId, userData) => {
    return axiosClient.put(`/users/${userId}`, userData);
  },

  changePassword: (userId, passwordData) => {
    return axiosClient.post(`/users/${userId}/change-password`, passwordData);
  },

  deactivateUser: (userId) => {
    return axiosClient.patch(`/users/${userId}/deactivate`);
  },

  deleteUserPermanently: (userId) => {
    return axiosClient.delete(`/users/${userId}/permanent`);
  },
};

export default userApi;
