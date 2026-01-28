import axiosClient from './axiosClient';

const meetingApi = {
  scheduleGoogleMeet: (meetData) => {
    return axiosClient.post('/meetings/schedule-meet', meetData);
  },

  scheduleCall: (callData) => {
    return axiosClient.post('/meetings/schedule-call', callData);
  },

  syncTaskWithCalendar: (taskId) => {
    return axiosClient.post(`/meetings/sync/${taskId}`);
  },
};

export default meetingApi;
