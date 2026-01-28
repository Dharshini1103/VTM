import axiosClient from './axiosClient';

const voiceApi = {
  processVoiceCommand: (voiceData) => {
    return axiosClient.post('/voice/process', voiceData);
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
};

export default voiceApi;
