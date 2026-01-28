import axiosClient from './axiosClient';

const taskApi = {
  createTask: (taskData) => {
    return axiosClient.post('/tasks', taskData);
  },

  getTaskById: (taskId) => {
    return axiosClient.get(`/tasks/${taskId}`);
  },

  getUserTasks: () => {
    return axiosClient.get('/tasks/user/my-tasks');
  },

  getAssignedTasks: () => {
    return axiosClient.get('/tasks/user/assigned');
  },

  getCreatedTasks: () => {
    return axiosClient.get('/tasks/user/created');
  },

  getTasksByStatus: (status) => {
    return axiosClient.get(`/tasks/status/${status}`);
  },

  getTasksByPriority: (priority) => {
    return axiosClient.get(`/tasks/priority/${priority}`);
  },

  getUpcomingTasks: () => {
    return axiosClient.get('/tasks/upcoming');
  },

  getOverdueTasks: () => {
    return axiosClient.get('/tasks/overdue');
  },

  updateTask: (taskId, taskData) => {
    return axiosClient.put(`/tasks/${taskId}`, taskData);
  },

  completeTask: (taskId) => {
    return axiosClient.patch(`/tasks/${taskId}/complete`);
  },

  assignTask: (taskId, userId) => {
    return axiosClient.patch(`/tasks/${taskId}/assign/${userId}`);
  },

  deleteTask: (taskId) => {
    return axiosClient.delete(`/tasks/${taskId}`);
  },
};

export default taskApi;
