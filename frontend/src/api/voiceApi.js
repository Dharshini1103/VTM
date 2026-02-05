import axiosClient from './axiosClient';

const voiceApi = {
  processVoiceCommand: (voiceData) => {
    return axiosClient.post('/voice/process', voiceData);
  },

  createTaskFromVoice: (voiceData) => {
    return axiosClient.post('/voice/create-task', voiceData);
  },

  getVoiceCommand: (commandId) => {
    return axiosClient.get(`/voice/${commandId}`);
  },

  getUserCommands: () => {
    return axiosClient.get('/voice/user/commands');
  },

  markCommandAsProcessed: (commandId) => {
    return axiosClient.post(`/voice/${commandId}/mark-processed`);
  },
 
  scheduleCall: (payload) => {
    return axiosClient.post('/voice/schedule-call', payload);
  },

  deleteVoiceCommand: (commandId) => {
    return axiosClient.delete(`/voice/${commandId}`);
  },
};

export default voiceApi;
